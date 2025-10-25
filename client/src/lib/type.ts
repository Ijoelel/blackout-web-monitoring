// Telemetry schema (match your JSON payload)
const TELEMETRY_GEN_KEYS = [
    "generator_1",
    "generator_2",
    "generator_3",
    "generator_4",
] as const;

export type GenKey = (typeof TELEMETRY_GEN_KEYS)[number];

export type NullableNumber = number | null;

export type TelemetryGeneratorReading = {
    load_kw: NullableNumber;
    frequency_hz: NullableNumber;
    lube_oil_pressure_bar?: NullableNumber;
    coolant_temperature_celsius?: NullableNumber;
    exhaust_gas_temperature_celsius?: NullableNumber;
    vibration_level_mm_s?: NullableNumber;
} | null;

export type TelemetryGenerators = {
    generator_1: TelemetryGeneratorReading;
    generator_2: TelemetryGeneratorReading;
    generator_3: TelemetryGeneratorReading;
    generator_4: TelemetryGeneratorReading;
};

export type TelemetryDistribution = {
    msb_total_active_power_kw: NullableNumber;
    msb_busbar_voltage_v: NullableNumber;
};

export type TelemetrySystemStatus = {
    num_generators_online: number;
    pms_mode?: string | null;
    heavy_consumers_status?: Record<string, string>;
};

export type TelemetryEnvironmental = {
    wave_height_meters: NullableNumber;
    wind_speed_knots: NullableNumber;
    ocean_current_speed_knots: NullableNumber;
    wind_direction_degrees?: NullableNumber;
    ship_pitch_degrees?: NullableNumber;
    ship_roll_degrees?: NullableNumber;
};

export type TelemetryContextual = {
    system_status: TelemetrySystemStatus;
    maintenance_quality?: TelemetryMaintenanceQuality;
    environmental: TelemetryEnvironmental;
};

export type TelemetryPayload = {
    timestamp: string; // ISO string
    main_features: TelemetryGenerators;
    distribution_features: TelemetryDistribution;
    contextual_features: TelemetryContextual;
};

export type TelemetryMaintenanceQuality = {
    generator_1_lube_oil_running_hours: NullableNumber;
    generator_2_lube_oil_running_hours: NullableNumber;
    generator_3_lube_oil_running_hours: NullableNumber;
    generator_4_lube_oil_running_hours: NullableNumber;
    active_fuel_tank_cat_fines_ppm: NullableNumber;
};

export type JsonTelemetryFormat = {
    timestamp: string;
    mode: "stable" | "startup" | "high_load" | "bad_env";
    num_generators_online: number;
    main_features: TelemetryGenerators;
    distribution_features: TelemetryDistribution;
    contextual_features: {
        system_status: TelemetrySystemStatus;
        maintenance_quality: TelemetryMaintenanceQuality;
        environmental: TelemetryEnvironmental;
    };
};

export type JsonPredictionFormat = {
    ready: boolean;
    score: number;
    threshold: number;
    blackout_prob: number;
    top_contributors: {
        name: string;
        contribution: number;
        percent: number;
    }[];
};

export type JsonDataFormat = {
    data: JsonTelemetryFormat;
    prediction: JsonPredictionFormat;
};

// History data point for charts/logs
export type HistoryPoint = {
    t: number; // epoch ms
    v: number; // value
};

export type TopContributor = {
    name: string
    contribution: number
    percent: number
};

export type PredictionState = {
    ready: boolean
    score: number
    threshold: number
    blackout_prob: number
    top_contributors: TopContributor[]
    updatedAt?: number

};

// Next.js API Response typing so Socket.IO compiles cleanly in TS
import type { NextApiResponse } from "next"
import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import type { Server as IOServer } from "socket.io"


export type NextApiResponseServerIO = NextApiResponse & {
  socket?: NetSocket & {
    server?: HTTPServer & {
      io?: IOServer
    }
  }
}

