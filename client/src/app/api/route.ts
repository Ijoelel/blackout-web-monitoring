import { NextResponse } from "next/server"
import { getShipMetrics, updateShipMetrics, type OperationalStatus } from "@/lib/ship-metrics-store"


export async function GET() {
  const metrics = getShipMetrics()
  // Assuming getShipMetrics returns an object with current and history properties
  return NextResponse.json(metrics)
}


export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload: {
      operationalStatus?: OperationalStatus
      speed?: number
      fuelConsumption?: number
    } = body ?? {}


    // Basic validation/clamping
    if (typeof payload.speed === "number") {
      // reasonable ship speed bounds in knots
      payload.speed = Math.max(0, Math.min(45, payload.speed))
    }
    if (typeof payload.fuelConsumption === "number") {
      // reasonable fuel burn in L/h (example)
      payload.fuelConsumption = Math.max(0, Math.min(2000, payload.fuelConsumption))
    }


    const updated = updateShipMetrics(payload)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}



