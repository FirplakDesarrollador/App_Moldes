# PV_MOLDES V2.4
import os
import pandas as pd
import requests
import json
from dotenv import load_dotenv
import time

load_dotenv()

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") # Usually this is the anon key, might need service role for bulk updates if RLS is strict

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def update_moldes():
    csv_path = r"data/Listado Moldes.csv"
    
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    # Read CSV
    try:
        df = pd.read_csv(csv_path, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(csv_path, encoding='latin1')

    print(f"Total rows in CSV: {len(df)}")
    
    # Filter columns
    # The columns are: "Número de serie", "Número de artículo"
    if "Número de serie" not in df.columns or "Número de artículo" not in df.columns:
        print("Required columns not found in CSV")
        print(f"Columns found: {df.columns.tolist()}")
        return

    # Pre-process: strip whitespace
    df["Número de serie"] = df["Número de serie"].astype(str).str.strip()
    df["Número de artículo"] = df["Número de artículo"].astype(str).str.strip()

    updates_count = 0
    errors_count = 0
    
    # We'll do individual updates because Supabase bulk patch requires id
    # If we want to be fast, we can use the SQL tool or individual requests.
    # Individual requests are safer against tool limits.
    
    print("Starting updates...")
    for index, row in df.iterrows():
        serial = row["Número de serie"]
        nombre = row["Número de artículo"]
        
        if pd.isna(serial) or pd.isna(nombre) or serial == "nan" or nombre == "nan":
            continue
            
        # PATCH /rest/v1/moldes?serial=eq.{serial}
        url = f"{supabase_url}/rest/v1/moldes?serial=eq.{serial}"
        data = {"nombre_articulo": nombre}
        
        try:
            response = requests.patch(url, headers=headers, json=data)
            if response.status_code in [200, 201, 204]:
                updates_count += 1
            else:
                print(f"Error updating serial {serial}: {response.status_code} - {response.text}")
                errors_count += 1
        except Exception as e:
            print(f"Exceptions for serial {serial}: {str(e)}")
            errors_count += 1
            
        if updates_count % 50 == 0 and updates_count > 0:
            print(f"Updated {updates_count} rows...")

    print(f"Process finished. Successful updates: {updates_count}, Errors: {errors_count}")

if __name__ == "__main__":
    update_moldes()
