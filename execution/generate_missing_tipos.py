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
        "Content-Type": "application/json"
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
            if desc: tipos_moldes_map[desc.strip().upper()] = item['id']
        if len(data) < limit:
            break
        offset += limit

    try:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
    except Exception:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')
    
    df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]
    
    # Generate SQL files
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\insert_tipos_moldes.sql', 'w', encoding='utf-8') as f_tipos:
        f_tipos.write("BEGIN;\n")
        unmapped_set = set()
        for idx, row in df.iterrows():
            nombre_articulo = str(row.get('Número de artículo', '')).strip()
            nombre_articulo_upper = nombre_articulo.upper()
            if nombre_articulo and nombre_articulo_upper not in tipos_moldes_map and nombre_articulo_upper not in unmapped_set:
                unmapped_set.add(nombre_articulo_upper)
                planta = str(row.get('Planta', 'MS')).strip().upper()
                planta_enum = 'Marmol_sintetico'
                if planta == 'FV':
                    planta_enum = 'Fibra_de_vidrio'
                
                # Escape quotes
                safe_name = nombre_articulo.replace("'", "''")
                f_tipos.write(f"INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('{safe_name}', '{planta_enum}', 'S/N') ON CONFLICT DO NOTHING;\n")
        f_tipos.write("COMMIT;\n")
    
    print(f"Generated insert_tipos_moldes.sql for {len(unmapped_set)} new tipos_moldes")
    for u in unmapped_set:
        print(f"  Missing: {u}")
        

if __name__ == "__main__":
    main()
