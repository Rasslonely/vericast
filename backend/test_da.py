import asyncio
from dotenv import load_dotenv
load_dotenv('../.env')
from da_client import DAClient

async def test():
    client = DAClient()
    await client.connect()
    result = await client.upload_blob({"test": "hello world", "ts": 1234567890})
    print(f"rootHash: {result}")
    # Should be a real 0x... hash, NOT a SHA256 of the JSON
    await client.disconnect()

asyncio.run(test())
