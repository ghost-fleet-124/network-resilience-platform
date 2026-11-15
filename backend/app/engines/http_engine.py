import asyncio
import time
import aiohttp
from app.engines.base_engine import BaseEngine
from app.models import ProtocolEnum

class HTTPEngine(BaseEngine):
    async def _worker_loop(self, session: aiohttp.ClientSession, base_rate_per_worker: float, url: str):
        method = (self.req.http_method or "GET").upper()
        payload = self.req.http_payload

        while self._is_running and not self._stop_event.is_set():
            if self._is_paused:
                await asyncio.sleep(0.1)
                continue

            # Modulate according to workload curve
            multiplier = self.collector.get_current_workload_multiplier()
            effective_worker_rate = max(0.1, base_rate_per_worker * multiplier)
            interval = 1.0 / effective_worker_rate

            t_start = time.time()
            self.collector.record_request_generated(1, len(payload or "") + 64)

            try:
                headers = {"User-Agent": "Antigravity-Resilience-Tester/2.0"}
                if method == "POST":
                    async with session.post(url, data=payload or "{}", headers=headers) as resp:
                        body = await resp.read()
                        latency_ms = (time.time() - t_start) * 1000.0
                        total_bytes = len(body) + len(str(resp.headers))
                        is_success = (200 <= resp.status < 400)
                        self.collector.record_request_result(latency_ms, is_success, total_bytes, resp.status)
                else:
                    async with session.get(url, headers=headers) as resp:
                        body = await resp.read()
                        latency_ms = (time.time() - t_start) * 1000.0
                        total_bytes = len(body) + len(str(resp.headers))
                        is_success = (200 <= resp.status < 400)
                        self.collector.record_request_result(latency_ms, is_success, total_bytes, resp.status)

            except asyncio.TimeoutError:
                latency_ms = (time.time() - t_start) * 1000.0
                self.collector.record_request_result(latency_ms, False, 0, 504)
            except aiohttp.ClientConnectorError:
                latency_ms = (time.time() - t_start) * 1000.0
                self.collector.record_request_result(latency_ms, False, 0, 502)
            except Exception:
                latency_ms = (time.time() - t_start) * 1000.0
                self.collector.record_request_result(latency_ms, False, 0, 500)

            elapsed = time.time() - t_start
            sleep_time = max(0.001, interval - elapsed)
            await asyncio.sleep(sleep_time)

    async def run(self):
        self._is_running = True
        scheme = "https" if self.req.protocol == ProtocolEnum.HTTPS else "http"
        path = self.req.http_path or "/"
        if not path.startswith("/"):
            path = "/" + path
        url = f"{scheme}://{self.req.host}:{self.req.port}{path}"

        conns = max(1, min(self.max_conns, 500))
        rate_per_worker = self.target_rate / conns

        connector = aiohttp.TCPConnector(
            limit=conns + 100,
            limit_per_host=conns + 100,
            enable_cleanup_closed=True,
            force_close=False
        )
        timeout = aiohttp.ClientTimeout(total=5.0, connect=3.0)

        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            self.collector.record_connection_change(conns, True)
            for i in range(conns):
                t = asyncio.create_task(self._worker_loop(session, rate_per_worker, url))
                self._tasks.append(t)

            try:
                await asyncio.gather(*self._tasks, return_exceptions=True)
            except asyncio.CancelledError:
                pass
            finally:
                self.collector.record_connection_change(-conns)
                self._is_running = False
