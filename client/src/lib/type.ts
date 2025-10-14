// Telemetry schema (match your JSON payload)
export type NullableNumber = number | null

export type TelemetryGeneratorReading = {
  load_kw: NullableNumber
  frequency_hz: NullableNumber
  lube_oil_pressure_bar?: NullableNumber
  coolant_temperature_celsius?: NullableNumber
  exhaust_gas_temperature_celsius?: NullableNumber
  vibration_level_mm_s?: NullableNumber
} | null

export type TelemetryGenerators = {
  generator_1: TelemetryGeneratorReading
  generator_2: TelemetryGeneratorReading
  generator_3: TelemetryGeneratorReading
  generator_4: TelemetryGeneratorReading
}

export type TelemetryDistribution = {
  msb_total_active_power_kw: NullableNumber
  msb_busbar_voltage_v: NullableNumber
}

export type TelemetrySystemStatus = {
  num_generators_online: number
  pms_mode?: string | null
  heavy_consumers_status?: Record<string, string>
}

export type TelemetryEnvironmental = {
  wave_height_meters: NullableNumber
  wind_speed_knots: NullableNumber
  ocean_current_speed_knots: NullableNumber
  // optional fields present in your reference
  wave_period_seconds?: NullableNumber
  wind_direction_degrees?: NullableNumber
  ship_pitch_degrees?: NullableNumber
  ship_roll_degrees?: NullableNumber
}

export type TelemetryContextual = {
  system_status: TelemetrySystemStatus
  environmental: TelemetryEnvironmental
}

export type TelemetryPayload = {
  timestamp: string // ISO string
  main_features: TelemetryGenerators
  distribution_features: TelemetryDistribution
  contextual_features: TelemetryContextual
}

// History data point for charts/logs
export type HistoryPoint = {
  t: number // epoch ms
  v: number // value
}

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


