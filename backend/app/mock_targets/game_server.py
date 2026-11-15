import asyncio
import struct
import time

MAGIC_GAME_HEADER = 0x47414D45
PKT_PLAYER_TICK = 2
PKT_SERVER_STATE = 3

class GameServerProtocol(asyncio.DatagramProtocol):
    def __init__(self):
        self.transport = None
        self.tick_counter = 0

    def connection_made(self, transport):
        self.transport = transport
        print("[Mock Game Server] 60Hz Netcode endpoint active on UDP port 9005")

    def datagram_received(self, data, addr):
        if len(data) >= 24:
            try:
                magic, pkt_type, player_id, client_seq, client_ts = struct.unpack("!IIIId", data[:24])
                if magic == MAGIC_GAME_HEADER and pkt_type == PKT_PLAYER_TICK:
                    self.tick_counter += 1
                    # Respond with server world state snapshot
                    # Format: Magic(4), PktType(4), PlayerID(4), ServerTick(4), ClientTs(8), WorldStatePayload...
                    state_reply = struct.pack(
                        "!IIIIdfffI",
                        MAGIC_GAME_HEADER,
                        PKT_SERVER_STATE,
                        player_id,
                        self.tick_counter,
                        client_ts,
                        102.5,
                        201.0,
                        50.0,
                        0 # State OK
                    )
                    if self.transport:
                        self.transport.sendto(state_reply, addr)
            except Exception:
                pass

async def start_mock_game_server(port: int = 9005):
    loop = asyncio.get_running_loop()
    transport, _ = await loop.create_datagram_endpoint(
        lambda: GameServerProtocol(),
        local_addr=("0.0.0.0", port)
    )
    return transport
