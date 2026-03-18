import json
import urllib.request
import urllib.parse

# Supabase Credentials
URL = "https://vuiuorjzonpyobpelyld.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw"

target_id = "41506"
column_name = "DEFECTOS A REPARAR"
column_encoded = urllib.parse.quote(column_name)
fetch_url = f"{URL}/rest/v1/registros_moldes?ID=eq.{target_id}&select=ID,{column_encoded}"

req = urllib.request.Request(fetch_url)
req.add_header("apikey", KEY)
req.add_header("Authorization", f"Bearer {KEY}")

try:
    with urllib.request.urlopen(req) as response:
        records = json.loads(response.read().decode())
        if records:
            val = records[0].get(column_name)
            print(f"ID: {target_id} | Valor exacto: '{val}'")
            print(f"Representación: {repr(val)}")
            print(f"Longitud: {len(val)}")
            for i, char in enumerate(val):
                print(f"Char {i}: '{char}' (ord: {ord(char)})")
        else:
            print("Registro no encontrado")
except Exception as e:
    print(f"Error: {e}")
