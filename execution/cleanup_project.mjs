import fs from 'fs';
import path from 'path';

const rootPatterns = [
    'sql_chunk_*.sql',
    'tmp_*',
    'test_*',
    'check_*',
    'build_output*',
    'build_v*',
    'build_utf8.txt',
    'table_inspect*',
    'inspect_schema*',
    'inspect_raw.txt',
    'inspect_utf8.txt',
    'output.txt',
    'output_dates.txt',
    'test.txt',
    'conflicts.txt',
    'mp_info_final.txt',
    'Git-2.53.0-64-bit.exe',
    'verify_import*',
    'detect_raw_mats.mjs',
    'get_cols*',
    'check_mp.mjs',
    'update_moldes_batch.sql',
    'insert_missing_moldes.sql',
    'insert_tipos_moldes.sql',
    'test_name.mjs',
    'test_personnel.mjs',
    'test_roles.mjs',
    'test_sap.mjs',
    'test_supabase.mjs',
    'test_tables.mjs',
    'inspect_schema.mjs',
    'inspect_schema_full.mjs'
];

const dirsToClear = ['scratch', 'tmp'];

function cleanup() {
    console.log('--- Starting Cleanup ---');

    const rootFiles = fs.readdirSync('.');
    
    rootFiles.forEach(file => {
        const isMatch = rootPatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
                return regex.test(file);
            }
            return file === pattern;
        });

        if (isMatch) {
            const fullPath = path.join('.', file);
            try {
                if (fs.statSync(fullPath).isFile()) {
                    fs.unlinkSync(fullPath);
                    console.log(`Deleted file: ${file}`);
                }
            } catch (err) {
                console.error(`Error deleting ${file}: ${err.message}`);
            }
        }
    });

    dirsToClear.forEach(dir => {
        const dirPath = path.join('.', dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            console.log(`Cleaning directory: ${dir}`);
            const files = fs.readdirSync(dirPath);
            files.forEach(file => {
                const fullPath = path.join(dirPath, file);
                try {
                    if (fs.statSync(fullPath).isFile()) {
                        fs.unlinkSync(fullPath);
                        console.log(`Deleted from ${dir}: ${file}`);
                    } else if (fs.statSync(fullPath).isDirectory()) {
                        fs.rmSync(fullPath, { recursive: true, force: true });
                        console.log(`Deleted dir from ${dir}: ${file}`);
                    }
                } catch (err) {
                    console.error(`Error deleting ${fullPath}: ${err.message}`);
                }
            });
        }
    });

    console.log('--- Cleanup Finished ---');
}

cleanup();
