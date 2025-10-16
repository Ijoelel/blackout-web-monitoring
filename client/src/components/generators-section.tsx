"use client";

import ProgressMeter from "@/components/progress-meter";
import HistoryChart from "@/components/history-chart";
import { genHistory, toLogs, type HistoryPoint } from "@/lib/history";

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

function buildGeneratorHistory(g: GeneratorData, now: number) {
    // history only for online units
    const hist: Record<string, HistoryPoint[]> = {};
    if (!g.online) return hist;
    if (g.load_kw != null)
        hist.load_kw = genHistory({
            base: g.load_kw,
            jitter: 0.03,
            points: 60,
            min: 0,
            now,
        });
    if (g.frequency_hz != null)
        hist.frequency_hz = genHistory({
            base: g.frequency_hz,
            jitter: 0.001,
            points: 60,
            now,
        });
    if (g.lube_oil_pressure_bar != null)
        hist.lube_oil_pressure_bar = genHistory({
            base: g.lube_oil_pressure_bar,
            jitter: 0.05,
            points: 60,
            min: 0,
            now,
        });
    if (g.coolant_temperature_celsius != null)
        hist.coolant_temperature_celsius = genHistory({
            base: g.coolant_temperature_celsius,
            jitter: 0.02,
            points: 60,
            now,
        });
    if (g.exhaust_gas_temperature_celsius != null)
        hist.exhaust_gas_temperature_celsius = genHistory({
            base: g.exhaust_gas_temperature_celsius,
            jitter: 0.03,
            points: 60,
            now,
        });
    if (g.vibration_level_mm_s != null)
        hist.vibration_level_mm_s = genHistory({
            base: g.vibration_level_mm_s,
            jitter: 0.08,
            points: 60,
            min: 0,
            now,
        });
    return hist;
}

function GeneratorCard({ g }: { g: GeneratorData }) {
    const now = Date.now();
    const hist = buildGeneratorHistory(g, now);
    console.log(hist);

    return (
        <div className="rounded-(--radius-lg) border bg-(--color-card) p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-pretty">{g.name}</h3>
                <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                        g.online
                            ? "bg-(--color-secondary) text-(--color-secondary-foreground)"
                            : "bg-(--color-muted) text-(--color-muted-foreground)"
                    }`}
                >
                    {g.online ? "Aktif" : "Tidak Aktif"}
                </span>
            </div>

            {!g.online ? (
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

                    {hist.load_kw ? (
                        <HistoryChart
                            title="Load (kW) — 60 min"
                            unit="kW"
                            data={hist.load_kw}
                            warnAbove={2200}
                            critAbove={2400}
                            yDomain={[0, 2600]}
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

                    {hist.load_kw ? (
                        <div>
                            <h4 className="text-xs font-medium text-(--color-muted-foreground) mb-1">
                                Riwayat (terakhir 1 jam)
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
                </>
            )}
        </div>
    );
}

export default function GeneratorsSection() {
    // base snapshot aligned with provided spec
    const gen1: GeneratorData = {
        name: "Generator 1",
        online: true,
        load_kw: 2150.5,
        frequency_hz: 59.95,
        lube_oil_pressure_bar: 5.4,
        coolant_temperature_celsius: 85.5,
        exhaust_gas_temperature_celsius: 430.0,
        vibration_level_mm_s: 3.5,
    };
    const gen2: GeneratorData = {
        name: "Generator 2",
        online: true,
        load_kw: 2220.0,
        frequency_hz: 59.94,
        lube_oil_pressure_bar: 5.3,
        coolant_temperature_celsius: 85.1,
        exhaust_gas_temperature_celsius: 435.5,
        vibration_level_mm_s: 3.8,
    };
    const gen3: GeneratorData = {
        name: "Generator 3",
        online: true,
        load_kw: 2180.0,
        frequency_hz: 59.96,
        lube_oil_pressure_bar: 5.5,
        coolant_temperature_celsius: 85.3,
        exhaust_gas_temperature_celsius: 432.0,
        vibration_level_mm_s: 3.6,
    };
    const gen4: GeneratorData = { name: "Generator 4", online: false };

    const items = [gen1, gen2, gen3, gen4];

    return (
        <section
            aria-labelledby="generators-title"
            className="max-w-7xl mx-auto"
        >
            <header className="mb-3">
                <h2
                    id="generators-title"
                    className="text-lg font-semibold text-pretty"
                >
                    Data Generator (tengah)
                </h2>
                <p className="text-sm text-(--color-muted-foreground)">
                    Menampilkan 4 generator. Warna chart dan progress bar
                    mengikuti status (kuning/merah jika tinggi).
                </p>
            </header>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {items.map((g) => (
                    <GeneratorCard key={g.name} g={g} />
                ))}
            </div>
        </section>
    );
}
