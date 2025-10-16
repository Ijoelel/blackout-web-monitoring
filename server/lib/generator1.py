import numpy as np
import random
from datetime import datetime, timezone, timedelta
import pandas as pd 
import time

SEED = 99

class ARParam:
    def __init__(self, base, rel_sigma=0.002, min_val=None, max_val=None):
        self.value = float(base)
        self.rel_sigma = rel_sigma
        self.min_val = min_val
        self.max_val = max_val
    def step(self, drift=0.0, anomaly=False, anomaly_scale=0.2):
        if anomaly:
            jump = np.random.normal(0, max(abs(self.value)*anomaly_scale, 1e-3))
            self.value += jump + drift
        else:
            noise = np.random.normal(0, max(abs(self.value)*self.rel_sigma, 1e-6))
            self.value += noise + drift
        if self.min_val is not None: self.value = max(self.min_val, self.value)
        if self.max_val is not None: self.value = min(self.max_val, self.value)
        return float(self.value)

class SimpleShipSim:
    """State machine: startup → stable ↔ {bad_env, high_load}; korelasi wave→(roll,pitch)→vibration, load→(coolant, exhaust, lube)."""
    def __init__(self, seed=0, dt_seconds=5, startup_secs=240, min_stable=60, min_env=40, cooldown=60):
        random.seed(seed); np.random.seed(seed)
        self.t = datetime.now(timezone.utc); self.dt = dt_seconds
        self.mode = "startup"; self.m_t = 0
        self.startup_secs = startup_secs; self.min_stable=min_stable
        self.min_env = min_env; self.cooldown=cooldown; self.last_env_exit=-10**9
        self.phase = 0.0
        self.num_online = 2

        self.env = {
            "wave_height_meters": ARParam(0.5, rel_sigma=0.05, min_val=0),
            "wind_speed_knots": ARParam(8.0, rel_sigma=0.05, min_val=0),
            "ship_roll_degrees": ARParam(0.5, rel_sigma=0.02),
            "ship_pitch_degrees": ARParam(0.5, rel_sigma=0.02),
        }

        self.g = {}
        for i in range(1,5):
            base_load = 900.0 + (i-1)*40.0
            self.g[f"g{i}"] = {
                "load_kw": ARParam(base_load*0.5, rel_sigma=0.01, min_val=0),
                "frequency_hz": ARParam(50.0, rel_sigma=0.0004, min_val=49.5, max_val=50.5),
                "lube_oil_pressure_bar": ARParam(1.6, rel_sigma=0.01, min_val=0),
                "coolant_temperature_celsius": ARParam(40.0, rel_sigma=0.01, min_val=-10),
                "exhaust_gas_temperature_celsius": ARParam(180.0, rel_sigma=0.01, min_val=0),
                "vibration_level_mm_s": ARParam(0.7 + 0.05*(i-1), rel_sigma=0.03, min_val=0),
            }

        self.msb_voltage_base = 690.0

    def _enter(self, m, n_online=None):
        self.mode = m; self.m_t = 0
        if n_online is not None: self.num_online = n_online

    def step(self):
        self.t += timedelta(seconds=self.dt); self.m_t += 1

        # transitions (dwell + cooldown)
        if self.mode=="startup" and self.m_t >= self.startup_secs:
            self._enter("stable", n_online=3)
        elif self.mode=="stable" and self.m_t>=self.min_stable and (self.t.timestamp()-self.last_env_exit)>=self.cooldown:
            u = random.random()
            if u < 0.03: self._enter("high_load", n_online=3)
            elif u < 0.08: self._enter("bad_env", n_online=3)
        elif self.mode in ("bad_env","high_load") and self.m_t>=self.min_env and random.random()<0.08:
            self.last_env_exit = self.t.timestamp(); self._enter("stable", n_online=3)

        # environment + correlations
        env_mult = {"startup":0.4, "stable":1.0, "bad_env":2.0, "high_load":1.2}[self.mode]
        self.phase += 0.1
        wave_target = 1.0*env_mult
        wh = self.env["wave_height_meters"].step(drift=(wave_target-self.env["wave_height_meters"].value)*0.02)
        wind = self.env["wind_speed_knots"].step(drift=(8.0*env_mult-self.env["wind_speed_knots"].value)*0.01)
        roll  = self.env["ship_roll_degrees"].step(drift=((1.4*wh)-self.env["ship_roll_degrees"].value)*0.15)
        pitch = self.env["ship_pitch_degrees"].step(drift=((0.7*wh)-self.env["ship_pitch_degrees"].value)*0.1)

        # num gens (ramp during startup)
        if self.mode=="startup" and self.m_t%20==0: self.num_online = min(4, self.num_online+1)
        elif self.mode!="startup" and random.random()<0.003: self.num_online = min(4, max(1, self.num_online+random.choice([-1,1])))

        # per-timestep row
        row = {
            "timestamp": self.t.isoformat(), "mode": self.mode,
            "num_generators_online": float(self.num_online),
            "wave_height_meters": float(wh), "wind_speed_knots": float(wind),
            "ship_roll_degrees": float(roll), "ship_pitch_degrees": float(pitch),
        }

        total_kw = 0.0
        base_load = 600.0 if self.mode=="startup" else 900.0
        if self.mode=="high_load": base_load *= 1.5

        for i in range(1,5):
            gk = f"g{i}"
            if i<=self.num_online:
                ar = self.g[gk]
                env_load_factor = 1.0 + 0.02*wh + 0.005*wind
                target = (900.0 + 40.0*(i-1)) * env_load_factor
                target = base_load + (target-900.0)  # geser ke base
                # update sensors
                load = ar["load_kw"].step(drift=(target-ar["load_kw"].value)*0.05)
                freq = ar["frequency_hz"].step()
                lube = ar["lube_oil_pressure_bar"].step()
                cool = ar["coolant_temperature_celsius"].step(drift=0.02*(load-600.0)/10.0)
                exh  = ar["exhaust_gas_temperature_celsius"].step(drift=0.15*load/1000.0)
                vib  = ar["vibration_level_mm_s"].step(drift=0.02*(1.0 + 0.12*abs(roll) - 1.0)*ar["vibration_level_mm_s"].value)

                total_kw += load
                row.update({
                    f"{gk}_online": 1.0,
                    f"{gk}_load_kw": float(load),
                    f"{gk}_frequency_hz": float(freq),
                    f"{gk}_lube_oil_pressure_bar": float(lube),
                    f"{gk}_coolant_temperature_celsius": float(cool),
                    f"{gk}_exhaust_gas_temperature_celsius": float(exh),
                    f"{gk}_vibration_level_mm_s": float(vib),
                })
            else:
                # offline -> NaN pada sensor; online=0
                row.update({
                    f"{gk}_online": 0.0,
                    f"{gk}_load_kw": 0,
                    f"{gk}_frequency_hz": 0,
                    f"{gk}_lube_oil_pressure_bar": 0,
                    f"{gk}_coolant_temperature_celsius": 0,
                    f"{gk}_exhaust_gas_temperature_celsius": 0,
                    f"{gk}_vibration_level_mm_s": 0,
                })

        row["msb_total_active_power_kw"] = float(total_kw + np.random.normal(0, 3.0))
        row["msb_busbar_voltage_v"] = float(self.msb_voltage_base + np.random.normal(0,2.0) - 0.02*roll)
        return row

