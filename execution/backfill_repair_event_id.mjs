import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CONFIGURATION
 */
const DRY_RUN = false; // Default to true as requested
const START_OFFSET = 0; // Allow resuming from a specific record
const PAGE_SIZE = 500; 
const TARGET_TABLE = 'base_datos_historico_moldes';
const SYNC_TABLE = 'BD_moldes';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * UTILS
 */
function normalize(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim().toLowerCase().replace(/\s+/g, ' ');
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) str = str.substring(0, 10);
  return str;
}

function getEventKey(r) {
  const c = r.codigo_molde || r["CODIGO MOLDE"];
  const fe = r.fecha_entrada || r["FECHA ENTRADA"];
  const tr = r.tipo_de_reparacion || r["Tipo de reparacion"];
  const dr = r.defectos_a_reparar || r["DEFECTOS A REPARAR"];
  
  if (!c || !fe) return null;
  return `${normalize(c)}|${normalize(fe)}|${normalize(tr)}|${normalize(dr)}`;
}

/**
 * Generates a deterministic UUID based on a string key.
 * This allows us to process records in pages without keeping all IDs in memory,
 * while ensuring that records with the same "event key" get the same ID.
 */
function generateDeterministicUUID(key) {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  // Format as UUID: 8-4-4-4-12
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
}

async function backfill() {
  console.log('--------------------------------------------------');
  console.log('🚀 MASSIVE BACKFILL V2 (Memory Efficient)');
  console.log(`Dry Run: ${DRY_RUN}`);
  console.log(`Start Offset: ${START_OFFSET}`);
  console.log('--------------------------------------------------');

  let offset = START_OFFSET;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let errors = 0;

  try {
    let hasMore = true;
    while (hasMore) {
      console.log(`\nFetching page at offset ${offset}...`);
      const { data, error } = await supabase
        .from(TARGET_TABLE)
        .select('id, codigo_molde, fecha_entrada, tipo_de_reparacion, defectos_a_reparar, repair_event_id')
        .range(offset, offset + PAGE_SIZE - 1)
        .order('id', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing ${data.length} records...`);
      
      // Calculate deterministic IDs for all records with valid IDs
      const updates = data
        .filter(r => r.id !== null)
        .map(r => {
          const key = getEventKey(r);
          if (!key) return null;
          const targetId = generateDeterministicUUID(key);
          
          // Only update if it doesn't match the deterministic one (or is missing)
          if (r.repair_event_id !== targetId) {
            return { id: r.id, repair_event_id: targetId };
          }
          return null;
        })
        .filter(u => u !== null);

      if (updates.length > 0) {
        if (!DRY_RUN) {
          // Perform updates in parallel chunks
          const chunkSize = 20;
          for (let i = 0; i < updates.length; i += chunkSize) {
            const batch = updates.slice(i, i + chunkSize);
            const promises = batch.map(u => 
              supabase.from(TARGET_TABLE).update({ repair_event_id: u.repair_event_id }).eq('id', u.id)
            );
            const results = await Promise.all(promises);
            results.forEach(res => { if (res.error) { console.error('Update Error:', res.error); errors++; } });
            totalUpdated += batch.length;
          }
        } else {
          console.log(`[DRY RUN] Would update/overwrite ${updates.length} records in ${TARGET_TABLE}`);
          totalUpdated += updates.length;
        }
      }

      totalProcessed += data.length;
      offset += PAGE_SIZE;
      
      console.log(`Progress: Total Processed: ${totalProcessed} | Total Updates: ${totalUpdated} | Errors: ${errors}`);
      
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      }
    }

    console.log('\n--------------------------------------------------');
    console.log('✅ PHASE 1 COMPLETE: Historico Backfilled');
    
    // PHASE 2: SYNC BD_moldes
    console.log('\nPHASE 2: Syncing BD_moldes...');
    const { data: bdData, error: bdError } = await supabase
      .from(SYNC_TABLE)
      .select('id, "CODIGO MOLDE", "FECHA ENTRADA", "Tipo de reparacion", "DEFECTOS A REPARAR", repair_event_id');
    
    if (bdError) throw bdError;

    let bdUpdates = 0;
    for (const r of bdData) {
      const key = getEventKey(r);
      if (!key) continue;
      const targetId = generateDeterministicUUID(key);
      
      if (r.repair_event_id !== targetId) {
        if (!DRY_RUN) {
          const { error: upErr } = await supabase.from(SYNC_TABLE).update({ repair_event_id: targetId }).eq('id', r.id);
          if (upErr) console.error(`Sync error for BD_moldes ID ${r.id}:`, upErr.message);
          else bdUpdates++;
        } else {
          bdUpdates++;
        }
      }
    }
    console.log(`[${DRY_RUN ? 'DRY RUN' : 'SUCCESS'}] BD_moldes synced: ${bdUpdates} records.`);

    // FINAL VALIDATION
    console.log('\nPHASE 3: Final Validation...');
    const { count: finalNoId } = await supabase.from(TARGET_TABLE).select('id', { count: 'exact', head: true }).is('repair_event_id', null);
    console.log(`Records remaining without ID in history: ${finalNoId}`);
    
    console.log('--------------------------------------------------');
    console.log('🏁 BACKFILL PROCESS FINISHED');
    console.log('--------------------------------------------------');

  } catch (err) {
    console.error('\n❌ FATAL ERROR:');
    console.error(err.message || err);
    process.exit(1);
  }
}

backfill();
