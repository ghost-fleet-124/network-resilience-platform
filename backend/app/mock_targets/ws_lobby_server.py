import asyncio
import json
import time
import websockets

async def handle_ws_lobby(websocket):
    try:
        # Send initial lobby state
        await websocket.send(json.dumps({
            "event": "LOBBY_STATE",
            "room_id": "tournament_finals_match_1",
            "max_slots": 100,
            "connected_players": 42
        }))

        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type", "")
                if msg_type == "LOBBY_PING":
                    await websocket.send(json.dumps({
                        "type": "LOBBY_PONG",
                        "worker_id": data.get("worker_id"),
                        "seq": data.get("seq"),
                        "client_ts": data.get("timestamp"),
                        "server_ts": time.time()
                    }))
                else:
                    await websocket.send(json.dumps({"type": "ACK", "echo": data}))
            except Exception:
                await websocket.send(json.dumps({"type": "RAW_ECHO", "content": message}))
    except websockets.exceptions.ConnectionClosed:
        pass

async def start_mock_ws(port: int = 9004):
    server = await websockets.serve(handle_ws_lobby, "0.0.0.0", port, reuse_address=True)
    return server
