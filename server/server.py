import numpy as np
import torch
import socketio
import asyncio
from fastapi import FastAPI
import uvicorn

from lib.pred import LSTMPredictor, features
from lib.generator import generate_normal_data, maybe_anomaly, flatten_for_model

# ---------- Socket.IO (ASGI) ----------
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = socketio.ASGIApp(sio)

# track clients & background task
clients = set()
producer_task = None

async def produce_loop():
    """Generate -> predict -> emit every 1s, broadcast to all connected clients."""
    pred = AnomalyPredictor(artifacts_dir="artifacts", smoothing_k=3)
    sim = SimpleShipSim(feature_cols=pred.feature_cols, seed=123)

    try:
        while True:
            sample = sim.step()                           # dict mentah dari generator
            vec = pred.vectorize(sample)                 # vector sesuai urutan FEATURE_COLS
            out = pred.update_and_score(vec)             # skor AE

            # siapkan dict 'features_raw' hanya kolom fitur numerik yg dipakai model
            features_raw = {k: float(sample[k]) for k in pred.feature_cols}

            payload = {
                "timestamp": sample["timestamp"],
                "mode": sample["mode"],

                # --- hasil prediksi ---
                "score": out["score"],
                "threshold": out.get("threshold"),
                "consecutive_above": out["consecutive_above"],
                "is_anomaly": out["is_anomaly"],

                # --- ringkasan cepat ---
                "num_generators_online": sample["num_generators_online"],
                "msb_total_active_power_kw": sample["msb_total_active_power_kw"],
                "ship_roll_degrees": sample["ship_roll_degrees"],

                # --- data mentah dari generator (lengkap sesuai FEATURE_COLS) ---
                "features_raw": features_raw,
            }

            # broadcast ke semua klien
            await sio.emit("telemetry", payload)
            await asyncio.sleep(1.0)
    except asyncio.CancelledError:
        # task dihentikan (mis. tidak ada klien); cukup keluar
        pass

@sio.event
async def connect(sid, environ):
    global producer_task
    clients.add(sid)
    print("Client connected:", sid, " total:", len(clients))
    await sio.emit("server_info", {"msg": "ship AE online"}, to=sid)

    # start loop jika belum jalan
    if producer_task is None or producer_task.done():
        producer_task = asyncio.create_task(produce_loop())
        print("Producer loop started.")

@sio.event
async def disconnect(sid):
    print("Client disconnected:", sid)

# --- Background task: simulation loop ---
async def simulation_loop():
    print("🚢 Realtime simulation running...")
    t = 0
    while True:
        datapoint = generate_normal_data(t)
        datapoint = maybe_anomaly(datapoint)
        flattened = flatten_for_model(datapoint)
        window.append(flattened)
        if len(window) > window_size:
            window.pop(0)

        if len(window) == window_size:
            x = torch.tensor([np.array(window, dtype=np.float32)], dtype=torch.float32)
            with torch.no_grad():
                y = model(x)
            pred = y.item()
            if pred > 0.4:
                print("BLACKOUT!!!!!!!!!!!!!!")

        # ✅ Broadcast to all connected clients
        await sio.emit("test", datapoint)

        t += 1
        await asyncio.sleep(1)

@app.on_event("startup")
async def start_background_task():
    asyncio.create_task(simulation_loop())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
