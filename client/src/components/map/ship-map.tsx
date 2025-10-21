"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { TelemetryEnvironmental } from "@/lib/type";
import {
    ACTIVE_CHECKPOINT_INDEX,
    ROUTE_CHECKPOINTS,
} from "@/components/map/route-data";

const LEAFLET_SCRIPT_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_STYLESHEET_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

const STATUS_LABELS: Record<string, string> = {
    startup: "Startup",
    stable: "Stabil",
    high_load: "Beban Tinggi",
    bad_env: "Lingkungan Buruk",
};

declare global {
    interface Window {
        L?: any;
    }
}

interface ShipMapProps {
    status?: string;
    environment?: TelemetryEnvironmental | null;
}

const numberFormatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

function formatMetric(value: number | null | undefined, unit: string) {
    if (value === null || value === undefined) {
        return "Tidak tersedia";
    }

    return `${numberFormatter.format(value)} ${unit}`;
}

function createPopupContent({
    checkpointName,
    coords,
    statusLabel,
    environment,
}: {
    checkpointName: string;
    coords: [number, number];
    statusLabel: string;
    environment?: TelemetryEnvironmental | null;
}) {
    const [lat, lng] = coords;

    const wind = formatMetric(environment?.wind_speed_knots, "knots");
    const waves = formatMetric(environment?.wave_height_meters, "m");
    const current = formatMetric(environment?.ocean_current_speed_knots, "knots");

    return `
        <div class="ship-popup-content">
            <h3>KM Arthawijaya Explorer</h3>
            <p class="ship-popup-status">Status operasi: <strong>${statusLabel}</strong></p>
            <div class="ship-popup-body">
                <span><strong>Posisi:</strong> ${checkpointName}</span>
                <span><strong>Koordinat:</strong> ${lat.toFixed(3)}°, ${lng.toFixed(3)}°</span>
                <span><strong>Kecepatan angin:</strong> ${wind}</span>
                <span><strong>Tinggi gelombang:</strong> ${waves}</span>
                <span><strong>Arus laut:</strong> ${current}</span>
            </div>
        </div>
    `;
}

export default function ShipMap({ status, environment }: ShipMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const overlayRef = useRef<any>(null);
    const hasFitBoundsRef = useRef(false);
    const [scriptReady, setScriptReady] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [scriptError, setScriptError] = useState<string | null>(null);

    const checkpoints = ROUTE_CHECKPOINTS;
    const activeIndex = Math.min(
        ACTIVE_CHECKPOINT_INDEX,
        checkpoints.length - 1
    );
    const activeCheckpoint = checkpoints[activeIndex] ?? checkpoints[0];

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const existingStylesheet = document.querySelector(
            'link[data-leaflet="true"]'
        );

        if (!existingStylesheet) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = LEAFLET_STYLESHEET_URL;
            link.setAttribute("data-leaflet", "true");
            document.head.appendChild(link);
        }
    }, []);

    useEffect(() => {
        if (
            !scriptReady ||
            typeof window === "undefined" ||
            !window.L ||
            !containerRef.current ||
            mapRef.current
        ) {
            return;
        }

        const L = window.L;
        const map = L.map(containerRef.current, {
            center: activeCheckpoint.coords,
            zoom: 6,
            zoomControl: false,
            attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kontributor',
        }).addTo(map);

        L.control
            .zoom({
                position: "topright",
            })
            .addTo(map);

        const overlay = L.layerGroup().addTo(map);

        mapRef.current = map;
        overlayRef.current = overlay;

        map.whenReady(() => {
            setMapReady(true);
            setTimeout(() => {
                map.invalidateSize();
            }, 150);
        });

        return () => {
            map.remove();
            mapRef.current = null;
            overlayRef.current = null;
            hasFitBoundsRef.current = false;
            setMapReady(false);
        };
    }, [activeCheckpoint.coords, scriptReady]);

    useEffect(() => {
        if (
            !scriptReady ||
            !mapRef.current ||
            !overlayRef.current ||
            typeof window === "undefined" ||
            !window.L
        ) {
            return;
        }

        const L = window.L;
        const overlay = overlayRef.current;
        overlay.clearLayers();

        const routeCoordinates = checkpoints.map((point) => point.coords);

        const polyline = L.polyline(routeCoordinates, {
            color: "#0ea5e9",
            weight: 4,
            opacity: 0.85,
            dashArray: "12 12",
        });
        overlay.addLayer(polyline);

        routeCoordinates.forEach((coords, index) => {
            const checkpoint = checkpoints[index];
            const isActive = index === activeIndex;

            const marker = L.circleMarker(coords, {
                radius: isActive ? 10 : 7,
                color: isActive ? "#1d4ed8" : "#22d3ee",
                weight: 2,
                fillColor: isActive ? "#1d4ed8" : "#22d3ee",
                fillOpacity: 0.9,
            });

            marker.bindTooltip(checkpoint.name, {
                direction: "top",
                offset: [0, -8],
                sticky: true,
            });

            if (isActive) {
                const statusLabel = STATUS_LABELS[status ?? ""] ?? "Informasi tidak tersedia";
                const popupHtml = createPopupContent({
                    checkpointName: checkpoint.name,
                    coords: coords,
                    statusLabel,
                    environment,
                });

                marker
                    .bindPopup(popupHtml, {
                        closeButton: false,
                        className: "ship-popup",
                        autoPan: true,
                    })
                    .openPopup();

                const coverage = L.circle(coords, {
                    radius: 25000,
                    color: "#1d4ed8",
                    weight: 1,
                    fillColor: "#60a5fa",
                    fillOpacity: 0.1,
                    dashArray: "6 8",
                });
                overlay.addLayer(coverage);
            }

            overlay.addLayer(marker);
        });

        if (!hasFitBoundsRef.current) {
            const bounds = L.latLngBounds(routeCoordinates);
            mapRef.current.fitBounds(bounds, { padding: [48, 48] });
            hasFitBoundsRef.current = true;
        }

        mapRef.current.invalidateSize();
    }, [activeIndex, checkpoints, environment, scriptReady, status]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const handleResize = () => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div className="relative h-full w-full">
            <Script
                src={LEAFLET_SCRIPT_URL}
                strategy="afterInteractive"
                onLoad={() => {
                    if (window.L) {
                        setScriptReady(true);
                        setScriptError(null);
                    }
                }}
                onError={() => setScriptError("Tidak dapat memuat library peta.")}
            />
            <div
                ref={containerRef}
                className="h-full w-full overflow-hidden rounded-2xl"
                style={{ minHeight: "320px" }}
            />
            {!mapReady && !scriptError ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 text-sm font-medium text-muted-foreground">
                    Memuat peta kapal...
                </div>
            ) : null}
            {scriptError ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white text-center text-sm font-semibold text-destructive">
                    {scriptError}
                </div>
            ) : null}
        </div>
    );
}
