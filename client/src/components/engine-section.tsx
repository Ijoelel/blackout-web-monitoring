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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-emerald-600" />
                    <p className="text-emerald-600">
                                        Status Kapal
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {data?.data.mode === "startup"
                                            ? "Startup"
                                            : data?.data.mode === "stable"
                                            ? "Stable"
                                            : data?.data.mode === "high_load"
                                            ? "High Load"
                                            : "Bad Environment"}
                                    </p>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Operasional */}
                <div className="rounded-lg border p-4 bg-card/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SIcon
                            className={cn(
                                "h-5 w-5",
                                status === "critical"
                                    ? "text-red-600"
                                    : status === "warning"
                                    ? "text-yellow-600"
                                    : "text-emerald-600"
                            )}
                        />
                        <span
                            className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                sStyle.cls
                            )}
                        >
                            {sStyle.text}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Pembaruan:{" "}
                        {new Date(Date.now()).toLocaleTimeString("id-ID")}
                    </div>
                </div>

                {/* ⬇️ Prediksi Blackout disatukan di dalam layout */}
                <BlackoutPrediction prediction={data?.prediction} />

                {/* Status Operasional */}
                <div
                    className={cn(
                        "rounded-lg p-4",
                        isNormal
                            ? "bg-emerald-50/60 border border-emerald-200"
                            : "bg-amber-50/60 border border-amber-200"
                    )}
                >
                    <div className="flex items-start gap-3">
                        {isNormal ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <h3 className="font-semibold mb-1">
                                {isNormal
                                    ? "Status Operasional"
                                    : "Perhatian Operasional"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {isNormal
                                    ? "Sistem beroperasi normal berdasarkan data kecepatan dan konsumsi bahan bakar."
                                    : "Beberapa indikator di luar kisaran ideal. Pantau kecepatan dan konsumsi BBM."}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
