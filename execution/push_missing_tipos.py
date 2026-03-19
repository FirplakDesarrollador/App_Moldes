# PV_MOLDES V2.4
import os
import json
import pandas as pd
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
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
        
    print("Fetching tipos_moldes mapping...")
    tipos_moldes_map = {}
    offset = 0
    limit = 1000
    
    while True:
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/tipos_moldes?select=id,molde_descripcion&limit={limit}&offset={offset}", headers=headers)
        if resp.status_code != 200:
            break
        data = resp.json()
        if not data:
            break
        for item in data:
            desc = item.get('molde_descripcion')
            if desc: tipos_moldes_map[desc.strip().upper()] = item
        if len(data) < limit:
            break
        offset += limit

    try:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
    except Exception:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')
    
    df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]
    
    unmapped_set = set()
    payload = []
    
    for idx, row in df.iterrows():
        nombre_articulo = str(row.get('Número de artículo', '')).strip()
        nombre_articulo_upper = nombre_articulo.upper()
        
        if nombre_articulo and nombre_articulo_upper not in tipos_moldes_map and nombre_articulo_upper not in unmapped_set:
            unmapped_set.add(nombre_articulo_upper)
            planta = str(row.get('Planta', 'MS')).strip().upper()
            planta_enum = 'Marmol_sintetico'
            if planta == 'FV':
                planta_enum = 'Fibra_de_vidrio'
            
            payload.append({
                "molde_descripcion": nombre_articulo,
                "planta": planta_enum,
                "molde_sku": "S/N"
            })
            
    if len(payload) > 0:
        print(f"Pushing {len(payload)} new tipos_moldes directly via REST POST...")
        # Break into chunks of 100 for safety
        chunk_size = 100
        for i in range(0, len(payload), chunk_size):
            chunk = payload[i:i + chunk_size]
            resp = requests.post(f"{SUPABASE_URL}/rest/v1/tipos_moldes", headers=headers, json=chunk)
            if resp.status_code not in (200, 201):
                print(f"Error pushing chunk: {resp.status_code} - {resp.text}")
            else:
                print(f"Pushed chunk {i} to {i+len(chunk)}")
    else:
        print("No missing tipos_moldes found!")

if __name__ == "__main__":
    main()
