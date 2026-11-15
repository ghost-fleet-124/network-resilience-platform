import asyncio
import struct
import time
from app.engines.base_engine import BaseEngine

MAGIC_GAME_HEADER = 0x47414D45 # "GAME"
PKT_HANDSHAKE = 1
PKT_PLAYER_TICK = 2
PKT_SERVER_STATE = 3

class GameProtocolClient(asyncio.DatagramProtocol):
    def __init__(self, collector):
        self.collector = collector
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        now = time.time()
        if len(data) >= 24:
            try:
                magic, pkt_type, player_id, seq, client_ts = struct.unpack("!IIIId", data[:24])
                if magic == MAGIC_GAME_HEADER:
                    latency_ms = max(0.1, (now - client_ts) * 1000.0)
                    self.collector.record_packet_received(latency_ms, len(data))
                    return
            except Exception:
                pass
        self.collector.record_packet_received(1.0, len(data))

    def error_received(self, exc):
        self.collector.record_packet_lost()

class CustomGameEngine(BaseEngine):
    async def run(self):
        self._is_running = True
        loop = asyncio.get_running_loop()

        game_client_protocol = GameProtocolClient(self.collector)
        transport, _ = await loop.create_datagram_endpoint(
            lambda: game_client_protocol,
            local_addr=("0.0.0.0", 0)
        )

        target_addr = (self.req.host, self.req.port)
        tick_hz = self.req.game_tick_hz or 60
        tick_interval = 1.0 / tick_hz

        virtual_players = max(1, min(self.max_conns, 1000))
        self.collector.record_connection_change(virtual_players, True)

        try:
            seq_counter = 0
            while self._is_running and not self._stop_event.is_set():
                if self._is_paused:
                    await asyncio.sleep(0.1)
                    continue

                tick_start = time.time()
                seq_counter += 1

                # Modulate active players based on workload curve
                curve_multiplier = self.collector.get_current_workload_multiplier()
                active_players_in_tick = max(1, int(virtual_players * curve_multiplier))

                for player_id in range(active_players_in_tick):
                    now = time.time()
                    payload = struct.pack(
                        "!IIIIdfffI",
                        MAGIC_GAME_HEADER,
                        PKT_PLAYER_TICK,
                        player_id,
                        seq_counter,
                        now,
                        100.0 + (player_id * 1.5),
                        200.0,
                        50.0,
                        1
                    )
                    try:
                        transport.sendto(payload, target_addr)
                        self.collector.record_packet_sent(len(payload))
                    except Exception:
                        self.collector.record_packet_lost()

                elapsed = time.time() - tick_start
                sleep_time = max(0.001, tick_interval - elapsed)
                await asyncio.sleep(sleep_time)

        except asyncio.CancelledError:
            pass
        finally:
            self._is_running = False
            self.collector.record_connection_change(-virtual_players)
            transport.close()
