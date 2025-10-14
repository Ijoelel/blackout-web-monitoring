export type HistoryPoint = { t: number; v: number }


export function genHistory({
  base,
  jitter = 0.02,
  points = 60,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  now = Date.now(),
}: {
  base: number
  jitter?: number // fraction of base
  points?: number
  min?: number
  max?: number
  now?: number
}): HistoryPoint[] {
  const out: HistoryPoint[] = []
  for (let i = points - 1; i >= 0; i--) {
    const ts = now - i * 60_000
    const variance = base * jitter
    const v = clamp(base + randN() * variance, min, max)
    out.push({ t: ts, v })
  }
  return out
}


export function toLogs(data: HistoryPoint[], unit: string, take = 6): string[] {
  // latest first
  const latest = [...data].slice(-take).reverse()
  return latest.map((p) => `${fmtTime(p.t)} — ${fmtNumber(p.v)} ${unit}`)
}


export function fmtTime(ts: number): string {
  const d = new Date(ts)
  // HH:mm local time
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}


export function fmtNumber(n: number): string {
  // compact but readable
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}


function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}


function randN() {
  // basic normal-like noise
  return (Math.random() + Math.random() - 1) * 0.8
}



