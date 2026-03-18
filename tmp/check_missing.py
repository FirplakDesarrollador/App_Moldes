import pandas as pd

missing_serials = ["220-02","0081-07","220-01","221-02","221-01","0087-19","224-02","prueba-03","prueba-06","224-03","prueba-04","prueba-07","prueba-05","prueba-02","01024","prueba-08","224-04","224-01","224-05","prueba-01"]

try:
    df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='utf-8')
except UnicodeDecodeError:
    df = pd.read_csv(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\data\Listado Moldes.csv', encoding='latin1')

# Serial column name is 'Número de serie' based on previous context
found = df[df['Número de serie'].astype(str).isin(missing_serials)]
print("Found in CSV:")
print(found[['Número de serie', 'Número de artículo']])

# Also check for serials like '1024' (without leading zero)
found_no_zero = df[df['Número de serie'].astype(str).isin(["1024", "81-07"])]
print("\nFound (no leading zero) in CSV:")
print(found_no_zero[['Número de serie', 'Número de artículo']])
