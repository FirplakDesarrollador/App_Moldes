import pandas as pd
import uuid

def main():
    try:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
    except Exception:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')
    
    df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]
    
    # Generate 1_run_this_in_supabase.sql
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\execution\1_run_this_in_supabase.sql', 'w', encoding='utf-8') as f_tipos:
        f_tipos.write("DO $$\n")
        f_tipos.write("DECLARE\n")
        f_tipos.write("    new_uuid text;\n")
        f_tipos.write("BEGIN\n")
        
        seen_tipos = set()
        for idx, row in df.iterrows():
            nombre_articulo = str(row.get('Número de artículo', '')).strip()
            nombre_upper = nombre_articulo.upper()
            
            if nombre_articulo and nombre_upper != 'NAN' and nombre_upper not in seen_tipos:
                seen_tipos.add(nombre_upper)
                
                planta = str(row.get('Planta', 'MS')).strip().upper()
                planta_enum = 'Marmol_sintetico'
                if planta == 'FV':
                    planta_enum = 'Fibra_de_vidrio'
                
                safe_name = nombre_articulo.replace("'", "''")
                sku = f"GEN-{uuid.uuid4().hex[:8].upper()}"
                
                f_tipos.write(f"    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('{safe_name}')) THEN\n")
                f_tipos.write(f"        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('{safe_name}', '{planta_enum}', '{sku}');\n")
                f_tipos.write("    END IF;\n")
                
        f_tipos.write("END $$;\n")


    # Generate 2_run_this_in_supabase.sql
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\execution\2_run_this_in_supabase.sql', 'w', encoding='utf-8') as f_moldes:
        for idx, row in df.iterrows():
            serial = str(row.get('Número de serie', '')).strip()
            if not serial or serial == 'nan':
                continue
            
            nombre_articulo = str(row.get('Número de artículo', '')).strip()
            if not nombre_articulo or nombre_articulo.upper() == 'NAN':
                continue
                
            estado_raw = ""
            if 'Estado Molde' in df.columns and str(row['Estado Molde']) != 'nan':
                 estado_raw = str(row['Estado Molde']).strip()
            elif 'Estado' in df.columns and str(row['Estado']) != 'nan':
                 estado_raw = str(row['Estado']).strip()
                 
            if estado_raw == "Activo":
                estado = "En uso"
            elif estado_raw == "Inactivo":
                estado = "Indefinido"
            elif estado_raw == "Mantenimiento":
                estado = "En reparacion"
            elif estado_raw == "Destruido":
                estado = "Destruido"
            else:
                estado = "Indefinido"
                     
            vueltas_str = str(row.get('Vueltas MTO', '0'))
            vueltas = 0
            if vueltas_str != 'nan' and vueltas_str.isdigit():
                vueltas = int(vueltas_str)

            safe_serial = serial.replace("'", "''")
            safe_name = nombre_articulo.replace("'", "''")

            sql = (
                f"INSERT INTO public.moldes (serial, nombre_articulo, estado, vueltas_actuales, tipo_molde_id) "
                f"VALUES ('{safe_serial}', '{safe_name}', '{estado}', {vueltas}, "
                f"(SELECT id FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('{safe_name}') LIMIT 1)) "
                f"ON CONFLICT (serial) DO NOTHING;\n"
            )
            f_moldes.write(sql)

if __name__ == "__main__":
    main()
