"use client"

import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    // ensure server is initialized (hit the API route once)
    fetch("/api/socket").catch(() => {})
    socket = io(undefined, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 1000,
    })
  }
  return socket
}


