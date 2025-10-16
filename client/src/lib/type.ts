export type MainFeature = {
    generator_1: GeneratorData | null;
    generator_2: GeneratorData | null;
    generator_3: GeneratorData | null;
    generator_4: GeneratorData | null;
};

export type DistributionFeature = {
    msb_total_active_power_kw: number;
    msb_busbar_voltage_v: number;
};

export type SocketData = {
    timestamp: string;
    main_features: MainFeature;
    distribution_features: DistributionFeature
    contextual_features: {
        system_status: {
            num_generators_online: number;
            pms_mode: string;
            heavy_consumers_status: {
                bow_thruster_1: string;
                stabilizers: string;
            };
        };
    };
    maintenance_quality: {
        generator_1_lube_oil_running_hours: number;
        generator_2_lube_oil_running_hours: number;
        generator_3_lube_oil_running_hours: number;
        generator_4_lube_oil_running_hours: number;
        active_fuel_tank_cat_fines_ppm: number;
    };
    environmental: {
        wave_height_meters: number;
        wave_period_seconds: number;
        wind_speed_knots: number;
        wind_direction_degrees: number;
        ocean_current_speed_knots: number;
        ship_pitch_degrees: number;
        ship_roll_degrees: number;
    };
};
