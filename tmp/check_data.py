import json
import urllib.request
import urllib.parse
import os

# From .env
URL = "https://vuiuorjzonpyobpelyld.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw"

column = urllib.parse.quote("DEFECTOS A REPARAR")
query = f"{column}=like.*,*"
url = f"{URL}/rest/v1/registros_moldes?{query}&select=ID,{column}&limit=20"

req = urllib.request.Request(url)
req.add_header("apikey", KEY)
req.add_header("Authorization", f"Bearer {KEY}")

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"Found {len(data)} sample records with commas.")
        for row in data:
            print(f"ID: {row['ID']} | Value: '{row['DEFECTOS A REPARAR']}'")
except Exception as e:
    print(f"Error: {e}")
