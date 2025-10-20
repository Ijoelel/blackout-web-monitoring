export type HistoryPoint = { t: number; v: number };

export function toLogs(data: HistoryPoint[], unit: string, take = 6): string[] {
    // latest first
    const latest = [...data].slice(-take).reverse();
    return latest.map((p) => `${fmtTime(p.t)} — ${fmtNumber(p.v)} ${unit}`);
}

export function fmtTime(ts: number): string {
    const d = new Date(ts);
    // HH:mm local time
    return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
}
export function fmtNumber(n: number): string {
    // compact but readable
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
function clamp(n: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, n));
}
function randN() {
    // basic normal-like noise
    return (Math.random() + Math.random() - 1) * 0.8;
}