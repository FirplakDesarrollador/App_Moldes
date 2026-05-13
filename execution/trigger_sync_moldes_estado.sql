-- ============================================================
-- TRIGGER SQL: Sincronización automática BD_moldes → moldes
-- ============================================================
--
-- PROPÓSITO:
--   Cada vez que se inserta o actualiza un registro en BD_moldes,
--   este trigger actualiza el campo 'estado' en la tabla maestra 'moldes'
--   usando el mapeo de negocio definido.
--
-- MAPEO DE ESTADO:
--   BD_moldes.ESTADO / DEFECTOS A REPARAR  → moldes.estado
--   ──────────────────────────────────────   ─────────────────────
--   'Límite de vueltas alcanzado' (defecto) → 'En reparacion'  ← PRIORIDAD
--   'En reparacion' (variantes)             → 'En reparacion'
--   'En espera - Moldes'                    → 'En reparacion'
--   'En espera - Produccion'                → 'En reparacion'
--   'Entregado'                             → 'Disponible'
--   'Destruido'                             → 'Destruido'
--   Cualquier otro                          → No hace nada (seguro)
--
-- CÓMO EJECUTAR:
--   1. Ir a Supabase → SQL Editor
--   2. Pegar este script completo
--   3. Ejecutar (Run)
--   El trigger quedará activo permanentemente.
-- ============================================================


-- ── PASO 1: Función del trigger ──────────────────────────────

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
    -- Obtener código, estado y defecto del registro nuevo/modificado
    v_codigo_molde := TRIM(NEW."CODIGO MOLDE");
    v_estado_bd    := LOWER(TRIM(COALESCE(NEW."ESTADO", '')));
    v_defecto_bd   := LOWER(TRIM(COALESCE(NEW."DEFECTOS A REPARAR", '')));

    -- PRIORIDAD 1: Defecto "Límite de vueltas alcanzado" → siempre En reparacion
    IF v_defecto_bd ILIKE '%limite%vueltas%'
    OR v_defecto_bd ILIKE '%límite%vueltas%' THEN
        v_estado_destino := 'En reparacion';

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
        -- Estado no mapeado: no hacer nada, preservar integridad
        RETURN NEW;
    END IF;

    -- Actualizar tabla maestra 'moldes' si el código existe
    -- Cast explícito a estado_molde_type porque moldes.estado es un enum
    UPDATE public.moldes
    SET    estado = v_estado_destino::estado_molde_type
    WHERE  LOWER(TRIM(serial)) = LOWER(v_codigo_molde)
      AND  estado <> v_estado_destino::estado_molde_type;

    -- Log en consola de Postgres (visible en Supabase Logs)
    IF FOUND THEN
        RAISE LOG '[sync_moldes_estado] % → moldes.estado = "%" (defecto: "%")',
            v_codigo_molde, v_estado_destino, NEW."DEFECTOS A REPARAR";
    END IF;

    RETURN NEW;
END;
$$;


-- ── PASO 2: Eliminar trigger anterior si existía ─────────────

DROP TRIGGER IF EXISTS trg_sync_moldes_estado ON public."BD_moldes";


-- ── PASO 3: Crear el trigger en BD_moldes ───────────────────
-- Ahora escucha también cambios en "DEFECTOS A REPARAR"

CREATE TRIGGER trg_sync_moldes_estado
AFTER INSERT OR UPDATE OF "ESTADO", "DEFECTOS A REPARAR"
ON public."BD_moldes"
FOR EACH ROW
EXECUTE FUNCTION sync_moldes_estado();


-- ── PASO 4: Forzar sincronización de moldes con "Límite de vueltas" activos ──
-- Aplica el estado correcto a moldes que ya tienen ese defecto en BD_moldes

UPDATE public.moldes m
SET    estado = 'En reparacion'::estado_molde_type
FROM   public."BD_moldes" b
WHERE  LOWER(TRIM(m.serial)) = LOWER(TRIM(b."CODIGO MOLDE"))
  AND  b."DEFECTOS A REPARAR" ILIKE '%limite%vueltas%'
  AND  m.estado <> 'En reparacion'::estado_molde_type;


-- ── VALIDACIÓN MANUAL ────────────────────────────────────────
/*
SELECT
    b."CODIGO MOLDE"        AS codigo,
    b."ESTADO"              AS bd_estado,
    b."DEFECTOS A REPARAR"  AS defecto,
    m.estado                AS moldes_estado,
    CASE
        WHEN b."DEFECTOS A REPARAR" ILIKE '%limite%vueltas%' AND m.estado = 'En reparacion' THEN '✅ OK'
        WHEN b."ESTADO" ILIKE '%reparacion%' AND m.estado = 'En reparacion' THEN '✅ OK'
        WHEN b."ESTADO" ILIKE '%entregado%'  AND m.estado = 'Disponible'    THEN '✅ OK'
        ELSE '❌ DESINCRONIZADO'
    END AS sincronizado
FROM public."BD_moldes" b
JOIN public.moldes m ON LOWER(TRIM(m.serial)) = LOWER(TRIM(b."CODIGO MOLDE"))
WHERE b."DEFECTOS A REPARAR" ILIKE '%limite%vueltas%'
   OR b."CODIGO MOLDE" IN ('0124-49');
*/
