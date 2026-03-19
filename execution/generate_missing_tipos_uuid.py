# PV_MOLDES V2.4
import os
import json
import pandas as pd
import requests
import uuid
import sys
from dotenv import load_dotenv

def main():
    load_dotenv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\.env.local')
    
    SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Missing SUPABASE env vars or service key! Make sure SUPABASE_SERVICE_ROLE_KEY is in .env.local")
        sys.exit(1)

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    print("Fetching tipos_moldes mapping from Supabase REST...")
    existing_tipos = set()
    offset = 0
    limit = 1000
    
    while True:
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/tipos_moldes?select=id,molde_descripcion&limit={limit}&offset={offset}", headers=headers)
        if resp.status_code != 200:
            print(f"Failed connection: {resp.text}")
            break
        data = resp.json()
        if not data:
            break
        for item in data:
            desc = item.get('molde_descripcion')
            if desc: existing_tipos.add(desc.strip().upper())
        if len(data) < limit:
            break
        offset += limit
        
    print(f"Loaded {len(existing_tipos)} valid existing tipos_moldes from DB")

    try:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
    except Exception:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')
    
    df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]
    
    unmapped_set = set()
    
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\execution\insert_tipos_moldes_uuid.sql', 'w', encoding='utf-8') as f_tipos:
        f_tipos.write("BEGIN;\n")
        count = 0
        for idx, row in df.iterrows():
            nombre_articulo = str(row.get('Número de artículo', '')).strip()
            nombre_articulo_upper = nombre_articulo.upper()
            
            if nombre_articulo and nombre_articulo_upper != 'NAN' and nombre_articulo_upper not in existing_tipos and nombre_articulo_upper not in unmapped_set:
                unmapped_set.add(nombre_articulo_upper)
                planta = str(row.get('Planta', 'MS')).strip().upper()
                planta_enum = 'Marmol_sintetico'
                if planta == 'FV':
                    planta_enum = 'Fibra_de_vidrio'
                
                safe_name = nombre_articulo.replace("'", "''")
                sku = f"GEN-{uuid.uuid4().hex[:8].upper()}"
                
                f_tipos.write(f"INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('{safe_name}', '{planta_enum}', '{sku}') ON CONFLICT DO NOTHING;\n")
                count += 1
        f_tipos.write("COMMIT;\n")
        
    print(f"Generated insert_tipos_moldes_uuid.sql for {count} new tipos_moldes")

if __name__ == "__main__":
    main()
