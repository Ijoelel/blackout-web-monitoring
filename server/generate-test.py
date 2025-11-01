from lib.generator1 import SimpleShipSim, row_to_nested_json
from lib.pred import LSTMAE_Evaluator
import numpy as np
import sys
import random
import pandas as pd


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

def data_check(flat_dict:dict, nested:dict, model:LSTMAE_Evaluator):
    MODE_MAP = {"startup": 1.0, "stable": 2.0, "high_load": 3.0, "bad_env": 4.0}
    if "mode_code" in model.feature_cols:
        m = nested.get("mode") or flat_dict.get("mode")
        if isinstance(m, str):
            flat_dict["mode_code"] = MODE_MAP.get(m.strip().lower(), 0.0)
        else:
            # fallback kalau tidak ada 'mode' string
            flat_dict.setdefault("mode_code", 0.0)

    # --- Pastikan semua kolom yang dibutuhkan ada ---
    for name in model.feature_cols:
        if name not in flat_dict:
            flat_dict[name] = 0.0  # default aman

    # --- Paksa kolom biner tetap 0/1 float ---
    binary_cols = [c for c in model.feature_cols if c.endswith("_online") and c.startswith("g")]
    for b in binary_cols:
        try:
            flat_dict[b] = 1.0 if float(flat_dict[b]) > 0.5 else 0.0
        except Exception:
            flat_dict[b] = 0.0

    return flat_dict

def loading(t, seq_len):
    print(f"[{"▋"*(round((t/seq_len) * 100))}{" "*(100 - round((t/seq_len) * 100))}] {t/seq_len*100:.2f}%")
    sys.stdout.write("\033[F")

def inject_anomaly(flat_dict, anomaly_type, anomaly_value):
    flat_dict[anomaly_type] = anomaly_value
    return flat_dict

def averaging(buffer_list, column_name):
    data_evaluated = [i[column_name] for i in buffer_list[(len(buffer_list) - 60):]]
    return sum(data_evaluated) / len(data_evaluated)

    

for i in range(100):
    random_stop = random.randint(500, 1000)

    pred = LSTMAE_Evaluator(artifacts_dir="artifacts", prob_alpha=0.25, topk=5)
    random_anomaly_type = random.randint(0, len(pred.feature_cols) - 1)

    data_generator = SimpleShipSim(seed=random_stop)
    buffer = []
    res = {}

    t = 0
    while True:
        data = data_generator.step()
        nested = row_to_nested_json(data)

        flat_dict = flatten_nested_for_model(nested, pred.feature_cols)

        if len(buffer) < 60:
            buffer.append(flat_dict)
        else:
            buffer.remove(buffer[0])
            buffer.append(flat_dict)
        
        # inject anomaly

        eval_data = data_check(flat_dict, nested, pred)
        res = pred.push_sample_and_eval(eval_data)
        loading(t+1, random_stop)

        t += 1
        if t == random_stop:
            break
    
    buffer_df = pd.DataFrame(buffer)
    buffer_df.to_excel(f"buffer_data/buffer_data{i+1}.xlsx")

    print(f"\nresult -> Result Score          : {res.get('score')}")
    print(f"          Blackout Probability    : {res.get('blackout_prob')}")
    print(f"          Top Contributors Average: ")
    for i in range(5):    
        print(f"              {res.get('top_contributors')[i].get('name')}                      : {averaging(buffer, res.get('top_contributors')[i].get('name'))}")
