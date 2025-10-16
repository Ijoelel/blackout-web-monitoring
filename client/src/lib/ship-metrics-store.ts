export type OperationalStatus = "operational" | "warning" | "critical"


import { genHistory, type HistoryPoint } from "@/lib/history"


export type ShipMetrics = {
  operationalStatus: OperationalStatus
  speed: number // knots
  fuelConsumption: number // L/h
  updatedAt: number
}


const ONE_HOUR = 60 * 60 * 1000
let speedHistory: HistoryPoint[] = genHistory({
  base: 18.5,
  jitter: 0.08,
  points: 60,
  min: 0,
  max: 45,
})
let fuelHistory: HistoryPoint[] = genHistory({
  base: 245,
  jitter: 0.12,
  points: 60,
  min: 0,
  max: 600,
})


type ShipMetricsInput = Partial<Omit<ShipMetrics, "updatedAt">>


let current: ShipMetrics = {
  operationalStatus: "operational",
  speed: 18.5,
  fuelConsumption: 245,
  updatedAt: Date.now(),
}


function pruneLastHour<T extends HistoryPoint>(arr: T[], now = Date.now()): T[] {
  const cutoff = now - ONE_HOUR
  return arr.filter((p) => p.t >= cutoff)
}


export function getShipMetrics(): ShipMetrics & {
  speedHistory: HistoryPoint[]
  fuelHistory: HistoryPoint[]
} {
  // pastikan ter-prune sebelum dikirim
  const now = Date.now()
  speedHistory = pruneLastHour(speedHistory, now)
  fuelHistory = pruneLastHour(fuelHistory, now)
  return { ...current, speedHistory, fuelHistory }
}


export function updateShipMetrics(input: ShipMetricsInput): ShipMetrics {
  // derive status if not provided explicitly
  const next: ShipMetrics = {
    ...current,
    ...input,
    updatedAt: Date.now(),
  }


  if (!input.operationalStatus) {
    // simple heuristic: warn if speed > 24 or fuel > 320; critical if speed > 30 or fuel > 400
    if (next.speed > 30 || next.fuelConsumption > 400) next.operationalStatus = "critical"
    else if (next.speed > 24 || next.fuelConsumption > 320) next.operationalStatus = "warning"
    else next.operationalStatus = "operational"
  }


  const now = Date.now()
  speedHistory.push({ t: now, v: next.speed })
  fuelHistory.push({ t: now, v: next.fuelConsumption })
  speedHistory = pruneLastHour(speedHistory, now)
  fuelHistory = pruneLastHour(fuelHistory, now)


  current = next
  return current
}



