"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts"
import { cn } from "@/lib/utils"
import { pickStatus, statusClasses } from "@/lib/status"

type Point = { t: number; v: number }

type Props = {
  title: string
  unit?: string
  data: Point[]
  warnAbove?: number
  critAbove?: number
  warnBelow?: number
  critBelow?: number
  yDomain?: [number, number]
}

export default function HistoryChart({
  title,
  unit,
  data,
  warnAbove,
  critAbove,
  warnBelow,
  critBelow,
  yDomain,
}: Props) {
  const latest = data?.[data.length - 1]?.v ?? 0
  const status = pickStatus(latest, { warnAbove, critAbove, warnBelow, critBelow })
  const cls = statusClasses(status)

  const lineColor =
    status === "crit" ? "hsl(var(--destructive))" : status === "warn" ? "hsl(var(--chart-5))" : "hsl(var(--primary))"

  const gradientId = `gradient-${title.replace(/\s+/g, "-")}`

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className={cn("py-2 px-3 rounded-t-md", cls.bg)}>
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-3 pb-2">
        <ChartContainer
          className="h-[160px] w-full"
          config={{
            v: {
              label: unit ? `${title} (${unit})` : title,
              color: "hsl(var(--primary))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="t"
                minTickGap={24}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                tickFormatter={(ts) =>
                  new Date(ts as number).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <YAxis
                width={42}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                domain={yDomain as any}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={lineColor}
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: lineColor }}
                isAnimationActive={true}
                animationDuration={500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export { HistoryChart }


