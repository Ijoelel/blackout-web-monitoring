"use client";

import dynamic from "next/dynamic";
import AppShell from "@/components/layout/app-shell";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSocketData } from "@/hooks/use-socket-data";
import {
    ACTIVE_CHECKPOINT_INDEX,
    ROUTE_CHECKPOINTS,
    ROUTE_PROGRESS,
} from "@/components/map/route-data";
import {
    Compass,
    MapPin,
    Navigation,
    Waves,
    Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NullableNumber } from "@/lib/type";

const ShipMap = dynamic(() => import("@/components/map/ship-map"), {
    ssr: false,
});

const STATUS_LABELS: Record<string, string> = {
    startup: "Startup",
    stable: "Stabil",
    high_load: "Beban Tinggi",
    bad_env: "Lingkungan Buruk",
};

const numberFormatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

function formatMetric(value: NullableNumber, unit: string) {
    if (value === null || value === undefined) {
        return "Tidak tersedia";
    }

    return `${numberFormatter.format(value)} ${unit}`;
}

export default function MapMonitoringPage() {
    const { data } = useSocketData();
    const environment = data?.data.contextual_features.environmental;
    const systemStatus = data?.data.contextual_features.system_status;
    const mode = data?.data.mode;

    const statusLabel = STATUS_LABELS[mode ?? ""] ?? "Tidak tersedia";
    const onlineGenerators = systemStatus?.num_generators_online ?? 0;

    const destination = ROUTE_CHECKPOINTS[ROUTE_CHECKPOINTS.length - 1];
    const activeCheckpoint =
        ROUTE_CHECKPOINTS[ACTIVE_CHECKPOINT_INDEX] ?? ROUTE_CHECKPOINTS[0];

    const updatedTime = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <AppShell>
            <div className="container mx-auto px-6 py-6 space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">
                        Peta Pergerakan Kapal
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Pantau posisi kapal dan kondisi lingkungan secara visual
                        melalui peta interaktif.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    <div className="space-y-6 lg:col-span-3">
                        <Card className="h-[60vh] overflow-hidden lg:h-[70vh]">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-lg font-semibold">
                                        Posisi Kapal Terkini
                                    </CardTitle>
                                    <CardDescription>
                                        {activeCheckpoint.name} • pembaruan pukul {updatedTime} WIB
                                    </CardDescription>
                                </div>
                                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    {statusLabel}
                                </div>
                            </CardHeader>
                            <CardContent className="h-full p-0">
                                <ShipMap status={mode} environment={environment} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Checkpoint Rute
                                </CardTitle>
                                <CardDescription>
                                    Daftar titik penting pelayaran saat ini.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {ROUTE_CHECKPOINTS.map((checkpoint, index) => {
                                    const isActive = index === ACTIVE_CHECKPOINT_INDEX;
                                    return (
                                        <div
                                            key={checkpoint.name}
                                            className={cn(
                                                "flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors",
                                                isActive
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border/60 bg-white"
                                            )}
                                        >
                                            <div className="space-y-1">
                                                <p className="flex items-center gap-2 font-medium text-foreground">
                                                    {isActive ? (
                                                        <Navigation className="h-4 w-4 text-primary" />
                                                    ) : (
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    {checkpoint.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {checkpoint.description}
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {checkpoint.eta}
                                            </span>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Kemajuan Pelayaran
                                </CardTitle>
                                <CardDescription>
                                    Estimasi jarak tempuh yang telah dicapai.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-3xl font-bold text-foreground">
                                        {ROUTE_PROGRESS}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Menuju {destination.name}
                                    </p>
                                </div>
                                <Progress value={ROUTE_PROGRESS} className="h-2" />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{ROUTE_CHECKPOINTS[0].name}</span>
                                    <span>{destination.name}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Kondisi Lingkungan
                                </CardTitle>
                                <CardDescription>
                                    Data sensor real-time di sekitar kapal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Wind className="h-4 w-4 text-primary" />
                                        Kecepatan angin
                                    </div>
                                    <span className="text-base font-semibold text-foreground">
                                        {formatMetric(environment?.wind_speed_knots ?? null, "knots")}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Waves className="h-4 w-4 text-primary" />
                                        Tinggi gelombang
                                    </div>
                                    <span className="text-base font-semibold text-foreground">
                                        {formatMetric(environment?.wave_height_meters ?? null, "m")}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Compass className="h-4 w-4 text-primary" />
                                        Arus laut
                                    </div>
                                    <span className="text-base font-semibold text-foreground">
                                        {formatMetric(environment?.ocean_current_speed_knots ?? null, "knots")}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Status Sistem
                                </CardTitle>
                                <CardDescription>
                                    Ringkasan kondisi operasi pembangkit listrik kapal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Mode sistem</p>
                                    <p className="text-xl font-semibold text-foreground">
                                        {statusLabel}
                                    </p>
                                </div>
                                <div>
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Navigation className="h-4 w-4 text-primary" />
                                        Generator aktif
                                    </p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {onlineGenerators} dari 4 unit
                                    </p>
                                </div>
                                <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
                                    Data diperbarui secara otomatis melalui jaringan monitoring kapal.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
