"use client"

import { Zap, Battery, Activity, Radio } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import MetricCard from "@/components/metric-card"
import { useSocketData } from "@/hooks/use-socket-data"

export default function ElectricalSection() {
  const { electrical } = useSocketData()
  const voltage = electrical.voltage ?? 398
  const current = electrical.current ?? 143
  const power = electrical.power ?? 79
  const frequency = electrical.frequency ?? 50.4

  const histVoltage = electrical.voltageHistory ?? []
  const histCurrent = electrical.currentHistory ?? []
  const histPower = electrical.powerHistory ?? []
  const histFrequency = electrical.frequencyHistory ?? []

  const isNormal =
    voltage >= 380 && voltage <= 420 && current <= 120 && power <= 100 && frequency >= 49.5 && frequency <= 50.5

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Data Kelistrikan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Tegangan"
            value={voltage}
            unit="V"
            icon={<Battery className="h-4 w-4 text-green-500" />}
            min={390}
            max={410}
            warnBelow={380}
            critBelow={360}
            warnAbove={420}
            critAbove={440}
            historyData={histVoltage}
            chartTitle="Tegangan — 1 jam terakhir"
            yDomain={[350, 450]}
          />
          <MetricCard
            label="Arus"
            value={current}
            unit="A"
            icon={<Activity className="h-4 w-4 text-red-500" />}
            min={130}
            max={160}
            warnAbove={120}
            critAbove={150}
            historyData={histCurrent}
            chartTitle="Arus — 1 jam terakhir"
            yDomain={[0, 200]}
          />
          <MetricCard
            label="Daya"
            value={power}
            unit="kW"
            icon={<Zap className="h-4 w-4 text-blue-500" />}
            min={70}
            max={90}
            warnAbove={100}
            critAbove={120}
            historyData={histPower}
            chartTitle="Daya — 1 jam terakhir"
            yDomain={[0, 150]}
          />
          <MetricCard
            label="Frekuensi"
            value={frequency}
            unit="Hz"
            icon={<Radio className="h-4 w-4 text-purple-500" />}
            min={49.5}
            max={51}
            warnBelow={49.5}
            critBelow={49}
            warnAbove={50.5}
            critAbove={51}
            historyData={histFrequency}
            chartTitle="Frekuensi — 1 jam terakhir"
            yDomain={[48, 52]}
          />
        </div>

        <div className="rounded-lg border bg-blue-50/50 p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Kualitas Daya</h3>
              <p className="text-sm text-blue-800">
                {isNormal
                  ? "Sistem kelistrikan beroperasi dalam parameter normal. Efisiensi energi optimal."
                  : "Sistem kelistrikan memerlukan perhatian. Periksa parameter yang tidak normal."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


