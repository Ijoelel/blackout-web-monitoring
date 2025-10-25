"use client";

import { useMemo } from "react";
import {
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSocketData } from "@/hooks/use-socket-data";
import BlackoutPrediction from "@/components/blackout-prediction";

// warna status badge
function statusStyle(s?: "operational" | "warning" | "critical") {
  switch (s) {
    case "critical":
      return {
        text: "Kritis",
        cls: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100",
        Icon: XCircle,
      };
    case "warning":
      return {
        text: "Perhatian",
        cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
        Icon: AlertTriangle,
      };
    default:
      return {
        text: "Operasional",
        cls: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
        Icon: CheckCircle,
      };
  }
}

export default function EngineSection() {
  const { data } = useSocketData();
  const status = "operational";
  const sStyle = useMemo(() => statusStyle(status), [status]);
  const SIcon = sStyle.Icon;
  const isNormal = status === "operational";

  // 🔹 Ambil status kapal dari data socket
  const shipStatus =
    data?.data.mode === "startup"
      ? "Startup"
      : data?.data.mode === "stable"
      ? "Stable"
      : data?.data.mode === "high_load"
      ? "High Load"
      : "Bad Environment";

  // 🔹 Ambil hasil prediksi blackout
  const blackoutProb = data?.prediction?.blackout_prob ?? 0.5;
  let blackoutLevel: "Normal" | "Warning" | "Critical" = "Normal";
  if (blackoutProb > 0.85) blackoutLevel = "Critical";
  else if (blackoutProb > 0.75) blackoutLevel = "Warning";

  // 🔹 Tentukan notifikasi dinamis berdasarkan kondisi kapal + blackout
  const getSummaryMessage = () => {
    if (shipStatus === "Bad Environment" && blackoutLevel === "Critical") {
      return "Kapal mengalami lingkungan buruk dan potensi blackout sangat tinggi. Segera lakukan pengecekan sistem kelistrikan dan pendingin.";
    }
    if (shipStatus === "Bad Environment" && blackoutLevel === "Warning") {
      return "Kapal dalam lingkungan kurang stabil. Pantau generator dan suhu pendingin secara berkala.";
    }
    if (shipStatus === "High Load" && blackoutLevel === "Warning") {
      return "Beban tinggi terdeteksi. Risiko blackout meningkat, pertimbangkan menurunkan beban sementara.";
    }
    if (shipStatus === "Stable" && blackoutLevel === "Normal") {
      return "Semua sistem beroperasi normal. Tidak ada risiko blackout yang terdeteksi.";
    }
    if (shipStatus === "Startup") {
      return "Sistem sedang dalam tahap startup. Pastikan semua generator siap beroperasi stabil.";
    }
    return "Sistem beroperasi dalam kondisi aman, pantau terus parameter mesin untuk menjaga stabilitas.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-600" />
          <p className="text-emerald-600 font-semibold">Status Kapal</p>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 🔹 Kotak status kapal + waktu pembaruan */}
        <div className="rounded-lg border p-4 bg-card/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shipStatus === "Bad Environment" ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : shipStatus === "High Load" ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            )}

            <span
              className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                shipStatus === "Bad Environment"
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                  : shipStatus === "High Load"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
                  : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
              )}
            >
              {shipStatus}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Pembaruan: {new Date(Date.now()).toLocaleTimeString("id-ID")}
          </div>
        </div>

        {/* Komponen prediksi blackout tetap */}
        <BlackoutPrediction prediction={data?.prediction} />

        {/* 🔹 Kotak bawah sekarang jadi notifikasi aktif */}
        <div
          className={cn(
            "rounded-lg p-4 border",
            blackoutLevel === "Critical"
              ? "bg-red-50/70 border-red-300"
              : blackoutLevel === "Warning"
              ? "bg-yellow-50/70 border-yellow-300"
              : "bg-emerald-50/70 border-emerald-300"
          )}
        >
          <div className="flex items-start gap-3">
            {blackoutLevel === "Critical" ? (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            ) : blackoutLevel === "Warning" ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
            )}

            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                Ringkasan Sistem — {shipStatus}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getSummaryMessage()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
