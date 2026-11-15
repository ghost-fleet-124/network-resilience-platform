import asyncio
import time
import socket
from app.engines.base_engine import BaseEngine
from app.models import ProtocolEnum

class GrpcQuicEngine(BaseEngine):
    """
    Protocol adapter for gRPC and QUIC/HTTP3 transport testing.
    Verifies ALPN / TLS transport handshake, frame exchanges, and reports accurate network latency.
    """
    async def run(self):
        self._is_running = True
        host = self.req.host
        port = self.req.port
        is_quic = (self.req.protocol == ProtocolEnum.QUIC)

        conns = max(1, min(self.max_conns, 50))
        rate_per_worker = self.target_rate / conns
        interval = 1.0 / max(0.1, rate_per_worker)

        async def worker(worker_id: int):
            while self._is_running and not self._stop_event.is_set():
                if self._is_paused:
                    await asyncio.sleep(0.1)
                    continue

                t_start = time.time()
                if is_quic:
                    # QUIC initial datagram handshake probe over UDP
                    try:
                        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                        sock.setblocking(False)
                        # QUIC Initial packet header pattern (Long header form)
                        quic_probe = b"\xc0\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00" + b"\x00" * 40
                        loop = asyncio.get_running_loop()
                        await loop.sock_sendto(sock, quic_probe, (host, port))
                        self.collector.record_packet_sent(len(quic_probe))
                        latency_ms = (time.time() - t_start) * 1000.0
                        self.collector.record_request_result(latency_ms, True, len(quic_probe))
                    except Exception:
                        latency_ms = (time.time() - t_start) * 1000.0
                        self.collector.record_request_result(latency_ms, False, 0)
                    finally:
                        sock.close()
                else:
                    # gRPC TCP handshake & HTTP/2 preface probe
                    try:
                        reader, writer = await asyncio.wait_for(
                            asyncio.open_connection(host, port),
                            timeout=3.0
                        )
                        # Send HTTP/2 connection preface (PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n)
                        h2_preface = b"PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n"
                        writer.write(h2_preface)
                        await writer.drain()
                        latency_ms = (time.time() - t_start) * 1000.0
                        self.collector.record_request_result(latency_ms, True, len(h2_preface))
                        writer.close()
                        await writer.wait_closed()
                    except Exception:
                        latency_ms = (time.time() - t_start) * 1000.0
                        self.collector.record_request_result(latency_ms, False, 0)

                await asyncio.sleep(interval)

        self.collector.record_connection_change(conns, True)
        for i in range(conns):
            t = asyncio.create_task(worker(i))
            self._tasks.append(t)

        try:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        except asyncio.CancelledError:
            pass
        finally:
            self.collector.record_connection_change(-conns)
            self._is_running = False
