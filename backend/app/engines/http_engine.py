import asyncio
import time
import aiohttp
from urllib.parse import urlparse
from app.engines.base_engine import BaseEngine
from app.models import ProtocolEnum

class HTTPEngine(BaseEngine):
    """
    High-Performance HTTP / HTTPS Website Load Testing Engine.
    Simulates realistic website and API traffic:
    - Homepage visits, page navigation, search queries, POST submissions
    - Configurable request headers, POST payloads, redirects, keep-alive, and timeouts
    - Measures status codes, response sizes, latencies, and TLS/connection handshakes
    """

    def _resolve_target_url(self) -> str:
        # Check if full target_url was provided
        raw = (self.req.target_url or "").strip()
        if not raw:
            raw = self.req.host.strip()

        if raw.startswith("http://") or raw.startswith("https://"):
            parsed = urlparse(raw)
            scheme = parsed.scheme
            host = parsed.hostname or "127.0.0.1"
            port = parsed.port or (443 if scheme == "https" else 80)
            path = parsed.path or "/"
            query = parsed.query or ""
        else:
            scheme = "https" if self.req.protocol in (ProtocolEnum.HTTPS,) else "http"
            path = (self.req.http_path or "/").strip()
            if not path.startswith("/"):
                path = "/" + path
            host = self.req.host
            port = self.req.port
            query = ""

        # Merge additional query parameters if provided
        if getattr(self.req, "http_query_params", None):
            from urllib.parse import urlencode, parse_qsl
            existing_pairs = parse_qsl(query, keep_blank_values=True) if query else []
            new_dict = dict(existing_pairs)
            new_dict.update(self.req.http_query_params)
            query = urlencode(new_dict)

        full_path = f"{path}?{query}" if query else path
        return f"{scheme}://{host}:{port}{full_path}"

    async def _worker_loop(
        self,
        session: aiohttp.ClientSession,
        base_rate_per_worker: float,
        url: str,
        method: str,
        headers: dict,
        payload: bytes,
        allow_redirects: bool
    ):
        while self._is_running and not self._stop_event.is_set():
            if self._is_paused:
                await asyncio.sleep(0.1)
                continue

            multiplier = self.collector.get_current_workload_multiplier()
            effective_rate = max(0.1, base_rate_per_worker * multiplier)
            interval = 1.0 / effective_rate

            t_start = time.perf_counter()
            outbound_bytes = len(payload) + sum(len(k) + len(v) + 4 for k, v in headers.items()) + len(url) + 16
            self.collector.record_request_generated(1, outbound_bytes)

            try:
                if method == "POST":
                    async with session.post(
                        url,
                        data=payload,
                        headers=headers,
                        allow_redirects=allow_redirects
                    ) as resp:
                        body = await resp.read()
                        latency_ms = (time.perf_counter() - t_start) * 1000.0
                        total_bytes = len(body) + sum(len(k) + len(v) + 4 for k, v in resp.headers.items())
                        is_success = (200 <= resp.status < 400)
                        self.collector.record_request_result(latency_ms, is_success, total_bytes, resp.status)
                elif method == "PUT":
                    async with session.put(
                        url,
                        data=payload,
                        headers=headers,
                        allow_redirects=allow_redirects
                    ) as resp:
                        body = await resp.read()
                        latency_ms = (time.perf_counter() - t_start) * 1000.0
                        total_bytes = len(body) + sum(len(k) + len(v) + 4 for k, v in resp.headers.items())
                        is_success = (200 <= resp.status < 400)
                        self.collector.record_request_result(latency_ms, is_success, total_bytes, resp.status)
                elif method == "HEAD":
                    async with session.head(
                        url,
                        headers=headers,
                        allow_redirects=allow_redirects
                    ) as resp:
                        latency_ms = (time.perf_counter() - t_start) * 1000.0
                        total_bytes = sum(len(k) + len(v) + 4 for k, v in resp.headers.items())
                        is_success = (200 <= resp.status < 400)
                        self.collector.record_request_result(latency_ms, is_success, total_bytes, resp.status)
                else: # Default GET
                    async with session.get(
                        url,
                        headers=headers,
                        allow_redirects=allow_redirects
                    ) as resp:
                        body = await resp.read()
                        latency_ms = (time.perf_counter() - t_start) * 1000.0
                        total_bytes = len(body) + sum(len(k) + len(v) + 4 for k, v in resp.headers.items())
                        is_success = (200 <= resp.status < 400)
                        self.collector.record_request_result(latency_ms, is_success, total_bytes, resp.status)

            except asyncio.TimeoutError:
                latency_ms = (time.perf_counter() - t_start) * 1000.0
                self.collector.record_request_result(latency_ms, False, 0, 504)
            except (aiohttp.ClientConnectorError, aiohttp.ServerDisconnectedError):
                latency_ms = (time.perf_counter() - t_start) * 1000.0
                self.collector.record_connection_error()
                self.collector.record_request_result(latency_ms, False, 0, 502)
            except aiohttp.ClientResponseError as ce:
                latency_ms = (time.perf_counter() - t_start) * 1000.0
                self.collector.record_request_result(latency_ms, False, 0, ce.status or 500)
            except Exception:
                latency_ms = (time.perf_counter() - t_start) * 1000.0
                self.collector.record_request_result(latency_ms, False, 0, 500)

            elapsed = time.perf_counter() - t_start
            remaining = interval - elapsed
            if remaining > 0.002:
                await asyncio.sleep(remaining)
            else:
                # Cooperatively yield control without triggering Windows 15.6ms sleep timer quantum
                await asyncio.sleep(0)

    async def run(self):
        self._is_running = True
        url = self._resolve_target_url()
        method = (self.req.http_method or "GET").upper()
        
        # Prepare headers
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Antigravity-Resilience/2.5",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        if self.req.http_headers:
            headers.update(self.req.http_headers)

        # Prepare payload for POST/PUT/PATCH
        payload_bytes = b""
        body_type = getattr(self.req, "http_body_type", "json") or "json"
        
        if self.req.http_payload and self.req.http_payload.strip():
            raw_payload = self.req.http_payload.strip()
            payload_bytes = raw_payload.encode("utf-8")
            if "Content-Type" not in headers:
                if body_type == "json" or raw_payload.startswith("{") or raw_payload.startswith("["):
                    headers["Content-Type"] = "application/json"
                elif body_type == "form" or ("=" in raw_payload and "\n" not in raw_payload):
                    headers["Content-Type"] = "application/x-www-form-urlencoded"
                else:
                    headers["Content-Type"] = "text/plain"
        elif method in ("POST", "PUT"):
            if body_type == "form":
                payload_bytes = b""
                if "Content-Type" not in headers:
                    headers["Content-Type"] = "application/x-www-form-urlencoded"
            else:
                payload_bytes = b"{}"
                if "Content-Type" not in headers:
                    headers["Content-Type"] = "application/json"

        if getattr(self.req, "http_content_type", None):
            headers["Content-Type"] = self.req.http_content_type

        # Concurrency & pacing configuration
        conns = self.req.http_virtual_users or max(1, min(self.max_conns, 500))
        rate_per_worker = self.target_rate / conns
        allow_redirects = True if self.req.http_follow_redirects is None else self.req.http_follow_redirects
        keep_alive = True if self.req.http_keep_alive is None else self.req.http_keep_alive
        timeout_sec = self.req.http_timeout_sec or 5.0

        connector = aiohttp.TCPConnector(
            limit=conns + 200,
            limit_per_host=conns + 200,
            enable_cleanup_closed=True,
            force_close=not keep_alive, # If keep_alive is False, force_close closes socket after request
            ttl_dns_cache=300
        )
        timeout = aiohttp.ClientTimeout(total=timeout_sec, connect=min(3.0, timeout_sec))

        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            self.collector.record_connection_change(conns, True)
            for _ in range(conns):
                t = asyncio.create_task(
                    self._worker_loop(
                        session=session,
                        base_rate_per_worker=rate_per_worker,
                        url=url,
                        method=method,
                        headers=headers,
                        payload=payload_bytes,
                        allow_redirects=allow_redirects
                    )
                )
                self._tasks.append(t)

            try:
                await asyncio.gather(*self._tasks, return_exceptions=True)
            except asyncio.CancelledError:
                pass
            finally:
                self.collector.record_connection_change(-conns)
                self._is_running = False
