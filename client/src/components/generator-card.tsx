"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HistoryChart } from "./history-chart"
import { cn } from "@/lib/utils"

export type GeneratorSnapshot = {
  name: string
  online: boolean
  load_kw?: number
  frequency_hz?: number
  lube_oil_pressure_bar?: number
  coolant_temperature_celsius?: number
  exhaust_gas_temperature_celsius?: number
  vibration_level_mm_s?: number
}

type Point = { t: string; v: number }

export function GeneratorCard({
  snapshot,
  history,
}: {
  snapshot: GeneratorSnapshot
  history: { loadKw: Point[] }
}) {
  const isOffline = !snapshot.online

  const LOAD_HIGH = 2300
  const FREQ_LOW = 59.7
  const FREQ_HIGH = 60.3
  const TEMP_HIGH = 95
  const VIB_HIGH = 6

  const highFlags = {
    load: (snapshot.load_kw ?? 0) > LOAD_HIGH,
    frequency: (snapshot.frequency_hz ?? 0) < FREQ_LOW || (snapshot.frequency_hz ?? 0) > FREQ_HIGH,
    temp: (snapshot.coolant_temperature_celsius ?? 0) > TEMP_HIGH,
    vib: (snapshot.vibration_level_mm_s ?? 0) > VIB_HIGH,
  }
  const anyHigh = Object.values(highFlags).some(Boolean)

  return (
    <Card className={cn(anyHigh ? "border-destructive" : undefined)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{snapshot.name}</CardTitle>
        <CardDescription>
          {isOffline ? "Tidak Aktif" : "Aktif"} {isOffline ? "" : "• Realtime"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Load</div>
            <div className={cn(highFlags.load ? "text-destructive" : "text-foreground", "font-medium")}>
              {isOffline ? "-" : `${snapshot.load_kw?.toFixed(1)} kW`}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Frequency</div>
            <div className={cn(highFlags.frequency ? "text-destructive" : "text-foreground", "font-medium")}>
              {isOffline ? "-" : `${snapshot.frequency_hz?.toFixed(2)} Hz`}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Lube Oil Press.</div>
            <div className="font-medium">{isOffline ? "-" : `${snapshot.lube_oil_pressure_bar?.toFixed(1)} bar`}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Coolant Temp</div>
            <div className={cn(highFlags.temp ? "text-destructive" : "text-foreground", "font-medium")}>
              {isOffline ? "-" : `${snapshot.coolant_temperature_celsius?.toFixed(1)} °C`}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Exhaust Temp</div>
            <div className="font-medium">
              {isOffline ? "-" : `${snapshot.exhaust_gas_temperature_celsius?.toFixed(1)} °C`}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Vibration</div>
            <div className={cn(highFlags.vib ? "text-destructive" : "text-foreground", "font-medium")}>
              {isOffline ? "-" : `${snapshot.vibration_level_mm_s?.toFixed(1)} mm/s`}
            </div>
          </div>
        </div>

        <HistoryChart title="Load (1 hour)" unit="kW" data={history.loadKw} threshold={LOAD_HIGH} />
      </CardContent>
    </Card>
  )
}
