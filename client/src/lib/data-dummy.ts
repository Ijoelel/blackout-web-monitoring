export const data = {
    data: {
        timestamp: "2025-10-16T15:22:12.111872+00:00",
        mode: "stable",
        num_generators_online: 3,
        main_features: {
            generator_1: {
                load_kw: 950.7487312939461,
                frequency_hz: 49.93719483745754,
                lube_oil_pressure_bar: 1.2492218387946405,
                coolant_temperature_celsius: 165.42709889316194,
                exhaust_gas_temperature_celsius: 190.45296622606398,
                vibration_level_mm_s: 0.9933086119956112,
            },
            generator_2: {
                load_kw: 1069.7967971372439,
                frequency_hz: 49.930231642373435,
                lube_oil_pressure_bar: 2.224105039884206,
                coolant_temperature_celsius: 221.82665265835055,
                exhaust_gas_temperature_celsius: 270.02006901167834,
                vibration_level_mm_s: 0.7255300516923717,
            },
            generator_3: {
                load_kw: 1001.211995430711,
                frequency_hz: 50.011358079835425,
                lube_oil_pressure_bar: 1.6138098330038995,
                coolant_temperature_celsius: 247.97510553206953,
                exhaust_gas_temperature_celsius: 182.0793651578579,
                vibration_level_mm_s: 1.4129511820301666,
            },
            generator_4: null,
        },
        distribution_features: {
            msb_total_active_power_kw: 3018.521594996518,
            msb_busbar_voltage_v: 689.920550501205,
        },
        contextual_features: {
            system_status: {
                num_generators_online: 3,
                pms_mode: "stable",
                heavy_consumers_status: {
                    bow_thruster_1: "INACTIVE",
                    stabilizers: "INACTIVE",
                },
            },
            maintenance_quality: {
                generator_1_lube_oil_running_hours: null,
                generator_2_lube_oil_running_hours: null,
                generator_3_lube_oil_running_hours: null,
                active_fuel_tank_cat_fines_ppm: null,
            },
            environmental: {
                wave_height_meters: 0.8756266403255167,
                wind_speed_knots: 6.726570105977386,
                wind_direction_degrees: null,
                ocean_current_speed_knots: null,
                ship_pitch_degrees: 0.6234898755759416,
                ship_roll_degrees: 1.2483384673045017,
            },
        },
    },
    prediction: {
        ready: true,
        score: 0.5155017971992493,
        threshold: 0.48,
        blackout_prob: 0.5734272893718358,
        top_contributors: [
            {
                name: "g1_frequency_hz",
                contribution: 3.828463315963745,
                percent: 0.20629645884037018,
            },
            {
                name: "g2_coolant_temperature_celsius",
                contribution: 1.9553929567337036,
                percent: 0.10536620765924454,
            },
            {
                name: "g3_exhaust_gas_temperature_celsius",
                contribution: 1.7064794301986694,
                percent: 0.09195351600646973,
            },
            {
                name: "g3_lube_oil_pressure_bar",
                contribution: 1.5065616369247437,
                percent: 0.08118096739053726,
            },
            {
                name: "g1_exhaust_gas_temperature_celsius",
                contribution: 1.5061732530593872,
                percent: 0.0811600387096405,
            },
        ],
    },
};
