import os
import pandas as pd
import requests
from dotenv import load_dotenv
from pathlib import Path

def populate_item_names():
    # 1. Cargar variables de entorno
    load_dotenv()
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not key:
        key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        print("❌ Error: No se encontraron las credenciales en el archivo .env")
        return

    # 2. Ruta del archivo Excel original
    excel_path = Path("data/Base de datos Listado moldes origen.xlsx")
    
    if not excel_path.exists():
        print(f"❌ Error: El archivo {excel_path} no existe.")
        return

    # 3. Leer Excel
    try:
        print(f"Reading {excel_path}...")
        # Leemos el excel. El usuario mencionó "Número de artículo" para el contenido.
        # Necesitamos también una columna para identificar el molde (usualmente 'Número de serie' o similar que mapee al 'serial' en DB)
        df = pd.read_excel(excel_path)
        
        # Columnas detectadas en el Excel según el contexto previo de la tabla 'Listado moldes s':
        # "Número de serie" mapea a "serial" en la tabla "moldes"
        # "Número de artículo" es lo que queremos guardar en "nombre_articulo"
        
        serial_col = "Número de serie"
        item_col = "Número de artículo"
        
        if serial_col not in df.columns or item_col not in df.columns:
            print(f"❌ Error: El Excel debe tener las columnas '{serial_col}' y '{item_col}'")
            print(f"Columnas encontradas: {list(df.columns)}")
            return

        print(f"✅ Se encontraron {len(df)} registros para procesar.")

        # 4. Procesar actualizaciones
        success_count = 0
        error_count = 0

        for index, row in df.iterrows():
            serial = str(row[serial_col]).strip()
            nombre_articulo = str(row[item_col]).strip()

            if not serial or serial == 'nan' or serial == '':
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
                "nombre_articulo": nombre_articulo
            }

            try:
                response = requests.patch(update_url, headers=headers, json=payload)
                if response.status_code in [200, 204]:
                    success_count += 1
                else:
                    # Opcional: imprimir error solo si falla
                    # print(f"⚠️ No se pudo actualizar serial {serial}: {response.status_code}")
                    error_count += 1
            except Exception as e:
                error_count += 1

            if (index + 1) % 100 == 0:
                print(f"Procesados: {index + 1}/{len(df)}...")

        print("\n--- Resumen Final ---")
        print(f"✅ Actualizaciones exitosas: {success_count}")
        print(f"❌ No encontrados/Errores: {error_count}")
        print("----------------------")

    except Exception as e:
        import traceback
        print(f"❌ Error al procesar el Excel: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    populate_item_names()
