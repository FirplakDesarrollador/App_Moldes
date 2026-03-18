import pandas as pd

try:
    df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
except Exception:
    df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')

# Fix weird BOM character if exists in first column name
df.columns = [col.replace('ï»¿', '').replace('"', '') for col in df.columns]

print("--- CSV Columns ---")
for col in df.columns:
    print(f"- {col}")

print("\n--- Example Data (1 row) ---")
for col in df.columns:
    print(f"{col}: {df.iloc[0][col]}")
