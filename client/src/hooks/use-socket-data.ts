"use client";

import { getSocket } from "@/lib/socket-client";
import { JsonDataFormat } from "@/lib/type";
import { useEffect, useMemo, useState } from "react";

export function useSocketData() {
    const [data, setData] = useState<JsonDataFormat>();
    const [historicalData, setHistoricalData] = useState<JsonDataFormat[]>([]);

    useEffect(() => {
        const s = getSocket();
        const onData = (jsonData: JsonDataFormat) => {
            setData(jsonData);
            setHistoricalData((prev) => [...prev, jsonData]);
        };

        s.on("telemetry", onData);

        const onServerInfo = (_msg: unknown) => {
            console.log(_msg);
        };
        s.on("server_info", onServerInfo);

        return () => {
            s.off("telemetry", onData);
            s.off("server_info", onServerInfo);
        };
    }, []);

    return useMemo(
        () => ({
            data,
            historicalData,
        }),
        [data]
    );
}
