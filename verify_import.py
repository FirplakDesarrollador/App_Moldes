import json
import urllib.request
import os

# 1. Read environment variables from .env
env_vars = {}
try:
    with open('.env', 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                parts = line.strip().split('=', 1)
                if len(parts) == 2:
                    env_vars[parts[0]] = parts[1]
except FileNotFoundError:
    print("Could not find .env file.")
    exit(1)

SUPABASE_URL = env_vars.get("NEXT_PUBLIC_SUPABASE_URL")
ANON_KEY = env_vars.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not ANON_KEY:
    print("Supabase credentials not found in .env")
    exit(1)

def check_count():
    url = f"{SUPABASE_URL}/rest/v1/registros_moldes?select=count"
    req = urllib.request.Request(url)
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    req.add_header("Prefer", "count=exact")
    
    try:
        response = urllib.request.urlopen(req)
        # In PostgREST, count 'exact' returns content-range header or a list with count
        headers = dict(response.info())
        print(f"Total count (from header): {headers.get('Content-Range')}")
    except Exception as e:
        print("Error checking count:", e)

def check_id(target_id):
    url = f"{SUPABASE_URL}/rest/v1/registros_moldes?ID=eq.{target_id}&select=*"
    req = urllib.request.Request(url)
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    
    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        if data:
            print(f"Record with ID {target_id} found: {json.dumps(data[0], indent=2)}")
        else:
            print(f"Record with ID {target_id} NOT found.")
    except Exception as e:
        print(f"Error checking ID {target_id}:", e)

print("--- Data Verification ---")
check_count()
check_id("38913") # From CSV row 2
check_id("39646") # From CSV row 3
