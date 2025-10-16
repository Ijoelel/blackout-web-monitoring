# server.py
import asyncio, socketio, uvicorn, numpy as np
from fastapi import FastAPI

from lib.pred import LSTMAE_Evaluator
from lib.generator import generate_normal_data, maybe_anomaly
from lib.generator1 import SimpleShipSim, row_to_nested_json

# ---------- Socket.IO (ASGI) ----------
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
app.mount("/", socketio.ASGIApp(sio))

clients = set()
producer_task = None


# ---------- Helper: flatten nested JSON -> dict flat sesuai feature_cols ----------
def flatten_nested_for_model(doc: dict, feature_cols: list[str]) -> dict:
    """
    Mengambil JSON bertingkat dari generator dan mengubahnya menjadi dict flat
    yang memiliki semua key di feature_cols (nilai float), sesuai urutan yang dipakai model.
    - generator_i == None => g{i}_online=0, sensor jadi NaN
    - num_generators_online: pakai contextual_features.system_status jika ada; fallback hitung dari generator non-null
    - env & distribution diambil langsung
    """
    cf  = (doc.get("contextual_features") or {})
    sys = (cf.get("system_status") or {})
    env = (cf.get("environmental") or {})
    dist = (doc.get("distribution_features") or {})
    main = (doc.get("main_features") or {})

    # num_online
    if "num_generators_online" in sys and sys["num_generators_online"] is not None:
        num_online = float(sys["num_generators_online"])
    else:
        num_online = 0.0
        for i in range(1, 5):
            if main.get(f"generator_{i}") is not None:
                num_online += 1.0

    # start dengan kolom umum
    row = {
        "num_generators_online": num_online,
        "wave_height_meters": float(env.get("wave_height_meters", 0.0) or 0.0),
        "wind_speed_knots": float(env.get("wind_speed_knots", 0.0) or 0.0),
        "ship_roll_degrees": float(env.get("ship_roll_degrees", 0.0) or 0.0),
        "ship_pitch_degrees": float(env.get("ship_pitch_degrees", 0.0) or 0.0),
        "msb_total_active_power_kw": float(dist.get("msb_total_active_power_kw", 0.0) or 0.0),
        "msb_busbar_voltage_v": float(dist.get("msb_busbar_voltage_v", 0.0) or 0.0),
    }

    # tiap generator
    for i in range(1, 5):
        g = main.get(f"generator_{i}")
        online = 1.0 if isinstance(g, dict) else 0.0
        row[f"g{i}_online"] = online
        if online == 1.0:
            row[f"g{i}_load_kw"] = float(g.get("load_kw", np.nan))
            row[f"g{i}_frequency_hz"] = float(g.get("frequency_hz", np.nan))
            row[f"g{i}_lube_oil_pressure_bar"] = float(g.get("lube_oil_pressure_bar", np.nan))
            row[f"g{i}_coolant_temperature_celsius"] = float(g.get("coolant_temperature_celsius", np.nan))
            row[f"g{i}_exhaust_gas_temperature_celsius"] = float(g.get("exhaust_gas_temperature_celsius", np.nan))
            row[f"g{i}_vibration_level_mm_s"] = float(g.get("vibration_level_mm_s", np.nan))
        else:
            # offline -> NaN pada sensor kontinu
            row[f"g{i}_load_kw"] = np.nan
            row[f"g{i}_frequency_hz"] = np.nan
            row[f"g{i}_lube_oil_pressure_bar"] = np.nan
            row[f"g{i}_coolant_temperature_celsius"] = np.nan
            row[f"g{i}_exhaust_gas_temperature_celsius"] = np.nan
            row[f"g{i}_vibration_level_mm_s"] = np.nan

    # pastikan semua feature_cols ada (kalau ada kolom lain di artifacts)
    for c in feature_cols:
        if c not in row:
            # fallback: isi 0.0 agar tidak KeyError (sebaiknya disesuaikan dengan skema train)
            row[c] = 0.0

    return row


async def produce_loop():
    """Generate (nested) -> flatten -> predict -> emit setiap 1s."""
    pred = LSTMAE_Evaluator(artifacts_dir="artifacts", prob_alpha=0.25, topk=5)
    data_generator = SimpleShipSim(seed=346)

    t = 0
    try:
        while True:
            data = data_generator.step()
            nested = row_to_nested_json(data)
            # nested = maybe_anomaly(nested)  # boleh dilepas jika tak ingin injeksi anomaly random

            # flatten sesuai feature_cols yang dipakai model
            flat_dict = flatten_nested_for_model(nested, pred.feature_cols)
            # --- Map 'mode' -> 'mode_code' jika model memakainya ---
            MODE_MAP = {"startup": 1.0, "stable": 2.0, "high_load": 3.0, "bad_env": 4.0}
            if "mode_code" in pred.feature_cols:
                m = nested.get("mode") or flat_dict.get("mode")
                if isinstance(m, str):
                    flat_dict["mode_code"] = MODE_MAP.get(m.strip().lower(), 0.0)
                else:
                    # fallback kalau tidak ada 'mode' string
                    flat_dict.setdefault("mode_code", 0.0)

            # --- Pastikan semua kolom yang dibutuhkan ada ---
            for name in pred.feature_cols:
                if name not in flat_dict:
                    flat_dict[name] = 0.0  # default aman

            # --- Paksa kolom biner tetap 0/1 float ---
            binary_cols = [c for c in pred.feature_cols if c.endswith("_online")]
            for b in binary_cols:
                try:
                    flat_dict[b] = 1.0 if float(flat_dict[b]) > 0.5 else 0.0
                except Exception:
                    flat_dict[b] = 0.0

            # --- Vectorize (urutan sesuai feature_cols) dan evaluasi ---
            try:
                # vec = pred.vectorize(flat_dict)         # (D,) float32
                out = pred.push_sample_and_eval(flat_dict)        # {ready, score, threshold, blackout_prob, consecutive_above, top_contributors}
            except Exception as e:
                # kirim error ke client agar gampang di-debug
                await sio.emit("telemetry_error", {"error": str(e)})
                # dan skip satu iterasi (jangan hard-crash loop)
                await asyncio.sleep(1.0)
                t += 1
                continue

            # --- Emit ke client: nested JSON + hasil prediksi ---
            print(t+1)
            payload = {
                "data": nested,       # nested JSON asli
                "prediction": out,    # hasil AE (tanpa is_anomaly), ada blackout_prob & top_contributors
            }
            await sio.emit("telemetry", payload)

            await asyncio.sleep(1.0)
            t += 1
    except asyncio.CancelledError:
        pass


@sio.event
async def connect(sid, environ):
    global producer_task
    clients.add(sid)
    print("Client connected:", sid, " total:", len(clients))
    await sio.emit("server_info", {"msg": "ship AE online"}, to=sid)

    if producer_task is None or producer_task.done():
        producer_task = asyncio.create_task(produce_loop())
        print("Producer loop started.")

@sio.event
async def disconnect(sid):
    global producer_task
    clients.discard(sid)
    print("Client disconnected:", sid, " total:", len(clients))
    if not clients and producer_task and not producer_task.done():
        producer_task.cancel()
        print("Producer loop stopped (no clients).")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