def row_to_nested_json(row):
    # row: pandas.Series dari df.iloc[idx]
    def gen_block(i):
        return {
            "load_kw":                           row.get(f"g{i}_load_kw", 0.0),
            "frequency_hz":                     row.get(f"g{i}_frequency_hz", 0.0),
            "lube_oil_pressure_bar":            row.get(f"g{i}_lube_oil_pressure_bar", 0.0),
            "coolant_temperature_celsius":      row.get(f"g{i}_coolant_temperature_celsius", 0.0),
            "exhaust_gas_temperature_celsius":  row.get(f"g{i}_exhaust_gas_temperature_celsius", 0.0),
            "vibration_level_mm_s":             row.get(f"g{i}_vibration_level_mm_s", 0.0),
        } if row.get(f"g{i}_online", 0.0) == 1.0 else None

    nested = {
        "timestamp": str(row.get("timestamp", "")),
        "mode": str(row.get("mode", "")),
        "num_generators_online": row.get("num_generators_online", 0.0),
        "main_features": {
            "generator_1": gen_block(1),
            "generator_2": gen_block(2),
            "generator_3": gen_block(3),
            "generator_4": gen_block(4),
        },
        "distribution_features": {
            "msb_total_active_power_kw": row.get("msb_total_active_power_kw", 0.0),
            "msb_busbar_voltage_v":      row.get("msb_busbar_voltage_v", 0.0),
        },
        "contextual_features": {
            "system_status": {
                "num_generators_online": row.get("num_generators_online", 0.0),
                "pms_mode":              row.get("mode", "unknown"),
                "heavy_consumers_status": {
                    # opsional: isi sesuai yang kamu punya
                    "bow_thruster_1": "INACTIVE",
                    "stabilizers":    "INACTIVE",
                }
            },
            "maintenance_quality": {
                # placeholder bila kamu belum punya fields ini
                "generator_1_lube_oil_running_hours": None,
                "generator_2_lube_oil_running_hours": None,
                "generator_3_lube_oil_running_hours": None,
                "active_fuel_tank_cat_fines_ppm":     None,
            },
            "environmental": {
                "wave_height_meters":      row.get("wave_height_meters", 0.0),
                "wind_speed_knots":        row.get("wind_speed_knots", 0.0),
                "wind_direction_degrees":  row.get("wind_direction_degrees", None),
                "ocean_current_speed_knots": row.get("ocean_current_speed_knots", None),
                "ship_pitch_degrees":      row.get("ship_pitch_degrees", 0.0),
                "ship_roll_degrees":       row.get("ship_roll_degrees", 0.0),
            }
        }
    }
    return nested

if __name__ == "__main__":
    data = SimpleShipSim(seed=346)
    while(1):
        row = data.step()
        print(row_to_nested_json(row))
        time.sleep(1)