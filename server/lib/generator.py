import numpy as np
import random

# --- Konfigurasi dasar data normal ---
def generate_normal_data(t):
    voltage = 440 + 5*np.sin(t/100) + np.random.normal(0, 0.5)
    current = 200 + 10*np.sin(t/120) + np.random.normal(0, 1)
    frequency = 50 + 0.1*np.sin(t/200) + np.random.normal(0, 0.02)
    temperature = 70 + 2*np.sin(t/150) + np.random.normal(0, 0.3)
    power_load = voltage*current/1000 + np.random.normal(0, 2)
    fuel = 80 - (t/3600) + np.random.normal(0, 0.05)
    
    # Tambahkan fitur turunan agar total 15 fitur
    return [
        voltage, current, frequency, temperature, power_load, fuel,
        voltage/current,                    # rasio V/I
        current/voltage,                    # rasio I/V
        voltage*current,                    # daya nyata
        np.sqrt(voltage**2+current**2),     # apparent power
        temperature*current,                # heat load
        frequency*voltage,                  # freq-voltage coupling
        temperature/voltage,                # suhu per volt
        power_load/fuel,                    # efisiensi
        np.random.normal(0,1)               # noise tambahan
    ]


# --- Sisipkan anomali secara acak ---
def maybe_anomaly(data):
    if random.random() < 0.05:  # 5% peluang muncul anomali
        idx = random.randint(0, 4)
        # drop tegangan / lonjakan arus / frekuensi dsb
        anomaly_strength = random.uniform(2, 5)
        data[idx] += random.choice([-1, 1]) * anomaly_strength * np.std(data)
    return data