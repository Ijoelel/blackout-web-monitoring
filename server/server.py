import time
import numpy as np
import torch
import socketio
import asyncio
from fastapi import FastAPI
import uvicorn

from lib.pred import LSTMPredictor, features
from lib.generator import generate_normal_data, maybe_anomaly

# --- Socket.IO server (ASGI mode) ---
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)
app = FastAPI()
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)

# --- LSTM Model ---
model = LSTMPredictor(len(features), 64, 2, 1)
model.load_state_dict(torch.load("lstm_model.pth", map_location="cpu"))
model.eval()

window_size = 20
window = []

# --- Socket.IO events ---
@sio.event
async def connect(sid, environ):
    print("Client connected:", sid)

@sio.event
async def disconnect(sid):
    print("Client disconnected:", sid)

# --- Background task: simulation loop ---
async def simulation_loop():
    print("🚢 Realtime simulation running...")
    t = 0
    while True:
        datapoint = generate_normal_data(t)
        datapoint = maybe_anomaly(datapoint)
        print(datapoint)
        window.append(datapoint)
        if len(window) > window_size:
            window.pop(0)

        if len(window) == window_size:
            x = torch.tensor([np.array(window, dtype=np.float32)], dtype=torch.float32)
            with torch.no_grad():
                y = model(x)
            pred = y.item()
            if pred > 0.4:
                print("BLACKOUT!!!!!!!!!!!!!!")

        # ✅ Broadcast to all connected clients
        await sio.emit("test", datapoint)

        t += 1
        await asyncio.sleep(1)

@app.on_event("startup")
async def start_background_task():
    asyncio.create_task(simulation_loop())

if __name__ == "__main__":
    uvicorn.run(asgi_app, host="0.0.0.0", port=3000)
