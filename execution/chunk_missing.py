# PV_MOLDES V2.4
import os

def chunk_file(input_file, output_prefix, lines_per_chunk=100):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Remove BEGIN and COMMIT if they exist as we're chunking
    if lines[0].strip() == "BEGIN;":
        lines = lines[1:]
    if lines[-1].strip() == "COMMIT;":
        lines = lines[:-1]
        
    chunk_idx = 0
    for i in range(0, len(lines), lines_per_chunk):
        chunk_lines = lines[i:i + lines_per_chunk]
        with open(f"{output_prefix}_{chunk_idx}.sql", 'w', encoding='utf-8') as f_out:
            f_out.writelines(chunk_lines)
        chunk_idx += 1
    
    print(f"Split {input_file} into {chunk_idx} chunks.")

chunk_file(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\insert_tipos_moldes.sql', r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\execution\tipos_chunk')
chunk_file(r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\insert_missing_moldes.sql', r'c:\Users\isaza\OneDrive\Documentos\APP MOLDES\execution\moldes_chunk')
