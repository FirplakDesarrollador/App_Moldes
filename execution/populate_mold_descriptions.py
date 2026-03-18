import os
import pandas as pd
import requests
from dotenv import load_dotenv
from pathlib import Path

def populate_descriptions():
    # 1. Cargar variables de entorno
    load_dotenv()
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Usamos service role para updates masivos si es necesario, o ANON si tiene permisos
    
    if not key:
        key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        print("❌ Error: No se encontraron las credenciales en el archivo .env")
        return

    # 2. Ruta del archivo Excel
    excel_path = Path("data/moldes_descripcion.xlsx")
    
    if not excel_path.exists():
        print(f"❌ Error: El archivo {excel_path} no existe.")
        print("Asegúrate de guardar tu archivo Excel en la carpeta 'data' con el nombre 'moldes_descripcion.xlsx'")
        return

    # 3. Leer Excel
    try:
        print(f"Reading {excel_path}...")
        df = pd.read_excel(excel_path)
        
        # Verificar columnas necesarias
        required_cols = ['serial', 'descripcion_molde']
        if not all(col in df.columns for col in required_cols):
            print(f"❌ Error: El Excel debe tener las columnas {required_cols}")
            return

        print(f"✅ Se encontraron {len(df)} registros para procesar.")

        # 4. Procesar actualizaciones
        success_count = 0
        error_count = 0

        for index, row in df.iterrows():
            serial = str(row['serial']).strip()
            descripcion = str(row['descripcion_molde']).strip()

            if not serial or serial == 'nan':
                continue

            # PATCH request a Supabase
            update_url = f"{url}/rest/v1/moldes?serial=eq.{serial}"
            headers = {
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
            
            payload = {
                "descripcion_molde": descripcion
            }

            try:
                response = requests.patch(update_url, headers=headers, json=payload)
                if response.status_code in [200, 204]:
                    success_count += 1
                else:
                    print(f"⚠️ Error actualizando serial {serial}: {response.status_code} - {response.text}")
                    error_count += 1
            except Exception as e:
                print(f"❌ Excepción en serial {serial}: {e}")
                error_count += 1

            if (index + 1) % 50 == 0:
                print(f"Procesados: {index + 1}/{len(df)}...")

        print("\n--- Resumen Final ---")
        print(f"✅ Actualizaciones exitosas: {success_count}")
        print(f"❌ Errores: {error_count}")
        print("----------------------")

    except Exception as e:
        print(f"❌ Error al procesar el Excel: {e}")

if __name__ == "__main__":
    # Verificar si pandas esta instalado
    try:
        import pandas
        import openpyxl
    except ImportError:
        print("📦 Instalando dependencias necesarias (pandas, openpyxl)...")
        os.system("pip install pandas openpyxl requests python-dotenv")
    
    populate_descriptions()
