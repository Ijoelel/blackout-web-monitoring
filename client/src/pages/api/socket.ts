import type { NextApiRequest, NextApiResponse } from "next"
import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import { Server as IOServer, type Socket as IOSocket } from "socket.io"
import { HistoryPoint } from "@/lib/type"

// Ship operation
type ShipState = {
  operationalStatus?: "operational" | "warning" | "critical"
  speed?: number
  fuelConsumption?: number
  updatedAt?: number
  speedHistory: HistoryPoint[]
  fuelHistory: HistoryPoint[]
}

// Electrical
type ElectricalState = {
  voltage?: number
  current?: number
  power?: number
  frequency?: number
  updatedAt?: number
  voltageHistory: HistoryPoint[]
  currentHistory: HistoryPoint[]
  powerHistory: HistoryPoint[]
  frequencyHistory: HistoryPoint[]
}

// Environment
type EnvironmentState = {
  waveHeight?: number
  windSpeed?: number
  seaCurrent?: number
  updatedAt?: number
  waveHistory: HistoryPoint[]
  windHistory: HistoryPoint[]
  currentHistory: HistoryPoint[]
}

// Generators
type GeneratorData = {
  id: string
  name: string
  online: boolean
  load_kw?: number
  frequency_hz?: number
  lube_oil_pressure_bar?: number
  coolant_temperature_celsius?: number
  exhaust_gas_temperature_celsius?: number
  vibration_level_mm_s?: number
}
type GeneratorsState = {
  items: GeneratorData[]
  // optional simple per-generator load history
  loadHistory: Record<string, HistoryPoint[]>
  updatedAt?: number
}

type Store = {
  ship: ShipState
  electrical: ElectricalState
  environment: EnvironmentState
  generators: GeneratorsState
}

// Telemetry payload types
type TelemetryGeneratorReading = {
  load_kw: number
  frequency_hz: number
  lube_oil_pressure_bar?: number
  coolant_temperature_celsius?: number
  exhaust_gas_temperature_celsius?: number
  vibration_level_mm_s?: number
}
type TelemetryPayload = {
  timestamp: string
  main_features: {
    generator_1: TelemetryGeneratorReading | null
    generator_2: TelemetryGeneratorReading | null
    generator_3: TelemetryGeneratorReading | null
    generator_4: TelemetryGeneratorReading | null
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

// @ts-ignore augment res.socket.server
declare module "http" {
  interface Server {
    io?: IOServer
  }
}

type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: HTTPServer & {
      io?: IOServer
    }
  }
}

const ONE_HOUR = 60 * 60 * 1000
function prune(points: HistoryPoint[], now: number) {
  const minT = now - ONE_HOUR
  // keep last hour
  return points.filter((p) => p.t >= minT)
}

const globalAny = globalThis as any
globalAny.__SOCKET_STORE__ ||= {
  ship: { speedHistory: [], fuelHistory: [] },
  electrical: { voltageHistory: [], currentHistory: [], powerHistory: [], frequencyHistory: [] },
  environment: { waveHistory: [], windHistory: [], currentHistory: [] },
  generators: { items: [], loadHistory: {} },
} as Store

