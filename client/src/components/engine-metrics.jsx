"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Gauge, Thermometer, Activity, Settings, AlertTriangle } from "lucide-react"

export function EngineMetrics() {
  const [engineData, setEngineData] = useState({
    oilPressure: 4.2,
    temperature: 85,
    vibration: 2.1,
    rpm: 1850,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setEngineData((prev) => ({
        oilPressure: Math.max(3.5, Math.min(5.0, prev.oilPressure + (Math.random() - 0.5) * 0.2)),
        temperature: Math.max(75, Math.min(95, prev.temperature + (Math.random() - 0.5) * 3)),
        vibration: Math.max(1.0, Math.min(4.0, prev.vibration + (Math.random() - 0.5) * 0.3)),
        rpm: Math.max(1500, Math.min(2200, prev.rpm + (Math.random() - 0.5) * 50)),
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value, min, max, optimal) => {
    if (Math.abs(value - optimal) / optimal < 0.1) return "bg-emerald-500"
    if (value < min || value > max) return "bg-red-500"
    return "bg-yellow-500"
  }

  const getStatusBadge = (value, min, max, optimal) => {
    if (Math.abs(value - optimal) / optimal < 0.1) return <Badge className="bg-emerald-500">Normal</Badge>
    if (value < min || value > max) return <Badge className="bg-red-500">Peringatan</Badge>
    return <Badge className="bg-yellow-500">Perhatian</Badge>
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Data Operasional Mesin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Oil Pressure */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Tekanan Oli</span>
            </div>
            {getStatusBadge(engineData.oilPressure, 3.5, 5.0, 4.2)}
          </div>
          <div className="flex items-center gap-4">
            <Progress value={(engineData.oilPressure / 6) * 100} className="flex-1" />
            <span className="text-lg font-bold text-primary min-w-[80px]">{engineData.oilPressure.toFixed(1)} bar</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-600" />
              <span className="font-medium">Suhu Mesin</span>
            </div>
            {getStatusBadge(engineData.temperature, 75, 95, 85)}
          </div>
          <div className="flex items-center gap-4">
            <Progress value={(engineData.temperature / 120) * 100} className="flex-1" />
            <span className="text-lg font-bold text-primary min-w-[80px]">{engineData.temperature.toFixed(0)}°C</span>
          </div>
        </div>

        {/* Vibration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Getaran</span>
            </div>
            {getStatusBadge(engineData.vibration, 1.0, 3.0, 2.0)}
          </div>
          <div className="flex items-center gap-4">
            <Progress value={(engineData.vibration / 5) * 100} className="flex-1" />
            <span className="text-lg font-bold text-primary min-w-[80px]">{engineData.vibration.toFixed(1)} mm/s</span>
          </div>
        </div>

        {/* RPM */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-600" />
              <span className="font-medium">RPM</span>
            </div>
            {getStatusBadge(engineData.rpm, 1500, 2200, 1850)}
          </div>
          <div className="flex items-center gap-4">
            <Progress value={(engineData.rpm / 2500) * 100} className="flex-1" />
            <span className="text-lg font-bold text-primary min-w-[80px]">{engineData.rpm.toFixed(0)} RPM</span>
          </div>
        </div>

        {/* Engine Status Summary */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium">Status Mesin</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Semua parameter dalam batas normal. Mesin beroperasi dengan optimal.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
