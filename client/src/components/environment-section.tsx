"use client"

import { Waves, Wind, Navigation, Compass } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import MetricCard from "@/components/metric-card"
import { genHistory } from "@/lib/history"
import { useLiveMetric } from "@/hooks/use-live-metric"

export default function EnvironmentSection() {
  const waveHeight = useLiveMetric({ base: 2.5, jitter: 0.15, min: 2.0, max: 3.5 })
  const windSpeed = useLiveMetric({ base: 25, jitter: 2, min: 20, max: 35 })
  const seaCurrent = useLiveMetric({ base: 1.2, jitter: 0.1, min: 1.0, max: 1.5 })

  const histWave = genHistory({ base: 2.5, jitter: 0.15, min: 0 })
  const histWind = genHistory({ base: 25, jitter: 2, min: 0 })
  const histCurrent = genHistory({ base: 1.2, jitter: 0.1, min: 0 })

  const navigationStatus =
    waveHeight < 4 && windSpeed < 30 && seaCurrent < 2
      ? "Sangat Baik"
      : waveHeight < 6 && windSpeed < 40 && seaCurrent < 3
        ? "Baik"
        : "Perhatian"

  const safetyStatus = waveHeight < 4 && windSpeed < 30 ? "Aman" : "Waspada"
  const recommendation =
    navigationStatus === "Sangat Baik" ? "Kondisi ideal untuk berlayar" : "Perhatikan kondisi cuaca dan laut"

  // Get current time
  const now = new Date()
  const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-blue-600" />
          Data Lingkungan Operasi Kapal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Tinggi Gelombang"
            value={waveHeight}
            unit="m"
            icon={<Waves className="h-4 w-4 text-blue-500" />}
            min={2.0}
            max={3.5}
            warnAbove={4}
            critAbove={6}
            historyData={histWave}
            chartTitle="Tinggi Gelombang — 60 min"
            yDomain={[0, 10]}
          />
          <MetricCard
            label="Kecepatan Angin"
            value={windSpeed}
            unit="kt"
            icon={<Wind className="h-4 w-4 text-cyan-500" />}
            min={20}
            max={35}
            warnAbove={30}
            critAbove={40}
            historyData={histWind}
            chartTitle="Kecepatan Angin — 60 min"
            yDomain={[0, 60]}
          />
          <MetricCard
            label="Arus Laut"
            value={seaCurrent}
            unit="kt"
            icon={<Navigation className="h-4 w-4 text-teal-500" />}
            min={1.0}
            max={1.5}
            warnAbove={2}
            critAbove={3}
            historyData={histCurrent}
            chartTitle="Arus Laut — 60 min"
            yDomain={[0, 5]}
          />
        </div>

        <div className="rounded-lg border bg-teal-50/50 p-4">
          <div className="flex items-start gap-3">
            <Compass className="h-5 w-5 text-teal-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-teal-900 mb-2">Ringkasan Kondisi Lingkungan</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-teal-700 font-medium">Kondisi Navigasi:</span>
                  <span className="ml-2 text-teal-900">{navigationStatus}</span>
                </div>
                <div>
                  <span className="text-teal-700 font-medium">Status Keselamatan:</span>
                  <span className="ml-2 text-teal-900">{safetyStatus}</span>
                </div>
                <div>
                  <span className="text-teal-700 font-medium">Rekomendasi:</span>
                  <span className="ml-2 text-teal-900">{recommendation}</span>
                </div>
                <div>
                  <span className="text-teal-700 font-medium">Waktu Update:</span>
                  <span className="ml-2 text-teal-900">{timeString}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
