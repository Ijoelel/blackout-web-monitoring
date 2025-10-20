import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    HistoryPoint,
    TelemetryDistribution,
    TelemetryEnvironmental,
    TelemetryGeneratorReading,
} from "./type";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Ambil satu metrik dari objek flat */
export function pickMetric(
    flat:
        | TelemetryGeneratorReading
        | TelemetryDistribution
        | TelemetryEnvironmental,
    key: keyof TelemetryGeneratorReading,
    t: string
): HistoryPoint {
    const raw = flat ? flat[key] : 0;
    const v = typeof raw === "number" ? raw : 0;
    return { t: new Date(t).getTime(), v };
}

export const clone4 = <T>(arr: T[][]): T[][] => arr.map((a) => a.slice());
export const appendCapped = <T>(arr: T[], item: T, cap: number) =>
    cap > 0 && arr.length >= cap
        ? [...arr.slice(-cap + 1), item]
        : [...arr, item];

/** Versi untuk array objek flat */
// export function pickMetricList(
//     flats: Record<TelemetryGeneratorReading, any>[],
//     key: string,
//     getT?: ((item: any) => string) | string
// ): HistoryPoint[] {
//     return flats.map((item) => {
//         const t =
//             typeof getT === "function"
//                 ? getT(item)
//                 : typeof getT === "string"
//                 ? String(item[getT] ?? new Date().toISOString())
//                 : new Date().toISOString();
//         return pickMetric(item, key, t);
//     });
// }
