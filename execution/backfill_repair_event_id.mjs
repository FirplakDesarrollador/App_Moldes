import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuration
const BATCH_SIZE = 500; // Records to fetch per request
const UPDATE_BATCH_SIZE = 50; // Groups to update per request (to avoid URL length limits or timeouts)

function normalize(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim().toLowerCase().replace(/\s+/g, ' ');
  // If it looks like a timestamp, just take the date part
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) str = str.substring(0, 10);
  return str;
}

function getEventKey(r) {
  // Key logic: Code + Entry Date + Type + Defects
  // This defines a unique repair event in the system
  const c = r.codigo_molde || r["CODIGO MOLDE"];
  const fe = r.fecha_entrada || r["FECHA ENTRADA"];
  const tr = r.tipo_de_reparacion || r["Tipo de reparacion"];
  const dr = r.defectos_a_reparar || r["DEFECTOS A REPARAR"];
  
  if (!c || !fe) return null;
  return `${normalize(c)}|${normalize(fe)}|${normalize(tr)}|${normalize(dr)}`;
}

async function runBackfill() {
  console.log('🚀 Starting Massive Backfill for repair_event_id...');
  console.log('--------------------------------------------------');

  try {
    // 1. Fetch all historical records
    console.log('1. Fetching all historical records...');
    let histData = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('base_datos_historico_moldes')
        .select('id, codigo_molde, fecha_entrada, tipo_de_reparacion, defectos_a_reparar, repair_event_id')
        .range(start, start + BATCH_SIZE - 1);

      if (error) throw error;
      if (data.length === 0) {
        hasMore = false;
      } else {
        histData = histData.concat(data);
        start += BATCH_SIZE;
        process.stdout.write(`Fetched ${histData.length} records...\r`);
      }
    }
    console.log(`\n✅ Fetched ${histData.length} total records from history.`);

    // 2. Group records by event key
    console.log('\n2. Grouping records into events...');
    const eventGroups = {};
    const keyToUuid = new Map();

    histData.forEach(r => {
      const key = getEventKey(r);
      if (!key) return;

      if (!eventGroups[key]) {
        eventGroups[key] = [];
        // Use existing repair_event_id if available, otherwise generate new
        if (r.repair_event_id) {
            keyToUuid.set(key, r.repair_event_id);
        } else if (!keyToUuid.has(key)) {
            keyToUuid.set(key, crypto.randomUUID());
        }
      }
      // Only add to update list if it doesn't have the ID yet AND has a valid ID
      if (!r.repair_event_id && r.id !== null) {
          eventGroups[key].push(r.id);
      } else if (r.id === null) {
          // Log or handle records with missing IDs
          // console.warn(`Record found with NULL id. Key: ${key}`);
      }
    });

    const groupsToUpdate = Object.keys(eventGroups).filter(k => eventGroups[k].length > 0);
    console.log(`✅ Identified ${groupsToUpdate.length} events needing updates.`);

    // 3. Update History in batches
    console.log('\n3. Updating historical records...');
    let totalUpdatedHist = 0;
    
    for (let i = 0; i < groupsToUpdate.length; i += UPDATE_BATCH_SIZE) {
      const batchKeys = groupsToUpdate.slice(i, i + UPDATE_BATCH_SIZE);
      
      // Update each group in the batch
      // Note: Supabase doesn't support bulk update with different values per row easily in one call
      // So we do them in parallel batches
      const promises = batchKeys.map(key => {
          const uuid = keyToUuid.get(key);
          const ids = eventGroups[key];
          return supabase
            .from('base_datos_historico_moldes')
            .update({ repair_event_id: uuid })
            .in('id', ids)
            .then(({ error }) => {
                if (error) throw error;
                return ids.length;
            });
      });

      const results = await Promise.all(promises);
      totalUpdatedHist += results.reduce((a, b) => a + b, 0);
      
      const progress = Math.min(100, ((i + batchKeys.length) / groupsToUpdate.length) * 100).toFixed(1);
      process.stdout.write(`Progress: ${progress}% (${totalUpdatedHist} records updated)\r`);
    }
    console.log(`\n✅ History update complete. Total rows updated: ${totalUpdatedHist}`);

    // 4. Sync BD_moldes (Active records)
    console.log('\n4. Syncing BD_moldes (Active records)...');
    const { data: bdData, error: bdError } = await supabase
      .from('BD_moldes')
      .select('id, "CODIGO MOLDE", "FECHA ENTRADA", "Tipo de reparacion", "DEFECTOS A REPARAR", repair_event_id');
    
    if (bdError) throw bdError;

    let totalUpdatedBD = 0;
    for (const r of bdData) {
      const key = getEventKey(r);
      const targetUuid = keyToUuid.get(key);

      if (targetUuid && r.repair_event_id !== targetUuid) {
        const { error: upError } = await supabase
          .from('BD_moldes')
          .update({ repair_event_id: targetUuid })
          .eq('id', r.id);
        
        if (upError) {
          console.error(`Error updating BD_moldes record ${r.id}:`, upError.message);
        } else {
          totalUpdatedBD++;
        }
      }
    }
    console.log(`✅ BD_moldes sync complete. Total rows updated: ${totalUpdatedBD}`);

    // 5. Final Validation
    console.log('\n5. Final Validation Check...');
    
    const { count: withIdHist } = await supabase
      .from('base_datos_historico_moldes')
      .select('id', { count: 'exact', head: true })
      .not('repair_event_id', 'is', null);

    const { count: withoutIdHist } = await supabase
      .from('base_datos_historico_moldes')
      .select('id', { count: 'exact', head: true })
      .is('repair_event_id', null);

    const { count: withIdBD } = await supabase
      .from('BD_moldes')
      .select('id', { count: 'exact', head: true })
      .not('repair_event_id', 'is', null);

    const { count: withoutIdBD } = await supabase
      .from('BD_moldes')
      .select('id', { count: 'exact', head: true })
      .is('repair_event_id', null);

    console.log('--------------------------------------------------');
    console.log('📊 BACKFILL SUMMARY REPORT');
    console.log('--------------------------------------------------');
    console.log(`Historical records with repair_event_id:    ${withIdHist}`);
    console.log(`Historical records WITHOUT repair_event_id: ${withoutIdHist}`);
    console.log(`BD_moldes records with repair_event_id:      ${withIdBD}`);
    console.log(`BD_moldes records WITHOUT repair_event_id:   ${withoutIdBD}`);
    console.log('--------------------------------------------------');
    
    if (withoutIdHist === 0) {
      console.log('✅ SUCCESS: All historical records have been processed.');
    } else {
      console.log('⚠️ WARNING: Some historical records still missing IDs. Check logic.');
    }

    if (withoutIdBD === 0) {
        console.log('✅ SUCCESS: All active records are synchronized.');
    } else {
        console.log('ℹ️ Note: Some active records might not have historical counterparts.');
    }

  } catch (err) {
    console.error('\n❌ CRITICAL ERROR DURING BACKFILL:');
    console.error(err.message || err);
    process.exit(1);
  }
}

runBackfill();
