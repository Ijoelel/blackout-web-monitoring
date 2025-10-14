"use client"


import useSWR from "swr"
import type { HistoryPoint } from "@/lib/history"


export type ShipMetrics = {
  operationalStatus: "operational" | "warning" | "critical"
  speed: number
  fuelConsumption: number
  updatedAt: number
  speedHistory: HistoryPoint[]
  fuelHistory: HistoryPoint[]
}


const fetcher = (url: string) => fetch(url).then((r) => r.json())


export function useShipMetrics() {
  const { data, error, isLoading, mutate } = useSWR<ShipMetrics>("/api/ship-metrics", fetcher, {
    refreshInterval: 2000,
  })
  return { data, error, isLoading, mutate }
}



