with open('update_moldes_batch.sql', 'r', encoding='utf-8') as f:
    lines = [l.strip() for l in f.readlines() if 'UPDATE' in l]

chunk_size = 100
for i in range(0, len(lines), chunk_size):
    chunk = lines[i:i+chunk_size]
    filename = f'sql_chunk_{i//100}.sql'
    with open(filename, 'w', encoding='utf-8') as cf:
        cf.write('BEGIN;\n')
        cf.write('\n'.join(chunk))
        cf.write('\nCOMMIT;')
    print(f'Created {filename} with {len(chunk)} updates')
