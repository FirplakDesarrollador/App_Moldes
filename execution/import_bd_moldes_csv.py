import csv
import json
import urllib.request
import urllib.error
import os
from datetime import datetime

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

def format_date(date_str):
    if not date_str or date_str == 'NULL':
        return None
    # Common formats in the CSV: M/D/YYYY or M/D/YYYY H:M AM/PM
    formats = ['%m/%d/%Y', '%m/%d/%y', '%d/%m/%Y', '%Y-%m-%d', '%m/%d/%Y %I:%M %p']
    
    # Try parsing
    date_obj = None
    # Normalize slashes
    date_str = date_str.replace('-', '/')
    
    # Split time if present for the simple date columns
    simple_date = date_str.split(' ')[0]
    
    for fmt in ['%m/%d/%Y', '%m/%d/%y', '%d/%m/%Y']:
        try:
            date_obj = datetime.strptime(simple_date, fmt)
            break
        except:
            continue
            
    if date_obj:
        return date_obj.strftime('%Y-%m-%d')
    return date_str # Return as is if failed

# 2. Parse CSV
new_records = []
try:
    with open('data/BD Moldes.csv', mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get("ID"):
                continue
            
            # Adaptation 1: Rename columns
            if "Título" in row:
                row["Nombre"] = row.pop("Título")
            
            # Adaptation 2: Format dates to YYYY-MM-DD for correct alphabetical sorting as text
            for col in ["FECHA ENTRADA", "FECHA ESPERADA", "FECHA ENTREGA"]:
                if col in row:
                    row[col] = format_date(row[col])
            
            # Remove any empty fields that might cause issues or keep them as None
            for key in list(row.keys()):
                if row[key] == '':
                    row[key] = None
                    
            new_records.append(row)
except Exception as e:
    print("Error reading CSV:", e)
    exit(1)

print(f"Prepared {len(new_records)} records for UPSERT.")

# 3. UPSERT in batches (ID is the primary key for conflict resolution in Supabase)
# Note: In PostgREST/Supabase, we use ON CONFLICT (ID) DO UPDATE
batch_size = 50
for i in range(0, len(new_records), batch_size):
    batch = new_records[i:i+batch_size]
    
    url = f"{SUPABASE_URL}/rest/v1/registros_moldes"
    req = urllib.request.Request(url, data=json.dumps(batch).encode('utf-8'), method='POST')
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    req.add_header("Content-Type", "application/json")
    # Prefer: resolution=merge (UPSERT based on PK)
    req.add_header("Prefer", "resolution=merge-duplicates")
    
    try:
        urllib.request.urlopen(req)
        print(f"Upserted batch {i//batch_size + 1}/{len(new_records)//batch_size + 1}...")
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"HTTP Error on batch {i//batch_size + 1}: {e.code} - {body}")
        # If ID is not a PK, merge-duplicates might fail. 
        # But we create registries_moldes with SELECT INTO.
    except Exception as e:
        print(f"Error inserting batch {i//batch_size + 1}:", e)

print("Import process completed!")
