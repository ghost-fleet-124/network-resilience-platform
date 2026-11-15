import asyncio
import json
from typing import Set, Dict
from fastapi import WebSocket
from app.models import MetricSnapshot

class WebSocketHub:
    def __init__(self):
        # Active connections mapped by test_id or global channel
        self._active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._active_connections.add(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self._active_connections.discard(websocket)

    async def broadcast_metric_snapshot(self, snapshot: MetricSnapshot):
        if not self._active_connections:
            return
        
        payload = snapshot.model_dump_json()
        dead_connections = set()
        
        async with self._lock:
            for ws in self._active_connections:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_connections.add(ws)
            for ws in dead_connections:
                self._active_connections.discard(ws)

    async def broadcast_event(self, event_type: str, data: Dict):
        if not self._active_connections:
            return
        payload = json.dumps({"event": event_type, "data": data})
        dead_connections = set()
        async with self._lock:
            for ws in self._active_connections:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_connections.add(ws)
            for ws in dead_connections:
                self._active_connections.discard(ws)

websocket_hub = WebSocketHub()
