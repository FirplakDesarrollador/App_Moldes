# PV_MOLDES V2.4
import os
import json
import pandas as pd
import requests
import random
from dotenv import load_dotenv

def validate():
    load_dotenv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\.env')
    
    SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    print("Fetching existing moldes serials and ids from Supabase REST...")
    db_moldes = {}
    offset = 0
    limit = 1000
    
    while True:
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/moldes?select=serial,nombre_articulo,estado,tipo_molde_id&limit={limit}&offset={offset}", headers=headers)
        if resp.status_code != 200:
            print("Failed connection details: ", resp.text)
            break
        data = resp.json()
        if not data:
            break
        for item in data:
            s = str(item.get('serial', '')).strip()
            if s and s != 'None':
                db_moldes[s] = item
        if len(data) < limit:
            break
        offset += limit
        
    print(f"Total moldes en Supabase (tabla 'moldes'): {len(db_moldes)}\n")

    # Load CSV data
    try:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
    except Exception:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')
    
    df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]
    
    valid_csv_serials = []
    for idx, row in df.iterrows():
        serial = str(row.get('Número de serie', '')).strip()
        if serial and serial.upper() != 'NAN':
            valid_csv_serials.append(serial)
    
    valid_csv_serials_unique = list(set(valid_csv_serials))
    print(f"Total registros únicos con serial válido en CSV original: {len(valid_csv_serials_unique)}")
    print(f"Total registros en el CSV (brutos): {len(df)}")
    
    # Validacion de cuantos estan en la bd
    en_bd = sum(1 for s in valid_csv_serials_unique if s in db_moldes)
    print(f"Registros del CSV actualmente en la base de datos: {en_bd}\n")
    
    print("--- VALIDACIÓN ALEATORIA DE 3 REGISTROS ---")
    random.seed()
    # pick 3 random items that we expect are inside the DB
    sample_serials = random.sample(valid_csv_serials_unique, min(3, len(valid_csv_serials_unique)))
    
    for s in sample_serials:
        # Find in pandas
        row = df[df['Número de serie'].astype(str).str.strip() == s].iloc[0]
        csv_nombre = str(row.get('Número de artículo', ''))
        
        estado_raw = ""
        if 'Estado Molde' in df.columns and str(row['Estado Molde']) != 'nan':
            estado_raw = str(row['Estado Molde']).strip()
        elif 'Estado' in df.columns and str(row['Estado']) != 'nan':
            estado_raw = str(row['Estado']).strip()

        print(f"\nSerial: {s}")
        print(f"   Dato en CSV -> Nombre: '{csv_nombre}', Estado original: '{estado_raw}'")
        
        if s in db_moldes:
            bd_data = db_moldes[s]
            print(f"   Dato en DB  -> Nombre: '{bd_data['nombre_articulo']}', Estado DB: '{bd_data['estado']}', TipoMoldeID: {bd_data['tipo_molde_id']}")
            if bd_data['tipo_molde_id'] is None:
                print("   [ALERTA] -> El tipo_molde_id quedó null, significa que no ligó con tipos_moldes.")
            else:
                print("   [Éxito] -> Relacionado correctamente con llave foránea.")
        else:
            print(f"   [ALERTA] -> ¡Este registro no está en Supabase!")

if __name__ == "__main__":
    validate()
