"use client"


import { useEffect, useMemo, useState } from "react"
import { getSocket } from "@/lib/socket-client"


export type HistoryPoint = { t: number; v: number }


export type ShipState = {
  operationalStatus?: "operational" | "warning" | "critical"
  speed?: number
  fuelConsumption?: number
  updatedAt?: number
  speedHistory?: HistoryPoint[]
  fuelHistory?: HistoryPoint[]
}


export type ElectricalState = {
  voltage?: number
  current?: number
  power?: number
  frequency?: number
  updatedAt?: number
  voltageHistory?: HistoryPoint[]
  currentHistory?: HistoryPoint[]
  powerHistory?: HistoryPoint[]
  frequencyHistory?: HistoryPoint[]
}


export type EnvironmentState = {
  waveHeight?: number
  windSpeed?: number
  seaCurrent?: number
  updatedAt?: number
  waveHistory?: HistoryPoint[]
  windHistory?: HistoryPoint[]
  currentHistory?: HistoryPoint[]
}


export type GeneratorData = {
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
export type GeneratorsState = {
  items: GeneratorData[]
  loadHistory: Record<string, HistoryPoint[]>
  updatedAt?: number
}


export function useSocketData() {
  const [ship, setShip] = useState<ShipState>({})
  const [electrical, setElectrical] = useState<ElectricalState>({})
  const [environment, setEnvironment] = useState<EnvironmentState>({})
  const [generators, setGenerators] = useState<GeneratorsState>({ items: [], loadHistory: {} })


  useEffect(() => {
    const s = getSocket()
    const onShip = (st: ShipState) => setShip(st)
    const onElect = (st: ElectricalState) => setElectrical(st)
    const onEnv = (st: EnvironmentState) => setEnvironment(st)
    const onGen = (st: GeneratorsState) => setGenerators(st)


    s.on("ship:state", onShip)
    s.on("electrical:state", onElect)
    s.on("environment:state", onEnv)
    s.on("generators:state", onGen)


    const onServerInfo = (_msg: unknown) => {
      // console.log("[v0] server_info:", _msg) // remove or keep for debug
    }
    s.on("server_info", onServerInfo)


    // request initial in case connected after init
    s.emit("store:request")


    return () => {
      s.off("ship:state", onShip)
      s.off("electrical:state", onElect)
      s.off("environment:state", onEnv)
      s.off("generators:state", onGen)
      s.off("server_info", onServerInfo)
    }
  }, [])


  return useMemo(
    () => ({
      ship,
      electrical,
      environment,
      generators,
    }),
    [ship, electrical, environment, generators],
  )
}



