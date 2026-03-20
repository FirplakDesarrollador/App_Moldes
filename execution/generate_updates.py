# PV_MOLDES V2.4
import pandas as pd
import os

def generate():
    csv_path = 'data/Listado Moldes.csv'
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found")
        return

    # Intentamos leer el CSV con UTF-8 o Latin-1
    try:
        df = pd.read_csv(csv_path, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(csv_path, encoding='latin-1')
    
    with open('update_moldes_batch.sql', 'w', encoding='utf-8') as f:
        f.write("BEGIN;\n")
        
        for index, row in df.iterrows():
            serial = str(row['Número de serie']).strip().replace("'", "''")
            nombre = str(row['Número de artículo']).strip().replace("'", "''")
            
            if serial and serial != 'nan' and serial != '':
                f.write(f"UPDATE public.moldes SET nombre_articulo = '{nombre}' WHERE serial = '{serial}';\n")
        
        f.write("COMMIT;\n")
    print(f"✅ SQL file generated: update_moldes_batch.sql with {len(df)} updates")

if __name__ == "__main__":
    generate()
