"use client";

import ProgressMeter from "@/components/progress-meter";
import HistoryChart from "@/components/history-chart";
import { toLogs, type HistoryPoint } from "@/lib/history";
import { useSocketData } from "@/hooks/use-socket-data";
import {
    GenKey,
    TelemetryGeneratorReading,
    TelemetryGenerators,
} from "@/lib/type";
import { useEffect, useState } from "react";
import { set } from "date-fns";
import { appendCapped, clone4, pickMetric } from "@/lib/utils";

type GeneratorData = {
    name: string;
    online: boolean;
    load_kw?: number;
    frequency_hz?: number;
    lube_oil_pressure_bar?: number;
    coolant_temperature_celsius?: number;
    exhaust_gas_temperature_celsius?: number;
    vibration_level_mm_s?: number;
};

function GeneratorCard({
    name,
    g,
    loadHistory,
    freqHistory,
}: {
    name: string;
    g: TelemetryGeneratorReading;
    loadHistory?: HistoryPoint[];
    freqHistory?: HistoryPoint[];
}) {
    const hist = { load_kw: loadHistory ?? [] };
    const freqHist = freqHistory;

    return (
        <div className="w-full rounded-(--radius-lg) border bg-(--color-card) p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-pretty">{name}</h3>
                <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                        g
                            ? "bg-(--color-secondary) text-(--color-secondary-foreground)"
                            : "bg-(--color-muted) text-(--color-muted-foreground)"
                    }`}
                >
                    {g ? "Aktif" : "Tidak Aktif"}
                </span>
            </div>

            {!g ? (
                <div className="text-sm text-(--color-muted-foreground)">
                    Unit tidak aktif
                </div>
            ) : (
                <>
                    {typeof g.load_kw === "number" ? (
                        <ProgressMeter
                            label="Load"
                            value={g.load_kw}
                            unit="kW"
                            max={2600}
                            warnAbove={2200}
                            critAbove={2400}
                        />
                    ) : null}

                    {hist.load_kw && hist.load_kw.length > 0 ? (
                        <HistoryChart
                            title="Load — 1 jam terakhir"
                            unit="kW"
                            data={hist.load_kw}
                            warnAbove={2200}
                            critAbove={2400}
                            yDomain={[0, 2600]}
                        />
                    ) : null}

                    {freqHist && freqHist.length > 0 ? (
                        <HistoryChart
                            title="Frekuensi — 1 jam terakhir"
                            unit="Hz"
                            data={freqHist}
                            warnBelow={59.8}
                            critBelow={59.5}
                            warnAbove={60.2}
                            critAbove={60.5}
                            yDomain={[0, 60]}
                        />
                    ) : null}

                    <div className="grid grid-cols-2 gap-3">
                        {typeof g.frequency_hz === "number" ? (
                            <ProgressMeter
                                label="Frequency"
                                value={g.frequency_hz}
                                unit="Hz"
                                max={61}
                                min={59}
                                warnBelow={59.8}
                                critBelow={59.5}
                                warnAbove={60.2}
                                critAbove={60.5}
                            />
                        ) : null}
                        {typeof g.lube_oil_pressure_bar === "number" ? (
                            <ProgressMeter
                                label="Lube Oil Pressure"
                                value={g.lube_oil_pressure_bar}
                                unit="bar"
                                max={8}
                                warnBelow={4.5}
                                critBelow={4.0}
                            />
                        ) : null}
                        {typeof g.coolant_temperature_celsius === "number" ? (
                            <ProgressMeter
                                label="Coolant Temp"
                                value={g.coolant_temperature_celsius}
                                unit="°C"
                                max={110}
                                warnAbove={90}
                                critAbove={95}
                            />
                        ) : null}
                        {typeof g.vibration_level_mm_s === "number" ? (
                            <ProgressMeter
                                label="Vibration"
                                value={g.vibration_level_mm_s}
                                unit="mm/s"
                                max={10}
                                warnAbove={4}
                                critAbove={6}
                            />
                        ) : null}
                    </div>

                    {hist.load_kw && hist.load_kw.length > 0 ? (
                        <div>
                            <h4 className="text-xs font-medium text-(--color-muted-foreground) mb-1">
                                Log — 1 jam terakhir
                            </h4>
                            <ul className="text-xs grid gap-1">
                                {toLogs(hist.load_kw, "kW", 6).map(
                                    (item, idx) => (
                                        <li
                                            key={idx}
                                            className="text-(--color-foreground)"
                                        >
                                            {item}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    ) : null}

                    {freqHist && freqHist.length > 0 ? (
                        <div>
                            <h4 className="text-xs font-medium text-(--color-muted-foreground) mb-1">
                                Log Frekuensi — 1 jam terakhir
                            </h4>
                            <ul className="text-xs grid gap-1">
                                {toLogs(freqHist, "Hz", 6).map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="text-(--color-foreground)"
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}

export default function GeneratorsSection() {
    const { data } = useSocketData();
    const dataGenerator: TelemetryGenerators | undefined =
        data?.data.main_features;

    const [loadHist, setLoadHist] = useState<HistoryPoint[][]>([
        [],
        [],
        [],
        [],
    ]);
    const [freqHist, setFreqHist] = useState<HistoryPoint[][]>([
        [],
        [],
        [],
        [],
    ]);

    useEffect(() => {
        if (!dataGenerator) return;

        // Use snapshot timestamp if present; otherwise use now
        const isoTs = data?.data?.timestamp ?? new Date().toISOString();

        // Build new arrays without mutating previous state
        setLoadHist((prev) => {
            const next = clone4(prev);
            for (let i = 0; i < 4; i++) {
                const g = dataGenerator[`generator_${i + 1}` as GenKey];
                if (!g) continue; // skip missing/null generator
                const pt = pickMetric(g, "load_kw", isoTs); // -> { t, v }
                next[i] = appendCapped(next[i] ?? [], pt, 3600);
            }
            return next;
        });

        setFreqHist((prev) => {
            const next = clone4(prev);
            for (let i = 0; i < 4; i++) {
                const g = dataGenerator[`generator_${i + 1}` as GenKey];
                if (!g) continue;
                const pt = pickMetric(g, "frequency_hz", isoTs);
                next[i] = appendCapped(next[i] ?? [], pt, 3600);
            }
            return next;
        });
        // Depend on the specific pieces that actually change
    }, [data?.data?.timestamp, dataGenerator]);

    useEffect(() => {
        // console.log(loadHist);
        // console.log(freqHist);
    }, [loadHist, freqHist]);

    return (
        <section aria-labelledby="generators-title" className="w-full">
            <header className="mb-3">
                <h2
                    id="generators-title"
                    className="text-lg font-semibold text-pretty"
                >
                    Data Generator
                </h2>
                <p className="text-sm text-(--color-muted-foreground)">
                    Menampilkan 4 generator. Warna chart dan progress bar
                    mengikuti status (kuning/merah jika tinggi).
                </p>
            </header>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-start justify-items-stretch">
                {/* Opsi 1: Array.from */}
                {Array.from({ length: 4 }, (_, idx) => {
                    const g = dataGenerator?.[`generator_${idx + 1}` as GenKey];
                    const generatorName = `Generator ${idx + 1}`;

                    return g ? (
                        <GeneratorCard
                            key={`generator-${idx}`}
                            name={generatorName}
                            g={g}
                            loadHistory={loadHist[idx]}
                            freqHistory={freqHist[idx]}
                        />
                    ) : null;
                })}
            </div>
        </section>
    );
}
