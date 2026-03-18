import json
import urllib.request
import urllib.parse
import os

# Supabase Credentials
URL = "https://vuiuorjzonpyobpelyld.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw"

def apply_cleanup_bulk():
    print("Iniciando proceso de limpieza OPTIMIZADO...")
    
    # 1. Fetch records with commas
    column_name = "DEFECTOS A REPARAR"
    column_encoded = urllib.parse.quote(column_name)
    fetch_url = f"{URL}/rest/v1/registros_moldes?{column_encoded}=like.*,*&select=ID,{column_encoded}"
    
    req = urllib.request.Request(fetch_url)
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    
    try:
        with urllib.request.urlopen(req) as response:
            records = json.loads(response.read().decode())
            print(f"Encontrados {len(records)} registros para analizar.")
    except Exception as e:
        print(f"Error al obtener registros: {e}")
        return

    # 2. Prepare cleaned data
    to_update = []
    for record in records:
        original = record.get(column_name)
        if not original:
            continue
            
        parts = [p.strip() for p in original.split(',')]
        clean_parts = [p for p in parts if p]
        cleaned = ", ".join(clean_parts)
        
        if cleaned != original:
            to_update.append({
                "ID": record["ID"],
                column_name: cleaned
            })

    print(f"Total de registros que requieren limpieza: {len(to_update)}")
    
    # 3. Bulk UPSERT (PostgREST supports upserting an array of objects)
    # We use 'resolution=merge-duplicates' or just POST with the array if ID is PK
    batch_size = 100
    for i in range(0, len(to_update), batch_size):
        batch = to_update[i:i+batch_size]
        
        # PostgREST Upsert: POST to the table with an array
        url = f"{URL}/rest/v1/registros_moldes"
        data = json.dumps(batch).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header("apikey", KEY)
        req.add_header("Authorization", f"Bearer {KEY}")
        req.add_header("Content-Type", "application/json")
        # Upsert based on primary key (ID)
        req.add_header("Prefer", "resolution=merge-duplicates")
        
        try:
            urllib.request.urlopen(req)
            print(f"Lote {i//batch_size + 1} completado ({min(i+batch_size, len(to_update))}/{len(to_update)})...")
        except Exception as e:
            print(f"Error en lote {i//batch_size + 1}: {e}")

    print("Proceso de limpieza masiva completado.")

if __name__ == "__main__":
    apply_cleanup_bulk()
