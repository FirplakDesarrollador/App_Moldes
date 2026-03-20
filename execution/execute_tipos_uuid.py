# PV_MOLDES V2.4
import urllib.request
import json
import sys

url = 'http://localhost:5163'
f = r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\execution\insert_tipos_moldes_uuid.sql'

print(f'Running {f}')
with open(f, 'r', encoding='utf-8') as file:
    sql = file.read()

payload = {
    'jsonrpc': '2.0',
    'id': 1,
    'method': 'tools/call',
    'params': {
        'name': 'execute_sql',
        'arguments': {
            'project_id': 'vuiuorjzonpyobpelyld',
            'query': sql
        }
    }
}

try:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'content-type': 'application/json'}
    )
    with urllib.request.urlopen(req) as response:
        res_raw = response.read().decode('utf-8')
        res = json.loads(res_raw)
        if 'error' in res:
            print(f'Error in {f}: {res["error"]}')
            sys.exit(1)
        elif 'result' in res and res['result'].get('isError'):
             print(f'Tool Error in {f}: {res["result"]}')
             sys.exit(1)
        else:
            print(f'Success! MCP execution completed.')
except Exception as e:
    print(f'Failed to call MCP for {f}: {e}')
    sys.exit(1)
