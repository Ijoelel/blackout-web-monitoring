"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  BarChart3,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PredictionState } from "@/lib/type";

export interface BlackoutPredictionProps {
  prediction?: PredictionState;
}

export default function BlackoutPrediction({
  prediction = {
    ready: true,
    score: 0.5155017971992493,
    threshold: 0.48,
    blackout_prob: 0.5734272893718358,
    top_contributors: [
      { name: "g1_frequency_hz", contribution: 3.82, percent: 0.206 },
      { name: "g2_coolant_temperature_celsius", contribution: 1.95, percent: 0.105 },
      { name: "g3_exhaust_gas_temperature_celsius", contribution: 1.70, percent: 0.091 },
      { name: "g3_lube_oil_pressure_bar", contribution: 1.50, percent: 0.081 },
      { name: "g1_exhaust_gas_temperature_celsius", contribution: 1.50, percent: 0.081 },
    ],
  },
}: BlackoutPredictionProps) {
  const [openPrediksi, setOpenPrediksi] = useState(false);
  const [openContrib, setOpenContrib] = useState(false);

  // Simulasi data 1 jam terakhir
  const historyData = Array.from({ length: 12 }).map((_, i) => ({
    time: `${(2 + Math.floor(i / 6))
      .toString()
      .padStart(2, "0")}:${(15 + (i % 6) * 5).toString().padStart(2, "0")} AM`,
    risk: 0.45 + Math.sin(i / 2) * 0.05 + Math.random() * 0.03,
  }));

  const getStatus = (score: number, threshold: number, blackout_prob: number) => {
    if (blackout_prob < 0.8)
      return {
        label: "Normal",
        color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
      };
    if (blackout_prob <= 0.85)
      return {
        label: "Warning",
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
      };
    return {
      label: "Critical",
      color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100",
    };
  };

  const status = getStatus(prediction.score, prediction.threshold, prediction.blackout_prob);
  const displayScore = (prediction.score * 100).toFixed(1);
  const displayBlackoutProb = (prediction.blackout_prob * 100).toFixed(1);

  // 🔹 Warna baru untuk angka kontribusi
  const getContributionColor = (percent: number) => {
    if (percent > 0.15) return "text-red-600 font-semibold"; // tinggi
    if (percent > 0.08) return "text-yellow-600 font-medium"; // sedang
    return "text-gray-500"; // rendah
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Prediksi Blackout
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Layout dua kolom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 🔹 KIRI - PREDIKSI */}
          <Collapsible open={openPrediksi} onOpenChange={setOpenPrediksi}>
            <CollapsibleTrigger className="w-full rounded-lg border p-4 flex items-center justify-between bg-card/50 hover:bg-accent transition">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-foreground">Data Prediksi</span>
              </div>

              {!openPrediksi && (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {displayScore}% / {displayBlackoutProb}%
                  </p>
                  <div
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      status.color
                    )}
                  >
                    {status.label}
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      openPrediksi && "rotate-180"
                    )}
                  />
                </div>
              )}

              {openPrediksi && (
                <ChevronDown
                  className={cn("h-5 w-5 transition-transform", openPrediksi && "rotate-180")}
                />
              )}
            </CollapsibleTrigger>

            {/* isi dropdown */}
            <CollapsibleContent className="mt-3 rounded-lg border bg-card/40 p-4 space-y-4">
              {/* skor muncul di dalam dropdown saat terbuka */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Skor Risiko / Probabilitas Blackout
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {displayScore}% / {displayBlackoutProb}%
                  </p>
                </div>
                <div
                  className={cn(
                    "px-3 py-2 rounded-lg font-medium text-sm",
                    status.color
                  )}
                >
                  {status.label}
                </div>
              </div>

              {/* Grafik bergaya sama seperti panel generator */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  Prediksi — 1 jam terakhir
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#f9fafb" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0.3, 0.7]} />
                      <Tooltip
                        formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                        labelFormatter={(label) => `Waktu ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="risk"
                        stroke="#4b5563"
                        fill="url(#colorRisk)"
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-lg p-3 border text-sm",
                  prediction.blackout_prob < 0.8
                    ? "bg-green-50/60 border-green-200 text-green-700"
                    : prediction.blackout_prob <= 0.85
                    ? "bg-yellow-50/60 border-yellow-200 text-yellow-700"
                    : "bg-red-50/60 border-red-200 text-red-700"
                )}
              >
                {prediction.blackout_prob < 0.8
                  ? "Sistem dalam kondisi normal. Tidak ada risiko blackout yang terdeteksi."
                  : prediction.blackout_prob <= 0.85
                  ? "Sistem dalam kondisi warning. Pantau beban dan frekuensi generator."
                  : "Sistem dalam kondisi kritis. Ambil tindakan segera untuk mencegah blackout."}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 🔹 KANAN - TOP CONTRIBUTORS */}
          <Collapsible open={openContrib} onOpenChange={setOpenContrib}>
            <CollapsibleTrigger className="w-full rounded-lg border p-4 flex items-center justify-between bg-card/50 hover:bg-accent transition">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-600" />
                <span className="font-semibold text-foreground">Top Contributors</span>
              </div>
              <ChevronDown
                className={cn("h-5 w-5 transition-transform", openContrib && "rotate-180")}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3 rounded-lg border bg-card/40 p-4 space-y-3">
              {prediction.top_contributors && prediction.top_contributors.length > 0 ? (
                prediction.top_contributors.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border pb-1"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Kontribusi:{" "}
                        <span className={getContributionColor(c.percent)}>
                          {c.contribution.toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        getContributionColor(c.percent)
                      )}
                    >
                      {(c.percent * 100).toFixed(1)}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada data kontributor.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
