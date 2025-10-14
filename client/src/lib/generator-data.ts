export type RawSnapshot = {
  timestamp: string
  main_features: {
    generator_1: Gen | null
    generator_2: Gen | null
    generator_3: Gen | null
    generator_4: Gen | null
  }
}
type Gen = {
  load_kw: number
  frequency_hz: number
  lube_oil_pressure_bar: number
  coolant_temperature_celsius: number
  exhaust_gas_temperature_celsius: number
  vibration_level_mm_s: number
}

const snapshotFromBrief: RawSnapshot = {
  timestamp: "2025-09-15T21:30:00Z",
  main_features: {
    generator_1: {
      load_kw: 2150.5,
      frequency_hz: 59.95,
      lube_oil_pressure_bar: 5.4,
      coolant_temperature_celsius: 85.5,
      exhaust_gas_temperature_celsius: 430.0,
      vibration_level_mm_s: 3.5,
    },
    generator_2: {
      load_kw: 2220.0,
      frequency_hz: 59.94,
      lube_oil_pressure_bar: 5.3,
      coolant_temperature_celsius: 85.1,
      exhaust_gas_temperature_celsius: 435.5,
      vibration_level_mm_s: 3.8,
    },
    generator_3: {
      load_kw: 2180.0,
      frequency_hz: 59.96,
      lube_oil_pressure_bar: 5.5,
      coolant_temperature_celsius: 85.3,
      exhaust_gas_temperature_celsius: 432.0,
      vibration_level_mm_s: 3.6,
    },
    generator_4: null,
  },
}

// deterministic noise for slight variation
function jitter(seed: number, scale: number) {
  const x = Math.sin(seed) * 10000
  return (x - Math.floor(x)) * scale * (Math.sin(seed * 1.3) > 0 ? 1 : -1)
}

export function buildOneHourSeries(base: number): { t: string; v: number }[] {
  const now = new Date()
  const pts: { t: string; v: number }[] = []
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60_000)
    const label = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
    const v = Math.max(0, base + jitter(d.getMinutes() + d.getHours(), 18))
    pts.push({ t: label, v: Number(v.toFixed(1)) })
  }
  return pts
}

export function getGeneratorSnapshots() {
  const m = snapshotFromBrief.main_features

  const toCard = (idx: number, g: Gen | null) => {
    const name = `Generator ${idx}`
    if (!g) {
      return {
        snapshot: { name, online: false as const },
        history: { loadKw: [] as { t: string; v: number }[] },
      }
    }
    return {
      snapshot: {
        name,
        online: true as const,
        load_kw: g.load_kw,
        frequency_hz: g.frequency_hz,
        lube_oil_pressure_bar: g.lube_oil_pressure_bar,
        coolant_temperature_celsius: g.coolant_temperature_celsius,
        exhaust_gas_temperature_celsius: g.exhaust_gas_temperature_celsius,
        vibration_level_mm_s: g.vibration_level_mm_s,
      },
      history: {
        loadKw: buildOneHourSeries(g.load_kw),
      },
    }
  }

  return [toCard(1, m.generator_1), toCard(2, m.generator_2), toCard(3, m.generator_3), toCard(4, m.generator_4)]
}


