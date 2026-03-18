import glob
import json
import os
import sys
import requests
from dotenv import load_dotenv

def main():
    load_dotenv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\.env')
    
    SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Missing SUPABASE env vars")
        return

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    files = sorted(glob.glob(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\execution\moldes_chunk_*.sql'))

    # The REST API doesn't support executing raw SQL queries like this through the regular REST endpoint.
    # We must use the MCP tool.
    print("Cannot use REST API for raw SQL queries without a stored RPC procedure.")
    
if __name__ == "__main__":
    main()
