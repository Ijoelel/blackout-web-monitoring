export type Status = "ok" | "warn" | "crit"

export function pickStatus(
  value: number,
  {
    warnAbove,
    critAbove,
    warnBelow,
    critBelow,
  }: { warnAbove?: number; critAbove?: number; warnBelow?: number; critBelow?: number },
): Status {
  // Upper bound checks take precedence if provided
  if (typeof critAbove === "number" && value >= critAbove) return "crit"
  if (typeof warnAbove === "number" && value >= warnAbove) return "warn"
  // Lower bound checks
  if (typeof critBelow === "number" && value <= critBelow) return "crit"
  if (typeof warnBelow === "number" && value <= warnBelow) return "warn"
  return "ok"
}

export function statusClasses(status: Status): {
  bg: string
  text: string
  ring: string
  stroke: string
  badge: string
} {
  switch (status) {
    case "crit":
      return {
        bg: "bg-[--color-destructive]",
        text: "text-[--color-destructive-foreground]",
        ring: "ring-[--color-destructive]",
        stroke: "stroke-[--color-destructive]",
        badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100",
      }
    case "warn":
      // Use chart-5 (orange) as the warning token
      return {
        bg: "bg-[--color-chart-5]",
        text: "text-[--color-background]",
        ring: "ring-[--color-chart-5]",
        stroke: "stroke-[--color-chart-5]",
        badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
      }
    default:
      return {
        bg: "bg-[--color-secondary]",
        text: "text-[--color-secondary-foreground]",
        ring: "ring-[--color-secondary]",
        stroke: "stroke-[--color-secondary]",
        badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
      }
  }
}

export function statusLabel(status: Status): string {
  switch (status) {
    case "crit":
      return "Tinggi"
    case "warn":
      return "Perhatian"
    default:
      return "Normal"
  }
}
