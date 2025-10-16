"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

export function StatusIndicator() {
  const systemStatus = "operational" // This could be dynamic based on actual system checks

  const getStatusConfig = (status) => {
    switch (status) {
      case "operational":
        return {
          icon: CheckCircle,
          text: "Sistem Normal",
          className: "bg-emerald-500 text-white",
          iconColor: "text-emerald-200",
        }
      case "warning":
        return {
          icon: AlertTriangle,
          text: "Perhatian",
          className: "bg-yellow-500 text-white",
          iconColor: "text-yellow-200",
        }
      case "critical":
        return {
          icon: XCircle,
          text: "Kritis",
          className: "bg-red-500 text-white",
          iconColor: "text-red-200",
        }
      default:
        return {
          icon: CheckCircle,
          text: "Normal",
          className: "bg-emerald-500 text-white",
          iconColor: "text-emerald-200",
        }
    }
  }

  const config = getStatusConfig(systemStatus)
  const Icon = config.icon

  return (
    <Badge className={`${config.className} px-4 py-2 text-sm font-medium`}>
      <Icon className={`h-4 w-4 mr-2 ${config.iconColor}`} />
      {config.text}
    </Badge>
  )
}
