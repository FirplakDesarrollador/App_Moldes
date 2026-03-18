import pandas as pd
import json

def main():
    try:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
    except Exception:
        df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')
    
    df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]
    
    # We need to clean Numbero de serie similarly to how we did in generate_updates
    serials = df['Número de serie'].astype(str).str.strip().tolist()
    
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\tmp\csv_serials.json', 'w') as f:
        json.dump(serials, f)
    
    print(f"Total rows in CSV: {len(df)}")
    print("Columns available:")
    for col in df.columns:
        print(col)

if __name__ == "__main__":
    main()
