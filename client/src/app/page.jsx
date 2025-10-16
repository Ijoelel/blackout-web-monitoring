"use client"


import { useState, useEffect } from "react"
import { Ship } from "lucide-react"
import EngineSection from "@/components/engine-section"
import GeneratorsSection from "@/components/generators-section"
import ElectricalSection from "@/components/electrical-section"
import EnvironmentSection from "@/components/environment-section"


export default function ShipMonitoringDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])


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
                  <h1 className="text-2xl font-bold text-foreground">KM. Arthawijaya</h1>
                  <p className="text-sm text-muted-foreground">Ship Monitoring System</p>
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
                <p className="text-lg font-mono font-bold text-primary">{currentTime.toLocaleTimeString("id-ID")}</p>
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* Main Dashboard */}
      <main className="container mx-auto px-6 py-6">
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
  )
}



