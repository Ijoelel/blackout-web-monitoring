"use client"

import { useState, useEffect } from "react"

type UseLiveMetricOptions = {
  base: number
  jitter: number
  min?: number
  max?: number
  interval?: number
}

export function useLiveMetric({ base, jitter, min, max, interval = 2000 }: UseLiveMetricOptions) {
  const [value, setValue] = useState(base)

  useEffect(() => {
    const timer = setInterval(() => {
      setValue((prev) => {
        const variation = (Math.random() - 0.5) * 2 * jitter
        let newValue = prev + variation

        // Clamp to min/max if provided
        if (min !== undefined) newValue = Math.max(min, newValue)
        if (max !== undefined) newValue = Math.min(max, newValue)

        return newValue
      })
    }, interval)

    return () => clearInterval(timer)
  }, [jitter, min, max, interval])

  return value
}


