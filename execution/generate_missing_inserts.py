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
    
    print("Fetching existing moldes serials...")
    existing_serials = set()
    offset = 0
    limit = 1000
    
    while True:
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/moldes?select=serial&limit={limit}&offset={offset}", headers=headers)
        if resp.status_code != 200:
            break
        data = resp.json()
        if not data:
            break
        for item in data:
            s = item.get('serial')
            if s: existing_serials.add(str(s).strip())
        if len(data) < limit:
            break
        offset += limit
        
    print("Fetching tipos_moldes mapping...")
    tipos_moldes_map = {}
    offset = 0
    
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
    
    missing_records = []
    skipped_records = []
    
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\insert_missing_moldes.sql', 'w', encoding='utf-8') as f_moldes:
        f_moldes.write("BEGIN;\n")
        for idx, row in df.iterrows():
            serial = str(row['Número de serie']).strip()
            if serial == 'nan' or not serial:
                continue
                
            if serial not in existing_serials:
                nombre_articulo = str(row.get('Número de artículo', '')).strip().replace("'", "''")
                
                # Check if it exists in map, if not skip to avoid FK err
                if str(row.get('Número de artículo', '')).strip().upper() not in tipos_moldes_map:
                    skipped_records.append(serial)
                    continue
                
                estado_raw = ""
                if 'Estado Molde' in df.columns and str(row['Estado Molde']) != 'nan':
                     estado_raw = str(row['Estado Molde']).strip()
                elif 'Estado' in df.columns and str(row['Estado']) != 'nan':
                     estado_raw = str(row['Estado']).strip()
                     
                if estado_raw == "Activo":
                    estado = "En uso"
                elif estado_raw == "Inactivo":
                    estado = "Indefinido"
                elif estado_raw == "Mantenimiento":
                    estado = "En reparacion"
                elif estado_raw == "Destruido":
                    estado = "Destruido"
                else:
                    estado = "Indefinido"
                         
                vueltas_str = str(row.get('Vueltas MTO', '0'))
                vueltas = 0
                if vueltas_str != 'nan' and vueltas_str.isdigit():
                    vueltas = int(vueltas_str)

                safe_serial = serial.replace("'", "''")

                sql = (
                    f"INSERT INTO public.moldes (serial, nombre_articulo, estado, vueltas_actuales, tipo_molde_id) "
                    f"VALUES ('{safe_serial}', '{nombre_articulo}', '{estado}', {vueltas}, "
                    f"(SELECT id FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('{nombre_articulo}') LIMIT 1)) "
                    f"ON CONFLICT (serial) DO NOTHING;\n"
                )
                f_moldes.write(sql)
                missing_records.append(serial)
                
        f_moldes.write("COMMIT;\n")

    print(f"Generated insert_missing_moldes.sql for {len(missing_records)} records. Skipped {len(skipped_records)} missing FKs.")

if __name__ == "__main__":
    main()
