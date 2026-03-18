import os
import json
import pandas as pd
import requests
from dotenv import load_dotenv

def log_report():
    load_dotenv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\.env')
    
    SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    db_moldes_serials = []
    offset = 0
    limit = 1000
    while True:
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/moldes?select=serial&limit={limit}&offset={offset}", headers=headers)
        if resp.status_code != 200: break
        data = resp.json()
        if not data: break
        for item in data:
            s = str(item.get('serial', '')).strip()
            if s and s != 'None':
                db_moldes_serials.append(s)
        if len(data) < limit: break
        offset += limit

    try:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
    except:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')
    
    df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]
    
    csv_serials = set()
    for _, row in df.iterrows():
        serial = str(row.get('Número de serie', '')).strip()
        if serial and serial.upper() != 'NAN':
            csv_serials.add(serial)

    db_serials_set = set(db_moldes_serials)
    
    present = csv_serials.intersection(db_serials_set)
    missing = csv_serials - db_serials_set
    
    report = {
        "total_db_moldes_count": len(db_moldes_serials),
        "total_csv_unique_serials": len(csv_serials),
        "csv_serials_found_in_db": len(present),
        "csv_serials_missing_in_db": len(missing),
        "sample_missing": list(missing)[:5] if missing else [],
        "sample_db_keys": list(db_serials_set)[:5]
    }
    
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\tmp\validation_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=4)
        
    print("Report written to validation_report.json")

if __name__ == "__main__":
    log_report()
