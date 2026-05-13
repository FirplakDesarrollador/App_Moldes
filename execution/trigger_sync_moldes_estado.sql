-- ============================================================
-- TRIGGER SQL: Sincronización automática BD_moldes → moldes
-- ============================================================
--
-- MAPEO DE ESTADO:
--   BD_moldes.DEFECTOS A REPARAR / ESTADO    → moldes.estado
--   ──────────────────────────────────────     ──────────────────────
--   'Límite de vueltas alcanzado' (defecto)  → 'Por desmanchar'  ← PRIORIDAD
--   'En reparacion' (variantes)              → 'En reparacion'
--   'En espera - Moldes/Produccion'          → 'En reparacion'
--   'Entregado'                              → 'Disponible'
--   'Destruido'                              → 'Destruido'
--   Cualquier otro                           → No hace nada (seguro)
--
-- CÓMO EJECUTAR:
--   1. Ir a Supabase → SQL Editor
--   2. Pegar este script completo
--   3. Ejecutar (Run)
-- ============================================================


-- ── PASO 1: Agregar 'Por desmanchar' al enum si no existe ────
-- (seguro ejecutar aunque ya exista)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'public.estado_molde_type'::regtype
          AND enumlabel = 'Por desmanchar'
    ) THEN
        ALTER TYPE public.estado_molde_type ADD VALUE 'Por desmanchar';
    END IF;
END
$$;


-- ── PASO 2: Función del trigger ──────────────────────────────

CREATE OR REPLACE FUNCTION sync_moldes_estado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_codigo_molde   TEXT;
    v_estado_bd      TEXT;
    v_defecto_bd     TEXT;
    v_estado_destino TEXT;
BEGIN
    v_codigo_molde := TRIM(NEW."CODIGO MOLDE");
    v_estado_bd    := LOWER(TRIM(COALESCE(NEW."ESTADO", '')));
    v_defecto_bd   := LOWER(TRIM(COALESCE(NEW."DEFECTOS A REPARAR", '')));

    -- PRIORIDAD 1: Defecto "Límite de vueltas alcanzado" → Por desmanchar
    IF v_defecto_bd ILIKE '%limite%vueltas%'
    OR v_defecto_bd ILIKE '%límite%vueltas%' THEN
        v_estado_destino := 'Por desmanchar';

    -- PRIORIDAD 2: Mapeo por ESTADO
    ELSIF v_estado_bd ILIKE '%entregado%' THEN
        v_estado_destino := 'Disponible';

    ELSIF v_estado_bd ILIKE '%reparacion%'
       OR v_estado_bd ILIKE '%reparación%'
       OR v_estado_bd ILIKE '%espera%' THEN
        v_estado_destino := 'En reparacion';

    ELSIF v_estado_bd ILIKE '%destruido%' THEN
        v_estado_destino := 'Destruido';

    ELSE
        RETURN NEW;
    END IF;

    -- Cast explícito a estado_molde_type porque moldes.estado es un enum
    UPDATE public.moldes
    SET    estado = v_estado_destino::estado_molde_type
    WHERE  LOWER(TRIM(serial)) = LOWER(v_codigo_molde)
      AND  estado <> v_estado_destino::estado_molde_type;

    IF FOUND THEN
        RAISE LOG '[sync_moldes_estado] % → moldes.estado = "%" (defecto: "%")',
            v_codigo_molde, v_estado_destino, NEW."DEFECTOS A REPARAR";
    END IF;

    RETURN NEW;
END;
$$;


-- ── PASO 3: Eliminar trigger anterior y recrear ──────────────

DROP TRIGGER IF EXISTS trg_sync_moldes_estado ON public."BD_moldes";

CREATE TRIGGER trg_sync_moldes_estado
AFTER INSERT OR UPDATE OF "ESTADO", "DEFECTOS A REPARAR"
ON public."BD_moldes"
FOR EACH ROW
EXECUTE FUNCTION sync_moldes_estado();


-- ── PASO 4: Sincronizar moldes existentes con "Límite de vueltas" ──

UPDATE public.moldes m
SET    estado = 'Por desmanchar'::estado_molde_type
FROM   public."BD_moldes" b
WHERE  LOWER(TRIM(m.serial)) = LOWER(TRIM(b."CODIGO MOLDE"))
  AND  (b."DEFECTOS A REPARAR" ILIKE '%limite%vueltas%'
     OR b."DEFECTOS A REPARAR" ILIKE '%límite%vueltas%')
  AND  m.estado <> 'Por desmanchar'::estado_molde_type;


-- ── VALIDACIÓN MANUAL ────────────────────────────────────────
/*
SELECT
    b."CODIGO MOLDE"        AS codigo,
    b."ESTADO"              AS bd_estado,
    b."DEFECTOS A REPARAR"  AS defecto,
    m.estado                AS moldes_estado,
    CASE
        WHEN (b."DEFECTOS A REPARAR" ILIKE '%limite%vueltas%')
             AND m.estado = 'Por desmanchar' THEN '✅ OK'
        WHEN b."ESTADO" ILIKE '%reparacion%' AND m.estado = 'En reparacion' THEN '✅ OK'
        WHEN b."ESTADO" ILIKE '%entregado%'  AND m.estado = 'Disponible'    THEN '✅ OK'
        ELSE '❌ DESINCRONIZADO'
    END AS sincronizado
FROM public."BD_moldes" b
JOIN public.moldes m ON LOWER(TRIM(m.serial)) = LOWER(TRIM(b."CODIGO MOLDE"))
WHERE b."DEFECTOS A REPARAR" ILIKE '%limite%vueltas%'
ORDER BY b."CODIGO MOLDE";
*/
