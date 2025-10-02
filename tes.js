const json = {
    timestamp: "2025-09-15T21:30:00Z",
    main_features: {
        generator_1: {
            load_kw: 2150.5,
            frequency_hz: 59.95,
            lube_oil_pressure_bar: 5.4,
            coolant_temperature_celsius: 85.5,
            exhaust_gas_temperature_celsius: 430.0,
            vibration_level_mm_s: 3.5,
        },
        generator_2: {
            load_kw: 2220.0,
            frequency_hz: 59.94,
            lube_oil_pressure_bar: 5.3,
            coolant_temperature_celsius: 85.1,
            exhaust_gas_temperature_celsius: 435.5,
            vibration_level_mm_s: 3.8,
        },
        generator_3: {
            load_kw: 2180.0,
            frequency_hz: 59.96,
            lube_oil_pressure_bar: 5.5,
            coolant_temperature_celsius: 85.3,
            exhaust_gas_temperature_celsius: 432.0,
            vibration_level_mm_s: 3.6,
        },
        generator_4: null,
    },
    distribution_features: {
        msb_total_active_power_kw: 6550.5,
        msb_busbar_voltage_v: 6590.0,
    },
    contextual_features: {
        system_status: {
            num_generators_online: 3,
            pms_mode: "Sea_Rough",
            heavy_consumers_status: {
                bow_thruster_1: "ACTIVE_LOW",
                stabilizers: "ACTIVE",
            },
        },
        maintenance_quality: {
            generator_1_lube_oil_running_hours: 1520,
            generator_2_lube_oil_running_hours: 850,
            generator_3_lube_oil_running_hours: 2100,
            active_fuel_tank_cat_fines_ppm: 15,
        },
        environmental: {
            wave_height_meters: 4.5,
            wave_period_seconds: 8.0,
            wind_speed_knots: 35.0,
            wind_direction_degrees: 280,
            ocean_current_speed_knots: 1.5,
            ship_pitch_degrees: 4.2,
            ship_roll_degrees: 5.5,
        },
    },
};
