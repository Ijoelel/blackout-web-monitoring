"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { pickStatus, statusClasses, statusLabel, type Status } from "@/lib/status"
import { cn } from "@/lib/utils"
import HistoryChart from "@/components/history-chart"
import { toLogs } from "@/lib/history"

type Props = {
  label: string
  value: number
  unit: string
  icon?: React.ReactNode
  min?: number
  max: number
  warnAbove?: number
  critAbove?: number
  warnBelow?: number
  critBelow?: number
  historyData: Array<{ time: number; value: number }>
  chartTitle: string
  yDomain?: [number, number]
}

export default function MetricCard({
  label,
  value,
  unit,
  icon,
  min = 0,
  max,
  warnAbove,
  critAbove,
  warnBelow,
  critBelow,
  historyData,
  chartTitle,
  yDomain,
}: Props) {
  const [open, setOpen] = useState(false)
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const status: Status = pickStatus(value, { warnAbove, critAbove, warnBelow, critBelow })
  const cls = statusClasses(status)
  const badge = statusLabel(status)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        {/* Metric Header */}
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {icon}
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium px-2 py-1 rounded", cls.badge)}>{badge}</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <div className="mb-3">
          <div className="h-4 w-full rounded-full bg-muted/50 ring-1 ring-inset ring-border/50 overflow-hidden shadow-inner">
            <div
              className={cn(
                "h-4 rounded-full transition-all duration-700 ease-in-out",
                cls.bg,
                // Add glow effect based on status
                status === "normal" && "shadow-[0_0_8px_rgba(34,197,94,0.6)]",
                status === "warn" && "shadow-[0_0_8px_rgba(234,179,8,0.6)]",
                status === "crit" && "shadow-[0_0_8px_rgba(239,68,68,0.6)]",
              )}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={value}
            />
          </div>
        </div>

        {/* Value Display */}
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {value.toFixed(1)} {unit}
          </span>
        </div>

        {/* Collapsible History Section */}
        <CollapsibleContent>
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="rounded-md overflow-hidden">
              <HistoryChart
                title={chartTitle}
                unit={unit}
                data={historyData}
                warnAbove={warnAbove}
                critAbove={critAbove}
                warnBelow={warnBelow}
                critBelow={critBelow}
                yDomain={yDomain}
              />
            </div>

            {/* Logs */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Log</h4>
              <div className="bg-muted/30 rounded-md p-3">
                <ul className="text-xs space-y-1 font-mono">
                  {toLogs(historyData, unit, 5).map((log, i) => (
                    <li key={i} className="text-muted-foreground">
                      {log}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
