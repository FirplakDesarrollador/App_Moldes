# PV_MOLDES V2.4
import csv
import json
import urllib.request
import urllib.error
import os
from datetime import datetime

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

AUTH = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}", "Content-Type": "application/json"}

def format_to_iso(date_str):
    if not date_str or date_str in ('NULL', '', ' '):
        return None
    # Normalize slashes and try common patterns
    date_str = date_str.replace('-', '/')
    # If already in ISO, just return
    if len(date_str) == 10 and date_str[4] == '-' and date_str[7] == '-':
        return date_str
        
    simple_date = date_str.split(' ')[0]
    formats = ['%m/%d/%Y', '%m/%d/%y', '%d/%m/%Y']
    for fmt in formats:
        try:
            return datetime.strptime(simple_date, fmt).strftime('%Y-%m-%d')
        except:
            continue
    return date_str # Failsafe

def fetch_rest_all(table):
    results = []
    limit = 2000
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers=AUTH)
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        if not data:
            break
        results.extend(data)
        offset += limit
        print(f"Fetched {len(results)} from {table}...")
    return results

def migrate_and_upload():
    # 1. Fetch current consolidated table
    print("Reading current records from database...")
    all_data = fetch_rest_all("registros_moldes")
    
    # 2. Map existing data into a dictionary by ID to avoid duplicates (if ID is unique enough)
    # Since we want to update with CSV data later, we use ID as key
    db_indexed = {}
    for row in all_data:
        rid = str(row.get("ID") or "")
        if rid:
            db_indexed[rid] = row
        else:
            # Fallback for rows without ID?
            db_indexed[f"NO_ID_{len(db_indexed)}"] = row

    print(f"Loaded {len(db_indexed)} unique ID entries from database.")

    # 3. Read CSV and Overwrite/Add
    print("Reading and adapting CSV data...")
    with open('data/BD Moldes.csv', mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rid = str(row.get("ID") or "")
            if not rid: continue
            
            # Map Título to Nombre
            if "Título" in row:
                row["Nombre"] = row.pop("Título")
            
            # Use CSV data (overwriting DB data if ID exists)
            db_indexed[rid] = row

    print(f"Consolidated data: {len(db_indexed)} records total.")

    # 4. Normalize all dates for the FINAL set
    print("Normalizing all dates to YYYY-MM-DD for correct sorting...")
    final_rows = []
    for rid, row in db_indexed.items():
        for col in ["FECHA ENTRADA", "FECHA ESPERADA", "FECHA ENTREGA"]:
            if col in row:
                row[col] = format_to_iso(row[col])
        # Also clean empty strings to None/null for database
        for key in list(row.keys()):
            if row[key] == '':
                row[key] = None
        final_rows.append(row)

    # 5. Backup to file (Safe check)
    with open('data/registros_moldes_consolidated.json', 'w', encoding='utf-8') as f:
        json.dump(final_rows, f, indent=2)
    print("Backup saved to data/registros_moldes_consolidated.json")

    # 6. DELETE current table contents
    print("Wiping registros_moldes table...")
    # PostgREST requires a filter to avoid accidental global deletes.
    # We'll use id.neq.0 or something that covers everything.
    # Alternatively, use a filter that matches all rows.
    del_req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/registros_moldes?ID=neq.0", method='DELETE', headers=AUTH)
    try:
        urllib.request.urlopen(del_req)
        print("Table wiped!")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Delete Error: {e.code} - {body}")
        # If ID=neq.0 failed, try another one or proceed to insert (will duplicate if not wiped)
        exit(1)

    # 7. Batch INSERT
    batch_size = 500
    print(f"Uploading {len(final_rows)} rows in batches of {batch_size}...")
    for i in range(0, len(final_rows), batch_size):
        batch = final_rows[i:i+batch_size]
        url = f"{SUPABASE_URL}/rest/v1/registros_moldes"
        req = urllib.request.Request(url, data=json.dumps(batch).encode('utf-8'), method='POST', headers=AUTH)
        try:
            urllib.request.urlopen(req)
            print(f"Uploaded batch {i//batch_size + 1}/{(len(final_rows)//batch_size)+1}...")
        except urllib.error.HTTPError as e:
            print(f"Error on batch: {e.code} - {e.read().decode()}")
            # If it fails, we still have the backup
            break

    print("Migration and Upload complete!")

if __name__ == "__main__":
    migrate_and_upload()
