# PV_MOLDES V2.4
import os
import requests
from dotenv import load_dotenv

def check_schema():
    load_dotenv()
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Error: Credentials not found in .env")
        return
        
    # Query PostgREST to get table info
    try:
        response = requests.get(
            f"{url}/rest/v1/base_datos_moldes?select=*",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Range": "0-0" # Just get the first row or headers
            }
        )
        if response.status_code == 200:
            print("Successfully accessed 'base_datos_moldes' table.")
            if len(response.json()) > 0:
                print("Columns found:", list(response.json()[0].keys()))
            else:
                print("Table is empty, but accessible.")
        else:
            print(f"Failed to access table. Status: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
