# PV_MOLDES V2.4
import json

with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\execution\insert_tipos_moldes_uuid.sql', 'r', encoding='utf-8') as file:
    sql = file.read()

# I will pass this directly in the mcp execute_sql
print(sql[:200])
