"use client";

import { pickStatus, statusClasses, type Status } from "@/lib/status";
import { cn } from "@/lib/utils";

type Props = {
    value: number;
    min?: number;
    max: number;
    warnAbove?: number;
    critAbove?: number;
    warnBelow?: number;
    critBelow?: number;
    label?: string;
    unit?: string;
    className?: string;
};

export default function ProgressMeter({
    value,
    min = 0,
    max,
    warnAbove,
    critAbove,
    warnBelow,
    critBelow,
    label,
    unit,
    className,
}: Props) {
    const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    const status: Status = pickStatus(value, {
        warnAbove,
        critAbove,
        warnBelow,
        critBelow,
    });
    const cls = statusClasses(status);

    return (
        <div className={cn("w-full", className)}>
            {label ? (
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-(--color-muted-foreground)">
                        {label}
                    </span>
                    <span className="font-medium">
                        {value.toFixed(1)} {unit}
                    </span>
                </div>
            ) : null}
            <div className="h-2 w-full rounded-full bg-(--color-muted) ring-1 ring-inset ring-(--color-border)">
                <div
                    className={cn(
                        "h-2 rounded-full transition-[width] duration-300 color-black",
                        cls.bg
                    )}
                    style={{ width: `${pct}%` }}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    role="progressbar"
                />
            </div>
        </div>
    );
}
