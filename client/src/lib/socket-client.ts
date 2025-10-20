"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io("http://localhost:8000", {
            transports: ["websocket", "polling"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Number.POSITIVE_INFINITY,
            reconnectionDelay: 1000,
        });
    }
    return socket;
}
