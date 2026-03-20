# PV_MOLDES V2.4
import json
import urllib.request
import urllib.parse
import os

# Supabase Credentials from .env context
URL = "https://vuiuorjzonpyobpelyld.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw"

def apply_cleanup():
    # We'll fetch records that need cleaning first, then update them.
    # This is safer than a blind global update via API if we can't run raw SQL easily.
    # However, since we want to be efficient, we'll try to use a RPC or a clever PATCH if possible.
    # Given the constraints, we'll do it in batches: fetch -> clean locally -> update.

    print("Iniciando proceso de limpieza...")
    
    # 1. Fetch records with commas
    column = urllib.parse.quote("DEFECTOS A REPARAR")
    fetch_url = f"{URL}/rest/v1/registros_moldes?{column}=like.*,*&select=ID,{column}"
    
    req = urllib.request.Request(fetch_url)
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    
    try:
        with urllib.request.urlopen(req) as response:
            records = json.loads(response.read().decode())
            print(f"Encontrados {len(records)} registros para procesar.")
    except Exception as e:
        print(f"Error al obtener registros: {e}")
        return

    # 2. Process and Update
    updated_count = 0
    for record in records:
        original = record.get("DEFECTOS A REPARAR")
        if not original:
            continue
            
        # Clean logic:
        # - Split by commas
        # - Trim each element
        # - Remove empty elements
        # - Join back with ", "
        parts = [p.strip() for p in original.split(',')]
        clean_parts = [p for p in parts if p]
        cleaned = ", ".join(clean_parts)
        
        if cleaned == original:
            continue
            
        # Update record
        update_url = f"{URL}/rest/v1/registros_moldes?ID=eq.{record['ID']}"
        data = json.dumps({"DEFECTOS A REPARAR": cleaned}).encode('utf-8')
        
        upd_req = urllib.request.Request(update_url, data=data, method='PATCH')
        upd_req.add_header("apikey", KEY)
        upd_req.add_header("Authorization", f"Bearer {KEY}")
        upd_req.add_header("Content-Type", "application/json")
        upd_req.add_header("Prefer", "return=minimal")
        
        try:
            urllib.request.urlopen(upd_req)
            updated_count += 1
            if updated_count % 50 == 0:
                print(f"Procesados {updated_count} registros...")
        except Exception as e:
            print(f"Error actualizando ID {record['ID']}: {e}")

    print(f"Limpieza completada. Se actualizaron {updated_count} registros.")

if __name__ == "__main__":
    apply_cleanup()
