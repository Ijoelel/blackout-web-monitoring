"use client";

import AppShell from "@/components/layout/app-shell";
import EngineSection from "@/components/engine-section";
import GeneratorsSection from "@/components/generators-section";
import ElectricalSection from "@/components/electrical-section";
import EnvironmentSection from "@/components/environment-section";
import { Card, CardContent } from "@/components/ui/card";
import { useSocketData } from "@/hooks/use-socket-data";
import { Battery, CheckCircle, TrendingUp } from "lucide-react";

export default function ShipMonitoringDashboard() {
    const { data } = useSocketData();

    return (
        <AppShell>
            <div className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 gap-6 pb-6 lg:grid-cols-3">
                    <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100">Status Kapal</p>
                                    <p className="text-2xl font-bold">
                                        {data?.data.mode === "startup"
                                            ? "Startup"
                                            : data?.data.mode === "stable"
                                            ? "Stable"
                                            : data?.data.mode === "high_load"
                                            ? "High Load"
                                            : "Bad Environment"}
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
                                    <p className="text-2xl font-bold">18.5 knots</p>
                                </div>
                                <TrendingUp className="h-12 w-12 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100">Konsumsi Bahan Bakar</p>
                                    <p className="text-2xl font-bold">245 L/h</p>
                                </div>
                                <Battery className="h-12 w-12 text-orange-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <EngineSection />
                    <GeneratorsSection />
                    <ElectricalSection />
                    <EnvironmentSection />
                </div>
            </div>
        </AppShell>
    );
}
