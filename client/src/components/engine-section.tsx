"use client"

import { Settings, Droplet, Activity, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import MetricCard from "@/components/metric-card"
import { genHistory } from "@/lib/history"
import { useLiveMetric } from "@/hooks/use-live-metric"

export default function EngineSection() {
  const oilPressure = useLiveMetric({ base: 4.6, jitter: 0.1, min: 4.0, max: 5.5 })
  const coolantTemp = useLiveMetric({ base: 79, jitter: 2, min: 70, max: 90 })
  const vibration = useLiveMetric({ base: 2.6, jitter: 0.15, min: 2.0, max: 4.0 })
  const rpm = useLiveMetric({ base: 1796, jitter: 20, min: 1700, max: 1900 })

  const histOil = genHistory({ base: 4.6, jitter: 0.1, min: 0 })
  const histCoolant = genHistory({ base: 79, jitter: 2 })
  const histVibration = genHistory({ base: 2.6, jitter: 0.15, min: 0 })
  const histRpm = genHistory({ base: 1796, jitter: 20, min: 0 })

  const isNormal = oilPressure >= 4.5 && coolantTemp < 85 && vibration < 3.5 && rpm >= 1500

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-600" />
          Data Operasional Mesin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Tekanan Oli"
            value={oilPressure}
            unit="bar"
            icon={<Droplet className="h-4 w-4 text-blue-500" />}
            min={4.0}
            max={5.5}
            warnBelow={4.5}
            critBelow={4.0}
            historyData={histOil}
            chartTitle="Tekanan Oli — 60 min"
            yDomain={[0, 8]}
          />
          <MetricCard
            label="Suhu Coolant"
            value={coolantTemp}
            unit="°C"
            min={70}
            max={90}
            warnAbove={85}
            critAbove={95}
            historyData={histCoolant}
            chartTitle="Suhu Coolant — 60 min"
            yDomain={[60, 110]}
          />
          <MetricCard
            label="Getaran"
            value={vibration}
            unit="mm/s"
            icon={<Activity className="h-4 w-4 text-orange-500" />}
            min={2.0}
            max={4.0}
            warnAbove={3.5}
            critAbove={5}
            historyData={histVibration}
            chartTitle="Getaran — 60 min"
            yDomain={[0, 10]}
          />
          <MetricCard
            label="RPM"
            value={rpm}
            unit="RPM"
            min={1700}
            max={1900}
            warnBelow={1500}
            critBelow={1200}
            historyData={histRpm}
            chartTitle="RPM — 60 min"
            yDomain={[0, 2500]}
          />
        </div>

        <div className="rounded-lg border bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Status Mesin</h3>
              <p className="text-sm text-amber-800">
                {isNormal
                  ? "Semua parameter dalam batas normal. Mesin beroperasi dengan optimal."
                  : "Beberapa parameter memerlukan perhatian. Periksa metrik yang ditandai."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
