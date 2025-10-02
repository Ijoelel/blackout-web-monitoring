# generator_ship.py
import math, random, datetime

class SimpleShipSim:
    """Simulasi kapal sederhana: startup -> stable -> (kadang) bad_env/high_load.
       Korelasi: wave→roll/pitch→vibration; high_load→load naik.
    """
    def __init__(self, feature_cols, seed=42):
        self.feature_cols = feature_cols
        self.rng = random.Random(seed)
        self.t = 0
        self.mode = "startup"
        self.phase = 0.0
        self.num_online = 2

    def _gens_tuple(self):
        g_online = [0,0,0,0]
        for i in range(self.num_online):
            g_online[i] = 1

        base_load = 600.0 if self.mode == "startup" else 900.0
        if self.mode == "high_load": base_load *= 1.5

        gens = []
        for i in range(4):
            on = g_online[i]
            if on:
                load = base_load + self.rng.gauss(0, 40)
                freq = 50.0 + self.rng.gauss(0, 0.01)
                lube = 1.5 + 0.02*(load/1000.0) + self.rng.gauss(0, 0.02)
                cool = 35 + 0.04*(load/10.0) + self.rng.gauss(0, 0.5)
                exhaust = 180 + 0.2*(load/1.0) + self.rng.gauss(0, 5)
                vib = 0.7 + self.last_roll*0.15 + self.rng.gauss(0, 0.03)
            else:
                load=freq=lube=cool=exhaust=vib=0.0
            gens.append((on, load, freq, lube, cool, exhaust, vib))
        return gens

    def step(self):
        self.t += 1
        # state transitions
        if self.mode == "startup":
            if self.t > 60:
                self.mode = "stable"; self.num_online = 3
        elif self.mode == "stable":
            r = self.rng.random()
            if r < 0.03: self.mode = "high_load"; self.num_online = 3
            elif r < 0.08: self.mode = "bad_env"
        else:  # bad_env / high_load
            if self.rng.random() < 0.05:
                self.mode = "stable"; self.num_online = 3

        # environment
        self.phase += 0.1
        wave = max(0.0, 1.0 + 0.5*math.sin(self.phase) + self.rng.gauss(0, 0.05))
        wind = max(0.0, 8.0 + 2.0*math.sin(self.phase/3) + self.rng.gauss(0, 0.3))
        if self.mode == "bad_env":
            wave *= 2.0; wind *= 1.8

        roll  = 0.6*wave + self.rng.gauss(0, 0.1)
        pitch = 0.4*wave + self.rng.gauss(0, 0.08)
        self.last_roll = roll

        # build dict
        d = {
            "num_generators_online": self.num_online,
            "wave_height_meters": wave,
            "wind_speed_knots": wind,
            "ship_roll_degrees": roll,
            "ship_pitch_degrees": pitch,
        }

        gens = self._gens_tuple()
        total_kw = 0.0
        for i,(on,load,f,lube,cool,exh,vib) in enumerate(gens, start=1):
            d[f"g{i}_online"] = float(on)
            d[f"g{i}_load_kw"] = load;           total_kw += load
            d[f"g{i}_frequency_hz"] = f
            d[f"g{i}_lube_oil_pressure_bar"] = lube
            d[f"g{i}_coolant_temperature_celsius"] = cool
            d[f"g{i}_exhaust_gas_temperature_celsius"] = exh
            d[f"g{i}_vibration_level_mm_s"] = vib

        d["msb_total_active_power_kw"] = total_kw
        d["msb_busbar_voltage_v"] = 690.0 + self.rng.gauss(0, 2.0) - 0.02*roll

        # isi default untuk kolom yang mungkin ada di feature list tapi tidak dihitung di atas
        for c in self.feature_cols:
            if c not in d:
                d[c] = 0.0

        d["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
        d["mode"] = self.mode
        return d
