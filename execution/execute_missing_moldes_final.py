# PV_MOLDES V2.4
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
            return True, "OK"
    except Exception as e:
        return False, str(e)

with open(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\insert_missing_moldes.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

batch_size = 50
current_batch = []
batch_num = 1
failed = 0
successes = 0

for line in lines:
    if line.strip() in ['BEGIN;', 'COMMIT;']:
        continue
    if line.strip():
        current_batch.append(line.strip())
        
    if len(current_batch) >= batch_size:
        sql = "BEGIN;\n" + "\n".join(current_batch) + "\nCOMMIT;"
        success, msg = execute_mcp_sql(sql)
        print(f"Batch {batch_num}: {'Success' if success else 'Failed'}")
        if not success:
            print(f"Error details: {msg}")
            failed += 1
        else:
            successes += 1
        current_batch = []
        batch_num += 1

if current_batch:
    sql = "BEGIN;\n" + "\n".join(current_batch) + "\nCOMMIT;"
    success, msg = execute_mcp_sql(sql)
    print(f"Batch {batch_num} (final): {'Success' if success else 'Failed'}")
    if not success:
        print(f"Error details: {msg}")
        failed += 1
    else:
         successes += 1

print(f"Finished. Success: {successes}, Failed: {failed}")

