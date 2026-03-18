import csv
import json
import urllib.request
import os

# 1. Read environment variables from .env
env_vars = {}
with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            parts = line.strip().split('=', 1)
            if len(parts) == 2:
                env_vars[parts[0]] = parts[1]

SUPABASE_URL = env_vars.get("NEXT_PUBLIC_SUPABASE_URL")
ANON_KEY = env_vars.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

def get_existing_ids():
    ids = set()
    limit = 1000
    offset = 0
    auth = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
    while True:
        url = f"{SUPABASE_URL}/rest/v1/registros_moldes?select=ID&limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers=auth)
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        if not data:
            break
        for r in data:
            if r.get('ID'):
                ids.add(str(r['ID']))
        offset += limit
    return ids

def check_csv():
    existing_ids = get_existing_ids()
    csv_rows = []
    with open('data/BD Moldes.csv', mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_rows.append(row)
    
    csv_ids = [str(r.get('ID')) for r in csv_rows if r.get('ID')]
    new_ids = [cid for cid in csv_ids if cid not in existing_ids]
    
    print(f"Total rows in CSV: {len(csv_rows)}")
    print(f"Total rows with IDs in CSV: {len(csv_ids)}")
    print(f"Total existing IDs in table: {len(existing_ids)}")
    print(f"Number of NEW IDs from CSV: {len(new_ids)}")
    
    if new_ids:
        print(f"First 5 new IDs: {new_ids[:5]}")

if __name__ == "__main__":
    check_csv()
