import json
import urllib.request
import urllib.parse
import os

# Supabase Credentials
URL = "https://vuiuorjzonpyobpelyld.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw"

def apply_cleanup_v2():
    print("Iniciando proceso de limpieza PROFUNDA (v2)...")
    
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

    # 2. Prepare cleaned data with deeper logic
    to_update = []
    for record in records:
        original = record.get(column_name)
        if original is None:
            continue
            
        # Deeper Cleanup Logic:
        # 1. Split by comma
        # 2. Strip EACH fragment
        # 3. Filter out empty fragments
        # 4. Join with ", "
        # 5. Resulting string should have no leading/trailing spaces
        
        parts = original.split(',')
        clean_fragments = []
        for p in parts:
            trimmed = p.strip()
            if trimmed: # Only keep non-empty strings
                clean_fragments.append(trimmed)
        
        cleaned = ", ".join(clean_fragments)
        
        # Also handle purely empty or "space only" strings resulting in empty
        if not cleaned:
            cleaned = None # Or just "" based on preference, I'll use None if empty
            
        if cleaned != original:
            to_update.append({
                "ID": record["ID"],
                column_name: cleaned
            })

    print(f"Total de registros que serán corregidos: {len(to_update)}")
    
    if not to_update:
        print("No hay cambios que realizar.")
        return

    # 3. Bulk UPSERT in batches
    batch_size = 100
    for i in range(0, len(to_update), batch_size):
        batch = to_update[i:i+batch_size]
        url = f"{URL}/rest/v1/registros_moldes"
        data = json.dumps(batch).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header("apikey", KEY)
        req.add_header("Authorization", f"Bearer {KEY}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "resolution=merge-duplicates")
        
        try:
            urllib.request.urlopen(req)
            print(f"Lote {i//batch_size + 1} completado ({min(i+batch_size, len(to_update))}/{len(to_update)})...")
        except Exception as e:
            print(f"Error en lote {i//batch_size + 1}: {e}")

    print("Proceso de limpieza profunda completado.")

if __name__ == "__main__":
    apply_cleanup_v2()
