-- ============================================================
-- TRIGGER SQL: Sincronización automática BD_moldes → moldes
-- ============================================================
--
-- MAPEO (en orden de prioridad):
--   BD_moldes                                → moldes.estado
--   ──────────────────────────────────────     ──────────────────────
--   ESTADO contiene 'entregado'              → 'Disponible'      (prioridad 1)
--   DEFECTOS contiene 'desmanch'             → 'Por desmanchar'  (prioridad 2)
--   ESTADO contiene 'reparacion' / 'espera'  → 'En reparacion'   (prioridad 3)
--   ESTADO contiene 'destruido'              → 'Destruido'       (prioridad 4)
--   Cualquier otro                           → No hace nada
--
-- CÓMO EJECUTAR:
--   Supabase → SQL Editor → pegar todo → Run
--   (Ejecutar ANTES de trigger_auto_desmanchado.sql)
-- ============================================================


-- ── PASO 1: Agregar 'Por desmanchar' al enum si no existe ────

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

    -- PRIORIDAD 1: Entregado → Disponible (siempre gana, independiente del defecto)
    IF v_estado_bd ILIKE '%entregado%' THEN
        v_estado_destino := 'Disponible';

    -- PRIORIDAD 2: Defecto 'Desmanchado' → Por desmanchar
    ELSIF v_defecto_bd ILIKE '%desmanch%' THEN
        v_estado_destino := 'Por desmanchar';

    -- PRIORIDAD 3: En reparacion / En espera → En reparacion
    ELSIF v_estado_bd ILIKE '%reparacion%'
       OR v_estado_bd ILIKE '%reparación%'
       OR v_estado_bd ILIKE '%espera%' THEN
        v_estado_destino := 'En reparacion';

    -- PRIORIDAD 4: Destruido
    ELSIF v_estado_bd ILIKE '%destruido%' THEN
        v_estado_destino := 'Destruido';

    ELSE
        RETURN NEW;
    END IF;

    -- Cast explícito necesario porque moldes.estado es enum estado_molde_type
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


-- ── PASO 3: Recrear trigger en BD_moldes ─────────────────────

DROP TRIGGER IF EXISTS trg_sync_moldes_estado ON public."BD_moldes";

CREATE TRIGGER trg_sync_moldes_estado
AFTER INSERT OR UPDATE OF "ESTADO", "DEFECTOS A REPARAR"
ON public."BD_moldes"
FOR EACH ROW
EXECUTE FUNCTION sync_moldes_estado();


-- ── PASO 4: Corregir moldes existentes desincronizados ───────
-- Pone 'Por desmanchar' a moldes que ya tienen defecto 'Desmanchado' activo

UPDATE public.moldes m
SET    estado = 'Por desmanchar'::estado_molde_type
FROM   public."BD_moldes" b
WHERE  LOWER(TRIM(m.serial)) = LOWER(TRIM(b."CODIGO MOLDE"))
  AND  b."DEFECTOS A REPARAR" ILIKE '%desmanch%'
  AND  b."ESTADO" NOT ILIKE '%entregado%'
  AND  m.estado <> 'Por desmanchar'::estado_molde_type;


-- ── VALIDACIÓN MANUAL ────────────────────────────────────────
/*
SELECT
    b."CODIGO MOLDE"        AS codigo,
    b."ESTADO"              AS bd_estado,
    b."DEFECTOS A REPARAR"  AS defecto,
    b."Tipo de reparacion"  AS tipo,
    m.estado::text          AS moldes_estado,
    CASE
        WHEN b."ESTADO" ILIKE '%entregado%'  AND m.estado = 'Disponible'     THEN 'OK'
        WHEN b."DEFECTOS A REPARAR" ILIKE '%desmanch%' AND m.estado = 'Por desmanchar' THEN 'OK'
        WHEN b."ESTADO" ILIKE '%reparacion%' AND m.estado = 'En reparacion'  THEN 'OK'
        ELSE 'DESINCRONIZADO'
    END AS sincronizado
FROM public."BD_moldes" b
JOIN public.moldes m ON LOWER(TRIM(m.serial)) = LOWER(TRIM(b."CODIGO MOLDE"))
WHERE b."DEFECTOS A REPARAR" ILIKE '%desmanch%'
ORDER BY b."CODIGO MOLDE";
*/
