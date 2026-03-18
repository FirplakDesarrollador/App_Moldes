import json
import urllib.request

# Supabase Credentials
URL = "https://vuiuorjzonpyobpelyld.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw"

target_id = "41506"
new_val = "Molde Rayado"

print(f"Forzando actualización de ID {target_id} a '{new_val}'...")

update_url = f"{URL}/rest/v1/registros_moldes?ID=eq.{target_id}"
data = json.dumps({"DEFECTOS A REPARAR": new_val}).encode('utf-8')

req = urllib.request.Request(update_url, data=data, method='PATCH')
req.add_header("apikey", KEY)
req.add_header("Authorization", f"Bearer {KEY}")
req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req) as response:
        print("PATCH enviado correctamente.")
except Exception as e:
    print(f"Error en PATCH: {e}")
