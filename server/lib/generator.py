import random
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

import numpy as np


BASE_TIMESTAMP = datetime(2025, 9, 15, 21, 30, tzinfo=timezone.utc)


def _round(value: float, digits: int = 2) -> float:
    return float(np.round(value, digits))


def _make_generator_payload(base_load: float, base_freq: float, t: int) -> Dict[str, float]:
    phase = t / 30
    load_kw = base_load + 15 * np.sin(phase) + np.random.normal(0, 2)
    frequency_hz = base_freq + 0.02 * np.sin(phase / 2) + np.random.normal(0, 0.005)
    lube_oil_pressure_bar = 5.2 + 0.15 * np.sin(phase / 3) + np.random.normal(0, 0.05)
    coolant_temperature_celsius = 84.5 + 0.9 * np.sin(phase / 2.5) + np.random.normal(0, 0.2)
    exhaust_gas_temperature_celsius = 425 + 6 * np.sin(phase / 1.8) + np.random.normal(0, 1.5)
    vibration_level_mm_s = 3.4 + 0.2 * np.sin(phase / 4) + np.random.normal(0, 0.05)

    return {
        "load_kw": _round(load_kw, 1),
        "frequency_hz": _round(frequency_hz, 2),
        "lube_oil_pressure_bar": _round(lube_oil_pressure_bar, 2),
        "coolant_temperature_celsius": _round(coolant_temperature_celsius, 1),
        "exhaust_gas_temperature_celsius": _round(exhaust_gas_temperature_celsius, 1),
        "vibration_level_mm_s": _round(vibration_level_mm_s, 2),
    }


def generate_normal_data(t: int) -> Dict[str, object]:
    """Generate contextual ship power data following the new JSON structure."""
    timestamp = BASE_TIMESTAMP + timedelta(seconds=t)

    generator_payloads: Dict[str, Optional[Dict[str, float]]] = {
        "generator_1": _make_generator_payload(2150, 59.95, t),
        "generator_2": _make_generator_payload(2220, 59.94, t + 7),
        "generator_3": _make_generator_payload(2180, 59.96, t + 13),
        "generator_4": None,
    }

    total_active_power = sum(
        payload["load_kw"] for payload in generator_payloads.values() if payload is not None
    )
    busbar_voltage = 6590 + 6 * np.sin(t / 40) + np.random.normal(0, 1)

    data = {
        "timestamp": timestamp.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "main_features": generator_payloads,
        "distribution_features": {
            "msb_total_active_power_kw": _round(total_active_power, 1),
            "msb_busbar_voltage_v": _round(busbar_voltage, 1),
        },
        "contextual_features": {
            "system_status": {
                "num_generators_online": 3,
                "pms_mode": "Sea_Rough",
                "heavy_consumers_status": {
                    "bow_thruster_1": "ACTIVE_LOW",
                    "stabilizers": "ACTIVE",
                },
            },
            "maintenance_quality": {
                "generator_1_lube_oil_running_hours": 1520 + int(5 * np.sin(t / 80)),
                "generator_2_lube_oil_running_hours": 850 + int(4 * np.sin(t / 60)),
                "generator_3_lube_oil_running_hours": 2100 + int(6 * np.sin(t / 75)),
                "active_fuel_tank_cat_fines_ppm": 15 + int(np.random.normal(0, 1)),
            },
            "environmental": {
                "wave_height_meters": _round(4.5 + 0.2 * np.sin(t / 50), 2),
                "wave_period_seconds": _round(8.0 + 0.1 * np.cos(t / 35), 2),
                "wind_speed_knots": _round(35 + 1.2 * np.sin(t / 45) + np.random.normal(0, 0.5), 1),
                "wind_direction_degrees": 280,
                "ocean_current_speed_knots": _round(1.5 + 0.1 * np.sin(t / 55), 2),
                "ship_pitch_degrees": _round(4.2 + 0.3 * np.sin(t / 40), 2),
                "ship_roll_degrees": _round(5.5 + 0.4 * np.cos(t / 37), 2),
            },
        },
    }

    return data


def maybe_anomaly(data: Dict[str, object]) -> Dict[str, object]:
    mutated = deepcopy(data)

    if random.random() >= 0.05:
        return mutated

    anomaly_type = random.choice([
        "load_spike",
        "frequency_drop",
        "oil_pressure_drop",
        "voltage_sag",
    ])
    active_generators = [
        key for key, payload in mutated["main_features"].items() if payload is not None
    ]
    target_key = random.choice(active_generators)
    payload = mutated["main_features"][target_key]

    if not isinstance(payload, dict):
        return mutated

    if anomaly_type == "load_spike":
        payload["load_kw"] = _round(payload["load_kw"] * 1.2, 1)
    elif anomaly_type == "frequency_drop":
        payload["frequency_hz"] = _round(payload["frequency_hz"] - random.uniform(0.5, 1.0), 2)
    elif anomaly_type == "oil_pressure_drop":
        payload["lube_oil_pressure_bar"] = _round(
            max(0.5, payload["lube_oil_pressure_bar"] - random.uniform(1.5, 2.5)),
            2,
        )
    elif anomaly_type == "voltage_sag":
        distribution = mutated["distribution_features"]
        distribution["msb_busbar_voltage_v"] = _round(
            distribution["msb_busbar_voltage_v"] - random.uniform(150, 250), 1
        )
        distribution["msb_total_active_power_kw"] = _round(
            distribution["msb_total_active_power_kw"] * 0.85, 1
        )

    return mutated


def flatten_for_model(data: Dict[str, object]) -> List[float]:
    distribution = data["distribution_features"]
    busbar_voltage = distribution["msb_busbar_voltage_v"]
    total_power = distribution["msb_total_active_power_kw"]

    generators = [
        payload
        for payload in data["main_features"].values()
        if isinstance(payload, dict)
    ]

    if not generators:
        generators = [
            {
                "load_kw": 0.0,
                "frequency_hz": 60.0,
                "lube_oil_pressure_bar": 0.0,
                "coolant_temperature_celsius": 0.0,
            }
        ]

    avg_frequency = float(np.mean([gen["frequency_hz"] for gen in generators]))
    avg_oil_temp = float(
        np.mean([gen["coolant_temperature_celsius"] for gen in generators])
    )
    avg_oil_pressure = float(
        np.mean([gen["lube_oil_pressure_bar"] for gen in generators])
    )

    currents = [
        (gen["load_kw"] * 1000) / (np.sqrt(3) * busbar_voltage)
        if busbar_voltage
        else 0.0
        for gen in generators
    ]
    while len(currents) < 3:
        currents.append(0.0)

    pf = 0.95
    genset_rpm = avg_frequency * 60

    maintenance = data["contextual_features"]["maintenance_quality"]
    environmental = data["contextual_features"]["environmental"]

    battery_soc = max(30.0, 90.0 - maintenance["active_fuel_tank_cat_fines_ppm"])
    room_temp = 24.0 + 0.5 * environmental["wave_height_meters"]
    humidity = 65.0 + 0.2 * environmental["wind_speed_knots"]

    flattened = [
        busbar_voltage * 0.99,
        busbar_voltage,
        busbar_voltage * 1.01,
        currents[0],
        currents[1],
        currents[2],
        avg_frequency,
        total_power,
        pf,
        genset_rpm,
        battery_soc,
        avg_oil_temp,
        avg_oil_pressure,
        room_temp,
        humidity,
    ]

    return [float(round(value, 3)) for value in flattened]
