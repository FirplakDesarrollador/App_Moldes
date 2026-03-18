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
    
    print(f"Fetching existing moldes serials from {SUPABASE_URL}...")
    existing_serials = set()
    offset = 0
    limit = 1000
    
    while True:
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/moldes?select=serial&limit={limit}&offset={offset}", headers=headers)
        if resp.status_code != 200:
            print(f"Error fetching moldes: {resp.text}")
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
        
    print(f"Total existing serials in Supabase: {len(existing_serials)}")

    print("Fetching tipos_moldes mapping...")
    tipos_moldes_map = {}
    offset = 0
    
    while True:
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/tipos_moldes?select=id,molde_descripcion&limit={limit}&offset={offset}", headers=headers)
        if resp.status_code != 200:
            print(f"Error fetching tipos_moldes: {resp.text}")
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
        
    print(f"Total tipos_moldes in Supabase: {len(tipos_moldes_map)}")
    
    try:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
    except Exception:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')
    
    df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]
    
    missing_records = []
    unmapped_tipos = set()
    mapped_tipos_count = 0
    
    for idx, row in df.iterrows():
        serial = str(row['Número de serie']).strip()
        if serial == 'nan' or not serial:
            continue
            
        if serial not in existing_serials:
            nombre_articulo = str(row.get('Número de artículo', '')).strip()
            estado = "Destruido"
            if 'Estado Molde' in df.columns and str(row['Estado Molde']) != 'nan':
                 estado = str(row['Estado Molde']).strip()
            elif 'Estado' in df.columns and str(row['Estado']) != 'nan':
                 estado = str(row['Estado']).strip()
                 
            tipo_molde_id = None
            if nombre_articulo.upper() in tipos_moldes_map:
                tipo_molde_id = tipos_moldes_map[nombre_articulo.upper()]
                mapped_tipos_count += 1
            else:
                unmapped_tipos.add(nombre_articulo)
                
            missing_records.append({
                'serial': serial,
                'nombre_articulo': nombre_articulo,
                'estado': estado,
                'tipo_molde_id': tipo_molde_id,
                'vueltas_actuales': row.get('Vueltas MTO', 0) if pd.notna(row.get('Vueltas MTO')) else 0
            })
            
    print(f"\nMissing records found in CSV: {len(missing_records)}")
    print(f"Mapped exact tipo_molde: {mapped_tipos_count}")
    print(f"Unmapped tipo_moldes required: {len(unmapped_tipos)}")
    
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\tmp\missing_records.json', 'w', encoding='utf-8') as f:
        json.dump(missing_records, f, indent=2, ensure_ascii=False)

    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\tmp\missing_analysis.json', 'w', encoding='utf-8') as f:
        json.dump({
            "existing_count": len(existing_serials),
            "missing_count": len(missing_records),
            "mapped_count": mapped_tipos_count,
            "unmapped_tipos_count": len(unmapped_tipos),
            "unmapped_tipos": list(unmapped_tipos)
        }, f, indent=2, ensure_ascii=False)

    print("✅ Analysis complete")

if __name__ == "__main__":
    main()
