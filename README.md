# Blackout Web Monitoring

This project is a web application for monitoring blackouts.

## How to Run

### Server

1.  Create a virtual environment:
    ```bash
    python -m venv .venv
    ```
2.  Activate the virtual environment.
    - On Windows:
      ```bash
      .venv\Scripts\activate
      ```
    - On macOS/Linux:
      ```bash
      source .venv/bin/activate
      ```
3.  Install the dependencies:
    ```bash
    pip install -r server/requirements.txt
    ```
4.  Run the server:
    ```bash
    python server/server.py
    ```

### Client

1.  Make sure you have [Node.js](https://nodejs.org/) installed.
2.  Install `nodemon` globally:
    ```bash
    npm install -g nodemon
    ```
3.  Run the client:
    ```bash
    nodemon client/client.js
    ```

### Data format 
```bash
{
    "data": {
        "timestamp": "2025-10-20T14:46:52.005119+00:00",
        "mode": "startup",
        "num_generators_online": 4,
        "main_features": {
            "generator_1": {
                "load_kw": 655.3168183635698,
                "frequency_hz": 49.90624191326269,
                "lube_oil_pressure_bar": 1.4262683242574308,
                "coolant_temperature_celsius": 35.20525029584484,
                "exhaust_gas_temperature_celsius": 177.76108438678372,
                "vibration_level_mm_s": 0.7100280118808053
            },
            "generator_2": {
                "load_kw": 638.8212655337758,
                "frequency_hz": 49.97124224430088,
                "lube_oil_pressure_bar": 1.7909549872270194,
                "coolant_temperature_celsius": 48.11986636904248,
                "exhaust_gas_temperature_celsius": 194.40266795965863,
                "vibration_level_mm_s": 0.7728806930082234
            },
            "generator_3": {
                "load_kw": 696.2404928739023,
                "frequency_hz": 50.079744073835705,
                "lube_oil_pressure_bar": 1.4729595196880605,
                "coolant_temperature_celsius": 54.21311122043501,
                "exhaust_gas_temperature_celsius": 183.1984627278263,
                "vibration_level_mm_s": 0.9277266920446222
            },
            "generator_4": {
                "load_kw": 709.2264993953909,
                "frequency_hz": 49.83444138499537,
                "lube_oil_pressure_bar": 1.7143503229808852,
                "coolant_temperature_celsius": 43.76861873832624,
                "exhaust_gas_temperature_celsius": 181.7031147625223,
                "vibration_level_mm_s": 1.0455581888773149
            }
        },
        "distribution_features": {
            "msb_total_active_power_kw": 2697.3696415810437,
            "msb_busbar_voltage_v": 691.9643123213801
        },
        "contextual_features": {
            "system_status": {
                "num_generators_online": 4,
                "pms_mode": "startup",
                "heavy_consumers_status": {
                    "bow_thruster_1": "INACTIVE",
                    "stabilizers": "INACTIVE"
                }
            },
            "maintenance_quality": {
                "generator_1_lube_oil_running_hours": null,
                "generator_2_lube_oil_running_hours": null,
                "generator_3_lube_oil_running_hours": null,
                "active_fuel_tank_cat_fines_ppm": null
            },
            "environmental": {
                "wave_height_meters": 0.5789589096424799,
                "wind_speed_knots": 5.026832306725208,
                "wind_direction_degrees": null,
                "ocean_current_speed_knots": null,
                "ship_pitch_degrees": 0.3542202363339799,
                "ship_roll_degrees": 0.6876878513357869
            }
        }
    },
    "prediction": {
        "ready": true,
        "score": 0.8627858757972717,
        "threshold": 0.48,
        "blackout_prob": 0.9604517498884727,
        "top_contributors": [
            {
                "name": "ship_pitch_degrees",
                "contribution": 3.391798496246338,
                "percent": 0.10920048505067825
            },
            {
                "name": "ship_roll_degrees",
                "contribution": 3.2492330074310303,
                "percent": 0.10461052507162094
            },
            {
                "name": "wave_height_meters",
                "contribution": 2.687770128250122,
                "percent": 0.08653397113084793
            },
            {
                "name": "g2_coolant_temperature_celsius",
                "contribution": 2.181644916534424,
                "percent": 0.07023904472589493
            },
            {
                "name": "g1_frequency_hz",
                "contribution": 2.101310968399048,
                "percent": 0.06765265762805939
            }
        ]
    }
}
```
