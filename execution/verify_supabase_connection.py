# PV_MOLDES V2.4
import os
import requests
from dotenv import load_dotenv

def verify_supabase():
    load_dotenv()
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env")
        return False
        
    try:
        # Simple health check or auth config check
        response = requests.get(f"{url}/auth/v1/config", headers={"apikey": key})
        if response.status_code == 200:
            print("Successfully connected to Supabase Auth API.")
            return True
        else:
            print(f"Failed to connect. Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

if __name__ == "__main__":
    verify_supabase()
