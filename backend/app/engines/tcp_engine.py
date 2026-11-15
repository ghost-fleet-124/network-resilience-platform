import asyncio
import time
from app.engines.base_engine import BaseEngine

class TCPEngine(BaseEngine):
    async def _worker_loop(self, worker_id: int, base_rate_per_worker: float):
        host = self.req.host
        port = self.req.port

        while self._is_running and not self._stop_event.is_set():
            if self._is_paused:
                await asyncio.sleep(0.1)
                continue

            multiplier = self.collector.get_current_workload_multiplier()
            effective_rate = max(0.1, base_rate_per_worker * multiplier)
            interval = 1.0 / effective_rate

            conn_start = time.time()
            reader = None
            writer = None
            try:
                # Measure TCP Handshake Latency
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection(host, port),
                    timeout=4.0
                )
                handshake_latency_ms = (time.time() - conn_start) * 1000.0
                self.collector.record_connection_change(1, True)
                self.collector.record_request_generated(1, 64)
                self.collector.record_request_result(handshake_latency_ms, True, 64)

                # Keep connection alive and send framed heartbeat pings
                seq = 0
                while self._is_running and not self._stop_event.is_set():
                    if self._is_paused:
                        await asyncio.sleep(0.1)
                        continue

                    seq += 1
                    t_start = time.time()
                    ping_msg = f"PING {seq} {t_start:.6f}\n".encode("utf-8")
                    
                    self.collector.record_request_generated(1, len(ping_msg))
                    writer.write(ping_msg)
                    await writer.drain()

                    try:
                        line = await asyncio.wait_for(reader.readline(), timeout=2.0)
                        latency_ms = (time.time() - t_start) * 1000.0
                        bytes_transferred = len(ping_msg) + len(line)
                        self.collector.record_request_result(latency_ms, True, bytes_transferred)
                    except (asyncio.TimeoutError, ConnectionResetError):
                        self.collector.record_request_result(2000.0, False, len(ping_msg))
                        break

                    sleep_dur = max(0.005, interval - (time.time() - t_start))
                    await asyncio.sleep(sleep_dur)

            except Exception:
                latency_ms = (time.time() - conn_start) * 1000.0
                self.collector.record_connection_change(0, False)
                self.collector.record_request_result(latency_ms, False, 0)
                await asyncio.sleep(1.0)
            finally:
                if writer:
                    try:
                        self.collector.record_connection_change(-1)
                        writer.close()
                        await writer.wait_closed()
                    except Exception:
                        pass

    async def run(self):
        self._is_running = True
        conns = max(1, min(self.max_conns, 200))
        rate_per_worker = self.target_rate / conns

        for i in range(conns):
            t = asyncio.create_task(self._worker_loop(i, rate_per_worker))
            self._tasks.append(t)

        try:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        except asyncio.CancelledError:
            pass
        finally:
            self._is_running = False
