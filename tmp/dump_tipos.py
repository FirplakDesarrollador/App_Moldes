import json
import urllib.request
import sys

def execute_mcp_sql(sql_str):
    url = 'http://localhost:5163'
    payload = {
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'tools/call',
        'params': {
            'name': 'execute_sql',
            'arguments': {
                'project_id': 'vuiuorjzonpyobpelyld',
                'query': sql_str
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
                return False, res["error"]
            elif 'result' in res and res['result'].get('isError'):
                 return False, res["result"]
            return True, res["result"]["text"]
    except Exception as e:
        return False, str(e)

success, res = execute_mcp_sql("SELECT id, molde_descripcion FROM public.tipos_moldes")
if success:
    with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\tmp\tipos_moldes_dump.json', 'w', encoding='utf-8') as f:
        f.write(res)
    print("Downloaded tipos_moldes mapping via MCP.")
else:
    print(f"Failed: {res}")
