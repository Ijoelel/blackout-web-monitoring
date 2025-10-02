# server.py
import asyncio, os, uvicorn, socketio
from lib.generator import SimpleShipSim
from lib.pred import AnomalyPredictor

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
    global producer_task
    clients.discard(sid)
    print("Client disconnected:", sid, " total:", len(clients))
    # stop loop kalau tidak ada klien
    if not clients and producer_task and not producer_task.done():
        producer_task.cancel()
        print("Producer loop stopped (no clients).")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
