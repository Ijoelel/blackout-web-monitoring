"use client";

import AppShell from "@/components/layout/app-shell";
import EngineSection from "@/components/engine-section";
import GeneratorsSection from "@/components/generators-section";
import ElectricalSection from "@/components/electrical-section";
import EnvironmentSection from "@/components/environment-section";
import BlackoutPrediction from "@/components/blackout-prediction";
import { Card, CardContent } from "@/components/ui/card";
import { useSocketData } from "@/hooks/use-socket-data";
import { Battery, CheckCircle, TrendingUp } from "lucide-react";

export default function ShipMonitoringDashboard() {
    const { data } = useSocketData();

    return (
        <AppShell>
            <div className="container mx-auto px-6 py-6">
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
