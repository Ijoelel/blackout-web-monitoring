export interface GeneratorReading {
  load_kw: number
  frequency_hz: number
  lube_oil_pressure_bar?: number
  coolant_temperature_celsius?: number
  exhaust_gas_temperature_celsius?: number
  vibration_level_mm_s?: number
}

export interface TelemetryPayload {
  timestamp: string
  main_features: {
    generator_1: GeneratorReading | null
    generator_2: GeneratorReading | null
    generator_3: GeneratorReading | null
    generator_4: GeneratorReading | null
  }
  distribution_features: {
    msb_total_active_power_kw: number
    msb_busbar_voltage_v: number
  }
  contextual_features: {
    system_status: {
      num_generators_online: number
      pms_mode: string
      heavy_consumers_status?: Record<string, string>
    }
    maintenance_quality?: Record<string, number>
    environmental: {
      wave_height_meters: number
      wave_period_seconds?: number
      wind_speed_knots: number
      wind_direction_degrees?: number
      ocean_current_speed_knots: number
      ship_pitch_degrees?: number
      ship_roll_degrees?: number
    }
  }
}

export type HistoryPoint = { t: number; v: number }


