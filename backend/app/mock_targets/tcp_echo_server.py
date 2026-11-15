import asyncio

async def handle_tcp_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    try:
        while True:
            line = await reader.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="ignore").strip()
            # Reply with PONG ack
            response = f"ACK: {text}\n".encode("utf-8")
            writer.write(response)
            await writer.drain()
    except Exception:
        pass
    finally:
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass

async def start_mock_tcp(port: int = 9002):
    server = await asyncio.start_server(handle_tcp_client, "0.0.0.0", port, reuse_address=True)
    return server
