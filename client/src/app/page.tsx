"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Ship, CheckCircle, TrendingUp, Battery } from "lucide-react";
import EngineSection from "@/components/engine-section";
import GeneratorsSection from "@/components/generators-section";
import ElectricalSection from "@/components/electrical-section";
import EnvironmentSection from "@/components/environment-section";
import socket from "@/lib/socket";

export default function ShipMonitoringDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [data, setData] = useState(null);

    useEffect(() => {
        socket.on("connect", () => {
            console.log("connected");
            console.log(socket.id);
        });

        socket.on("telemetry", (data) => {
            console.log("telemetry", data);
            setData(data);
        });

        socket.on("disconnect", () => {
            console.log("disconnected");
        });
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-border shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Ship className="h-8 w-8 text-primary" />
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">
                                        KM Arthawijaya Explorer
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Blackout Monitoring System
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-sm font-medium text-foreground">
                                    {currentTime.toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                                {/* <p className="text-lg font-mono font-bold text-primary">{currentTime.toLocaleTimeString("id-ID")}</p> */}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Dashboard */}
            <main className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Quick Status Cards */}
                    <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100">
                                        Status Kapal
                                    </p>
                                    <p className="text-2xl font-bold">
                                        Operasional
                                    </p>
                                </div>
                                <CheckCircle className="h-12 w-12 text-emerald-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100">Kecepatan</p>
                                    <p className="text-2xl font-bold">
                                        18.5 knots
                                    </p>
                                </div>
                                <TrendingUp className="h-12 w-12 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100">
                                        Konsumsi Bahan Bakar
                                    </p>
                                    <p className="text-2xl font-bold">
                                        245 L/h
                                    </p>
                                </div>
                                <Battery className="h-12 w-12 text-orange-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6">
                    <EngineSection />
                </div>

                <div className="mb-6">
                    <GeneratorsSection />
                </div>

                <div className="mb-6">
                    <ElectricalSection />
                </div>

                <EnvironmentSection />
            </main>
        </div>
    );
}
