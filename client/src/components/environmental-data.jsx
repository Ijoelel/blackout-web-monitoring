"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Wind, Waves, CloudRain, Thermometer, Eye, Navigation } from "lucide-react"

export function EnvironmentalData() {
  const [envData, setEnvData] = useState({
    windSpeed: 12,
    windDirection: 245,
    waveHeight: 1.8,
    rainfall: 0,
    visibility: 8.5,
    seaTemperature: 28,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setEnvData((prev) => ({
        windSpeed: Math.max(5, Math.min(25, prev.windSpeed + (Math.random() - 0.5) * 3)),
        windDirection: (prev.windDirection + (Math.random() - 0.5) * 20 + 360) % 360,
        waveHeight: Math.max(0.5, Math.min(4.0, prev.waveHeight + (Math.random() - 0.5) * 0.4)),
        rainfall: Math.max(0, Math.min(10, prev.rainfall + (Math.random() - 0.5) * 1)),
        visibility: Math.max(2, Math.min(15, prev.visibility + (Math.random() - 0.5) * 1)),
        seaTemperature: Math.max(25, Math.min(32, prev.seaTemperature + (Math.random() - 0.5) * 0.5)),
      }))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const getWindDirectionText = (degrees) => {
    const directions = [
      "U",
      "UUT",
      "UT",
      "TUT",
      "T",
      "TST",
      "ST",
      "SST",
      "S",
      "SSB",
      "SB",
      "BSB",
      "B",
      "BUB",
      "UB",
      "UUB",
    ]
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  const getSeaCondition = (waveHeight) => {
    if (waveHeight < 1) return { text: "Tenang", color: "bg-emerald-500" }
    if (waveHeight < 2) return { text: "Ringan", color: "bg-yellow-500" }
    if (waveHeight < 3) return { text: "Sedang", color: "bg-orange-500" }
    return { text: "Kasar", color: "bg-red-500" }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Data Lingkungan Operasi Kapal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Wind Data */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Wind className="h-5 w-5 text-blue-600" />
              Kondisi Angin
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Kecepatan Angin</span>
                  <Badge
                    className={
                      envData.windSpeed < 15
                        ? "bg-emerald-500"
                        : envData.windSpeed < 20
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }
                  >
                    {envData.windSpeed < 15 ? "Ringan" : envData.windSpeed < 20 ? "Sedang" : "Kuat"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={(envData.windSpeed / 30) * 100} className="flex-1" />
                  <span className="text-lg font-bold text-primary min-w-[70px]">{envData.windSpeed.toFixed(1)} kt</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Arah Angin</span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{envData.windDirection.toFixed(0)}°</span>
                      <span className="text-lg font-semibold text-muted-foreground">
                        {getWindDirectionText(envData.windDirection)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave Data */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Waves className="h-5 w-5 text-blue-600" />
              Kondisi Gelombang
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Tinggi Gelombang</span>
                  <Badge className={getSeaCondition(envData.waveHeight).color}>
                    {getSeaCondition(envData.waveHeight).text}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={(envData.waveHeight / 5) * 100} className="flex-1" />
                  <span className="text-lg font-bold text-primary min-w-[70px]">{envData.waveHeight.toFixed(1)} m</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Suhu Air Laut</span>
                <div className="flex items-center gap-3 mt-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <span className="text-2xl font-bold text-primary">{envData.seaTemperature.toFixed(1)}°C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Data */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-blue-600" />
              Kondisi Cuaca
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Intensitas Hujan</span>
                  <Badge
                    className={
                      envData.rainfall === 0 ? "bg-emerald-500" : envData.rainfall < 5 ? "bg-yellow-500" : "bg-red-500"
                    }
                  >
                    {envData.rainfall === 0 ? "Cerah" : envData.rainfall < 5 ? "Ringan" : "Lebat"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={(envData.rainfall / 15) * 100} className="flex-1" />
                  <span className="text-lg font-bold text-primary min-w-[70px]">
                    {envData.rainfall.toFixed(1)} mm/h
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Jarak Pandang</span>
                  <Badge
                    className={
                      envData.visibility > 5
                        ? "bg-emerald-500"
                        : envData.visibility > 2
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }
                  >
                    {envData.visibility > 5 ? "Baik" : envData.visibility > 2 ? "Sedang" : "Buruk"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <span className="text-2xl font-bold text-primary">{envData.visibility.toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Summary */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Ringkasan Kondisi Lingkungan</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">
                <strong>Kondisi Navigasi:</strong>{" "}
                {envData.visibility > 5 && envData.waveHeight < 2
                  ? "Sangat Baik"
                  : envData.visibility > 2 && envData.waveHeight < 3
                    ? "Baik"
                    : "Perlu Perhatian"}
              </p>
              <p className="text-muted-foreground">
                <strong>Rekomendasi:</strong>{" "}
                {envData.windSpeed < 15 && envData.waveHeight < 2
                  ? "Kondisi ideal untuk berlayar"
                  : "Pantau kondisi cuaca secara berkala"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                <strong>Status Keselamatan:</strong>{" "}
                {envData.windSpeed < 20 && envData.waveHeight < 3 && envData.visibility > 2 ? "Aman" : "Waspada"}
              </p>
              <p className="text-muted-foreground">
                <strong>Waktu Update:</strong> {new Date().toLocaleTimeString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