function emitAll(io: IOServer, store: Store) {
  io.emit("ship:state", store.ship)
  io.emit("electrical:state", store.electrical)
  io.emit("environment:state", store.environment)
  io.emit("generators:state", store.generators)
}

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  // initialize once
  if (!res.socket || !res.socket.server) {
    // Socket server belum siap; balas aman agar TS tidak error
    res.status(200).end()
    return
  }
  const httpServer = res.socket.server

  if (!httpServer.io) {
    const io = new IOServer(httpServer, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      cors: { origin: "*" },
    })
    httpServer.io = io

    io.on("connection", (socket: IOSocket) => {
      const store: Store = globalAny.__SOCKET_STORE__
      // send current snapshot
      socket.emit("ship:state", store.ship)
      socket.emit("electrical:state", store.electrical)
      socket.emit("environment:state", store.environment)
      socket.emit("generators:state", store.generators)

      // Emit server_info on connect to mirror Python server.py
      socket.emit("server_info", { msg: "ship AE online" })

      // Ship updates
      socket.on("ship:update", (payload: Partial<Omit<ShipState, "speedHistory" | "fuelHistory">>) => {
        const now = Date.now()
        store.ship = store.ship || ({ speedHistory: [], fuelHistory: [] } as ShipState)
        if (payload.operationalStatus) store.ship.operationalStatus = payload.operationalStatus
        if (typeof payload.speed === "number") {
          store.ship.speed = payload.speed
          store.ship.speedHistory = prune([...(store.ship.speedHistory || []), { t: now, v: payload.speed }], now)
        }
        if (typeof payload.fuelConsumption === "number") {
          store.ship.fuelConsumption = payload.fuelConsumption
          store.ship.fuelHistory = prune(
            [...(store.ship.fuelHistory || []), { t: now, v: payload.fuelConsumption }],
            now,
          )
        }
        store.ship.updatedAt = now
        io.emit("ship:state", store.ship)
      })

      // Electrical updates
      socket.on(
        "electrical:update",
        (
          p: Partial<Omit<ElectricalState, "voltageHistory" | "currentHistory" | "powerHistory" | "frequencyHistory">>,
        ) => {
          const now = Date.now()
          const s = (store.electrical = store.electrical || ({} as ElectricalState))
          s.voltageHistory ||= []
          s.currentHistory ||= []
          s.powerHistory ||= []
          s.frequencyHistory ||= []
          if (typeof p.voltage === "number")
            s.voltageHistory = prune([...s.voltageHistory, { t: now, v: p.voltage }], now)
          if (typeof p.current === "number")
            s.currentHistory = prune([...s.currentHistory, { t: now, v: p.current }], now)
          if (typeof p.power === "number") s.powerHistory = prune([...s.powerHistory, { t: now, v: p.power }], now)
          if (typeof p.frequency === "number")
            s.frequencyHistory = prune([...s.frequencyHistory, { t: now, v: p.frequency }], now)
          if (typeof p.voltage === "number") s.voltage = p.voltage
          if (typeof p.current === "number") s.current = p.current
          if (typeof p.power === "number") s.power = p.power
          if (typeof p.frequency === "number") s.frequency = p.frequency
          s.updatedAt = now
          io.emit("electrical:state", s)
        },
      )

      // Environment updates
      socket.on(
        "environment:update",
        (p: Partial<Omit<EnvironmentState, "waveHistory" | "windHistory" | "currentHistory">>) => {
          const now = Date.now()
          const s = (store.environment = store.environment || ({} as EnvironmentState))
          s.waveHistory ||= []
          s.windHistory ||= []
          s.currentHistory ||= []
          if (typeof p.waveHeight === "number")
            s.waveHistory = prune([...s.waveHistory, { t: now, v: p.waveHeight }], now)
          if (typeof p.windSpeed === "number")
            s.windHistory = prune([...s.windHistory, { t: now, v: p.windSpeed }], now)
          if (typeof p.seaCurrent === "number")
            s.currentHistory = prune([...s.currentHistory, { t: now, v: p.seaCurrent }], now)
          if (typeof p.waveHeight === "number") s.waveHeight = p.waveHeight
          if (typeof p.windSpeed === "number") s.windSpeed = p.windSpeed
          if (typeof p.seaCurrent === "number") s.seaCurrent = p.seaCurrent
          s.updatedAt = now
          io.emit("environment:state", s)
        },
      )

      // Generators updates
      socket.on("generators:update", (items: GeneratorData[]) => {
        const now = Date.now()
        const g = (store.generators = store.generators || ({ items: [], loadHistory: {} } as GeneratorsState))
        g.items = items
        g.updatedAt = now
        g.loadHistory ||= {}
        for (const it of items) {
          if (typeof it.load_kw === "number") {
            const arr = g.loadHistory[it.id] || []
            g.loadHistory[it.id] = prune([...arr, { t: now, v: it.load_kw }], now)
          }
        }
        io.emit("generators:state", g)
      })

      // Telemetry updates
      socket.on("telemetry:update", (payload: TelemetryPayload) => {
        const now = Date.now()

        // 1) Generators
        const gens: GeneratorsState = store.generators || ({ items: [], loadHistory: {} } as GeneratorsState)
        const asItem = (idx: number, g: TelemetryGeneratorReading | null) => {
          const id = `g${idx}`
          const name = `Generator ${idx}`
          if (!g) return { id, name, online: false } as GeneratorData
          return {
            id,
            name,
            online: true,
            load_kw: g.load_kw,
            frequency_hz: g.frequency_hz,
            lube_oil_pressure_bar: g.lube_oil_pressure_bar,
            coolant_temperature_celsius: g.coolant_temperature_celsius,
            exhaust_gas_temperature_celsius: g.exhaust_gas_temperature_celsius,
            vibration_level_mm_s: g.vibration_level_mm_s,
          } as GeneratorData
        }
        const g1 = asItem(1, payload.main_features.generator_1)
        const g2 = asItem(2, payload.main_features.generator_2)
        const g3 = asItem(3, payload.main_features.generator_3)
        const g4 = asItem(4, payload.main_features.generator_4)
        gens.items = [g1, g2, g3, g4]
        gens.updatedAt = now
        gens.loadHistory ||= {}
        for (const g of gens.items) {
          if (g.online && typeof g.load_kw === "number") {
            const key = g.id || g.name
            const prev = gens.loadHistory[key] || []
            gens.loadHistory[key] = prune([...prev, { t: now, v: g.load_kw }], now)
          }
        }
        store.generators = gens

        // 2) Electrical (map from distribution_features, derive frequency from generators if available)
        const elec: ElectricalState = store.electrical || ({} as ElectricalState)
        elec.voltageHistory ||= []
        elec.powerHistory ||= []
        elec.currentHistory ||= []
        elec.frequencyHistory ||= []

        const v = payload.distribution_features.msb_busbar_voltage_v
        const p = payload.distribution_features.msb_total_active_power_kw
        const freqCandidates = [g1, g2, g3, g4]
          .filter((g) => g.online && typeof g.frequency_hz === "number")
          .map((g) => g.frequency_hz as number)
        const f =
          freqCandidates.length > 0 ? freqCandidates.reduce((a, b) => a + b, 0) / freqCandidates.length : elec.frequency

        if (typeof v === "number") {
          elec.voltage = v
          elec.voltageHistory = prune([...elec.voltageHistory, { t: now, v }], now)
        }
        if (typeof p === "number") {
          elec.power = p
          elec.powerHistory = prune([...elec.powerHistory, { t: now, v: p }], now)
        }
        if (typeof f === "number") {
          elec.frequency = f
          elec.frequencyHistory = prune([...elec.frequencyHistory, { t: now, v: f }], now)
        }
        elec.updatedAt = now
        store.electrical = elec

        // 3) Environment (map from contextual_features.environmental)
        const env: EnvironmentState = store.environment || ({} as EnvironmentState)
        env.waveHistory ||= []
        env.windHistory ||= []
        env.currentHistory ||= []

        const wave = payload.contextual_features.environmental.wave_height_meters
        const wind = payload.contextual_features.environmental.wind_speed_knots
        const current = payload.contextual_features.environmental.ocean_current_speed_knots

        if (typeof wave === "number") {
          env.waveHeight = wave
          env.waveHistory = prune([...env.waveHistory, { t: now, v: wave }], now)
        }
        if (typeof wind === "number") {
          env.windSpeed = wind
          env.windHistory = prune([...env.windHistory, { t: now, v: wind }], now)
        }
        if (typeof current === "number") {
          env.seaCurrent = current
          env.currentHistory = prune([...env.currentHistory, { t: now, v: current }], now)
        }
        env.updatedAt = now
        store.environment = env

        // 4) Ship (optional: infer general operational status from number of gens online)
        const ship = store.ship || ({ speedHistory: [], fuelHistory: [] } as ShipState)
        const online = payload.contextual_features.system_status?.num_generators_online ?? 0
        ship.operationalStatus = online > 0 ? "operational" : "critical"
        ship.updatedAt = now
        store.ship = ship

        emitAll(httpServer.io!, store)

        // Mirror Python server.py by also broadcasting the raw telemetry event
        httpServer.io!.emit("telemetry", payload)
      })

      socket.on("store:request", () => {
        emitAll(io, store)
      })

      socket.on("disconnect", () => {
        // no-op
      })
    })
  }

  res.end()
}


