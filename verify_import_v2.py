import json
import urllib.request
import urllib.parse
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

def check_top_5():
    # Properly encode spaces
    query_params = urllib.parse.urlencode({
        'select': '*',
        'order': 'FECHA ENTRADA.desc',
        'limit': 5
    })
    url = f"{SUPABASE_URL}/rest/v1/registros_moldes?{query_params}"
    req = urllib.request.Request(url)
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    
    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        print("--- Top 5 Records (Order by FECHA ENTRADA DESC) ---")
        for i, row in enumerate(data):
            print(f"{i+1}. ID: {row['ID']}, Fecha: {row['FECHA ENTRADA']}, Molde: {row['CODIGO MOLDE']}")
    except Exception as e:
        print("Error checking top 5:", e)

def check_specific_id(target_id):
    url = f"{SUPABASE_URL}/rest/v1/registros_moldes?ID=eq.{target_id}&select=*"
    req = urllib.request.Request(url)
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    
    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        if data:
            print(f"Record with ID {target_id} found.")
        else:
            print(f"Record with ID {target_id} NOT found.")
    except Exception as e:
        print(f"Error checking ID {target_id}:", e)

# Use some recent IDs from the end of the CSV
# Let's check ID 40049 (row 1638 in CSV)
check_specific_id("40049")
check_top_5()
