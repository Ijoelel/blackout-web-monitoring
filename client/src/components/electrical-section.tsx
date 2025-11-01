"use client";

import { Zap, Battery, Activity, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricCard from "@/components/metric-card";
import { useSocketData } from "@/hooks/use-socket-data";
import { useEffect, useState } from "react";
import { HistoryPoint } from "@/lib/type";
import { appendCapped, clone4, pickMetric } from "@/lib/utils";

export default function ElectricalSection() {
    const { data } = useSocketData();
    const msb = data?.data.distribution_features;

    const voltage = msb?.msb_busbar_voltage_v;
    const power = msb?.msb_total_active_power_kw;

    const [voltageHist, setVoltageHist] = useState<HistoryPoint[]>([]);
    const [powerHist, setPowerHist] = useState<HistoryPoint[]>([]);

    useEffect(() => {
        if (!msb) return;

        // Use snapshot timestamp if present; otherwise use now
        const isoTs = data?.data?.timestamp ?? new Date().toISOString();

        // Build new arrays without mutating previous state
        setVoltageHist((prev) => {
            let next = prev;
            const pt = pickMetric(msb, "msb_busbar_voltage_v" as never, isoTs); // -> { t, v }
            next = appendCapped(next ?? [], pt, 3600);

            return next;
        });

        setPowerHist((prev) => {
            let next = prev;
            const pt = pickMetric(
                msb,
                "msb_total_active_power_kw" as never,
                isoTs
            );
            next = appendCapped(next ?? [], pt, 3600);
            return next;
        });
        // Depend on the specific pieces that actually change
    }, [data?.data?.timestamp, msb]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Data Kelistrikan
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <MetricCard
                        label="Tegangan"
                        value={voltage as number}
                        unit="V"
                        icon={<Battery className="h-4 w-4 text-green-500" />}
                        max={750}
                        warnBelow={380}
                        critBelow={300}
                        warnAbove={600}
                        critAbove={700}
                        historyData={voltageHist}
                        chartTitle="Tegangan — 1 jam terakhir"
                        yDomain={[350, 450]}
                    />
                    <MetricCard
                        label="Daya"
                        value={power as number}
                        unit="kW"
                        icon={<Zap className="h-4 w-4 text-blue-500" />}
                        min={0}
                        max={
                            (data?.data.num_generators_online as number) * 1200
                        }
                        warnAbove={
                            (data?.data.num_generators_online as number) * 1000
                        }
                        critAbove={
                            (data?.data.num_generators_online as number) * 1100
                        }
                        historyData={powerHist}
                        chartTitle="Daya — 1 jam terakhir"
                        yDomain={[0, 150]}
                    />
                </div>

                <div className="rounded-lg border bg-blue-50/50 p-4">
                    <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-1">
                                Kualitas Daya
                            </h3>
                            {/* <p className="text-sm text-blue-800">
                                {isNormal
                                    ? "Sistem kelistrikan beroperasi dalam parameter normal. Efisiensi energi optimal."
                                    : "Sistem kelistrikan memerlukan perhatian. Periksa parameter yang tidak normal."}
                            </p> */}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
