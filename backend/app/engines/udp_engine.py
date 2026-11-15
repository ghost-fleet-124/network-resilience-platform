import asyncio
import socket
import struct
import time
from app.engines.base_engine import BaseEngine

class UDPReceiverProtocol(asyncio.DatagramProtocol):
    def __init__(self, collector):
        self.collector = collector
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        now = time.time()
        if len(data) >= 12:
            try:
                seq, send_ts = struct.unpack("!Id", data[:12])
                latency_ms = max(0.1, (now - send_ts) * 1000.0)
                self.collector.record_packet_received(latency_ms, len(data))
            except Exception:
                self.collector.record_packet_received(1.0, len(data))
        else:
            self.collector.record_packet_received(1.0, len(data))

    def error_received(self, exc):
        self.collector.record_packet_lost()

class UDPEngine(BaseEngine):
    async def run(self):
        self._is_running = True
        loop = asyncio.get_running_loop()

        receiver_protocol = UDPReceiverProtocol(self.collector)
        transport, _ = await loop.create_datagram_endpoint(
            lambda: receiver_protocol,
            local_addr=("0.0.0.0", 0)
        )

        target_addr = (self.req.host, self.req.port)
        packet_size = self.req.packet_size_bytes or 256
        padding_size = max(0, packet_size - 12)
        padding = b"\x00" * padding_size

        seq = 0
        self.collector.record_connection_change(1, True)

        try:
            while self._is_running and not self._stop_event.is_set():
                if self._is_paused:
                    await asyncio.sleep(0.1)
                    continue

                # Modulate target rate according to the ramp-up / sustained / ramp-down workload curve
                curve_multiplier = self.collector.get_current_workload_multiplier()
                effective_target_rate = max(10, int(self.target_rate * curve_multiplier))

                # Batch packets into 50Hz scheduling slices
                batch_size = max(1, int(effective_target_rate / 50))
                batch_start = time.time()

                for _ in range(batch_size):
                    seq += 1
                    now = time.time()
                    payload = struct.pack("!Id", seq, now) + padding
                    try:
                        transport.sendto(payload, target_addr)
                        self.collector.record_packet_sent(len(payload))
                    except Exception:
                        self.collector.record_packet_lost()

                elapsed = time.time() - batch_start
                expected_batch_time = batch_size / effective_target_rate
                sleep_time = max(0.001, expected_batch_time - elapsed)
                await asyncio.sleep(sleep_time)

        except asyncio.CancelledError:
            pass
        finally:
            self._is_running = False
            self.collector.record_connection_change(-1)
            transport.close()
