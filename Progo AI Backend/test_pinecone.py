import os
import requests
from dotenv import load_dotenv

load_dotenv('/home/vipulagarwal/Downloads/progo-ai/Progo AI Backend/.env')
api_key = os.getenv("PINECONE_API_KEY")
index = os.getenv("PINECONE_INDEX", "ragtest")

# Get host
res = requests.get(f"https://api.pinecone.io/indexes/{index}", headers={"Api-Key": api_key})
if res.status_code != 200:
    print("Failed to get host:", res.text)
    exit(1)
    
host = res.json()["host"]
print("Host:", host)

# Create a dummy embedding
embedding = [0.0] * 1536  # OpenAI text-embedding-3-small is 1536 dimensions

# Query
query_url = f"https://{host}/query"
query_payload = {
    "vector": embedding,
    "topK": 5,
    "includeMetadata": True,
    # "filter": {"user_id": "test"}
}
res = requests.post(query_url, json=query_payload, headers={"Api-Key": api_key, "Content-Type": "application/json"})
if res.status_code != 200:
    print("Query failed:", res.text)
else:
    matches = res.json().get("matches", [])
    print("Found matches:", len(matches))
    for m in matches[:1]:
        print(m.get("metadata", {}).get("text", "")[:100])

