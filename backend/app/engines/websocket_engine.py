import asyncio
import json
import time
import websockets
from app.engines.base_engine import BaseEngine

class WebSocketEngine(BaseEngine):
    async def _worker_loop(self, worker_id: int, ws_url: str, base_rate_per_worker: float):
        while self._is_running and not self._stop_event.is_set():
            if self._is_paused:
                await asyncio.sleep(0.1)
                continue

            multiplier = self.collector.get_current_workload_multiplier()
            effective_rate = max(0.1, base_rate_per_worker * multiplier)
            interval = 1.0 / effective_rate

            conn_start = time.time()
            ws = None
            try:
                # Measure handshake latency
                async with websockets.connect(ws_url, open_timeout=4.0, close_timeout=2.0) as websocket:
                    ws = websocket
                    handshake_ms = (time.time() - conn_start) * 1000.0
                    self.collector.record_connection_change(1, True)
                    self.collector.record_request_generated(1, 128)
                    self.collector.record_request_result(handshake_ms, True, 128)

                    seq = 0
                    while self._is_running and not self._stop_event.is_set():
                        if self._is_paused:
                            await asyncio.sleep(0.1)
                            continue

                        seq += 1
                        t_send = time.time()
                        msg_payload = json.dumps({
                            "type": "LOBBY_PING",
                            "worker_id": worker_id,
                            "seq": seq,
                            "timestamp": t_send
                        })

                        self.collector.record_request_generated(1, len(msg_payload))
                        await ws.send(msg_payload)

                        try:
                            reply = await asyncio.wait_for(ws.recv(), timeout=2.0)
                            latency_ms = (time.time() - t_send) * 1000.0
                            bytes_trans = len(msg_payload) + len(reply)
                            self.collector.record_request_result(latency_ms, True, bytes_trans)
                        except asyncio.TimeoutError:
                            self.collector.record_request_result(2000.0, False, len(msg_payload))

                        sleep_dur = max(0.005, interval - (time.time() - t_send))
                        await asyncio.sleep(sleep_dur)

            except Exception:
                latency_ms = (time.time() - conn_start) * 1000.0
                self.collector.record_connection_change(0, False)
                self.collector.record_request_result(latency_ms, False, 0)
                await asyncio.sleep(1.0)
            finally:
                if ws:
                    self.collector.record_connection_change(-1)

    async def run(self):
        self._is_running = True
        path = self.req.ws_path or "/"
        if not path.startswith("/"):
            path = "/" + path
        ws_url = f"ws://{self.req.host}:{self.req.port}{path}"

        conns = max(1, min(self.max_conns, 150))
        rate_per_worker = self.target_rate / conns

        for i in range(conns):
            t = asyncio.create_task(self._worker_loop(i, ws_url, rate_per_worker))
            self._tasks.append(t)

        try:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        except asyncio.CancelledError:
            pass
        finally:
            self._is_running = False
