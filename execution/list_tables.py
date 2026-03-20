# PV_MOLDES V2.4
import os
import requests
from dotenv import load_dotenv

def list_tables():
    load_dotenv()
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Error: Missing credentials in .env")
        return

    # Using PostgREST openapi spec to discover tables
    try:
        response = requests.get(
            f"{url}/rest/v1/",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}"
            }
        )
        if response.status_code == 200:
            print("Successfully connected to Supabase.")
            # Usually the response is a JSON describing the API
            # Let's try to query the specific table directly to see if it's there
            print("Checking for table 'Datos personal Firplak'...")
            table_resp = requests.get(
                f"{url}/rest/v1/Datos%20personal%20Firplak?select=*",
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Range": "0-0"
                }
            )
            print(f"Table status: {table_resp.status_code}")
            if table_resp.status_code == 200:
                print("Table 'Datos personal Firplak' exists and is accessible.")
                print(f"Sample data: {table_resp.json()}")
            else:
                print(f"Table error or missing: {table_resp.text}")
        else:
            print(f"Connection error: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_tables()
