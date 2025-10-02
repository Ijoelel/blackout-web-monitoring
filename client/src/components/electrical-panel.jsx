"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, Battery, Activity, Power, CheckCircle } from "lucide-react"

export function ElectricalPanel() {
  const [electricalData, setElectricalData] = useState({
    voltage: 380,
    current: 125,
    power: 65,
    frequency: 50.1,
    synchronization: true,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setElectricalData((prev) => ({
        voltage: Math.max(360, Math.min(400, prev.voltage + (Math.random() - 0.5) * 5)),
        current: Math.max(100, Math.min(150, prev.current + (Math.random() - 0.5) * 8)),
        power: Math.max(50, Math.min(80, prev.power + (Math.random() - 0.5) * 3)),
        frequency: Math.max(49.5, Math.min(50.5, prev.frequency + (Math.random() - 0.5) * 0.2)),
        synchronization: Math.random() > 0.1, // 90% chance of being synchronized
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Data Kelistrikan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voltage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Tegangan</span>
            </div>
            <Badge
              className={
                electricalData.voltage >= 360 && electricalData.voltage <= 400 ? "bg-emerald-500" : "bg-yellow-500"
              }
            >
              {electricalData.voltage >= 360 && electricalData.voltage <= 400 ? "Normal" : "Perhatian"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={(electricalData.voltage / 450) * 100} className="flex-1" />
            <span className="text-lg font-bold text-primary min-w-[80px]">{electricalData.voltage.toFixed(0)} V</span>
          </div>
        </div>

        {/* Current */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Arus</span>
            </div>
            <Badge className={electricalData.current <= 140 ? "bg-emerald-500" : "bg-red-500"}>
              {electricalData.current <= 140 ? "Normal" : "Tinggi"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={(electricalData.current / 200) * 100} className="flex-1" />
            <span className="text-lg font-bold text-primary min-w-[80px]">{electricalData.current.toFixed(0)} A</span>
          </div>
        </div>

        {/* Power */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className="h-4 w-4 text-green-600" />
              <span className="font-medium">Daya</span>
            </div>
            <Badge className="bg-emerald-500">Optimal</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={electricalData.power} className="flex-1" />
            <span className="text-lg font-bold text-primary min-w-[80px]">{electricalData.power.toFixed(0)} kW</span>
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Frekuensi</span>
            </div>
            <Badge className={Math.abs(electricalData.frequency - 50) < 0.3 ? "bg-emerald-500" : "bg-yellow-500"}>
              {Math.abs(electricalData.frequency - 50) < 0.3 ? "Stabil" : "Fluktuasi"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={((electricalData.frequency - 49) / 2) * 100} className="flex-1" />
            <span className="text-lg font-bold text-primary min-w-[80px]">
              {electricalData.frequency.toFixed(1)} Hz
            </span>
          </div>
        </div>

        {/* Synchronization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Sinkronisasi</span>
            </div>
            <Badge className={electricalData.synchronization ? "bg-emerald-500" : "bg-red-500"}>
              {electricalData.synchronization ? "Tersinkron" : "Tidak Sinkron"}
            </Badge>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${electricalData.synchronization ? "bg-emerald-500" : "bg-red-500"} animate-pulse`}
              ></div>
              <span className="text-sm">
                {electricalData.synchronization
                  ? "Generator tersinkron dengan grid utama"
                  : "Generator tidak tersinkron"}
              </span>
            </div>
          </div>
        </div>

        {/* Power Quality Summary */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Kualitas Daya</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sistem kelistrikan beroperasi dalam parameter normal. Efisiensi energi optimal.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
