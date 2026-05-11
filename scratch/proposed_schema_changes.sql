
-- SQL PROPUESTO PARA IMPLEMENTACIÓN DE REPAIR_EVENT_ID
-- No ejecutar todavía

-- 1. Agregar columna en tabla operativa
ALTER TABLE "BD_moldes" ADD COLUMN "repair_event_id" UUID;

-- 2. Agregar columna en tabla histórica
ALTER TABLE "base_datos_historico_moldes" ADD COLUMN "repair_event_id" UUID;

-- 3. Crear índice para optimizar la deduplicación en indicadores
CREATE INDEX IF NOT EXISTS idx_hist_repair_event ON "base_datos_historico_moldes" ("repair_event_id");
