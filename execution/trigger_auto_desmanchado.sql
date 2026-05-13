-- ============================================================
-- TRIGGER SQL: Auto-desmanchado moldes → BD_moldes
-- ============================================================
--
-- PROPÓSITO:
--   Cuando vueltas_actuales en 'moldes' alcanza un múltiplo de
--   vueltas_desmanchado, inserta automáticamente un registro en
--   BD_moldes con ESTADO = 'En reparacion' y DEFECTO = 'Desmanchado'.
--   Esto dispara el trigger trg_sync_moldes_estado que actualiza
--   moldes.estado = 'En reparacion'.
--
-- CONDICIÓN DE DISPARO:
--   - vueltas_desmanchado > 0 (la funcionalidad está activa para ese molde)
--   - vueltas_actuales > 0
--   - vueltas_actuales % vueltas_desmanchado = 0  (múltiplo: cada N vueltas)
--   - estado actual NO es 'En reparacion' ni 'Destruido' (evita duplicados)
--
-- FLUJO COMPLETO:
--   1. Sistema incrementa moldes.vueltas_actuales
--   2. Este trigger detecta condición de desmanchado
--   3. Inserta en BD_moldes (ESTADO='En reparacion', DEFECTO='Desmanchado')
--   4. trg_sync_moldes_estado (trigger existente) actualiza moldes.estado
--
-- CÓMO EJECUTAR:
--   1. Ir a Supabase → SQL Editor
--   2. Pegar este script completo
--   3. Ejecutar (Run)
-- ============================================================


-- ── PASO 1: Función del trigger ──────────────────────────────

CREATE OR REPLACE FUNCTION auto_desmanchado_moldes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_vueltas_desmanch  INTEGER;
BEGIN
    -- Leer el umbral de desmanchado del molde
    v_vueltas_desmanch := NEW.vueltas_desmanchado;

    -- Condición: umbral activo, vueltas > 0, múltiplo exacto, estado no bloqueante
    IF v_vueltas_desmanch IS NULL
       OR v_vueltas_desmanch <= 0
       OR NEW.vueltas_actuales IS NULL
       OR NEW.vueltas_actuales <= 0
       OR (NEW.vueltas_actuales % v_vueltas_desmanch) <> 0 THEN
        RETURN NEW;
    END IF;

    -- Evitar insertar si el molde ya está en reparación o destruido
    IF NEW.estado::text IN ('En reparacion', 'Destruido') THEN
        RETURN NEW;
    END IF;

    -- Insertar registro en BD_moldes para activar el flujo de desmanchado
    INSERT INTO public."BD_moldes" (
        id,
        "Título",
        "CODIGO MOLDE",
        "ESTADO",
        "DEFECTOS A REPARAR",
        "Tipo de reparacion",
        "FECHA ENTRADA",
        "Created",
        "Created By",
        "Modified",
        "Modified By",
        repair_event_id
    ) VALUES (
        (extract(epoch from now()) * 1000)::bigint,
        NEW.nombre_articulo,
        NEW.serial,
        'En reparacion',
        'Desmanchado',
        'Desmanchado',
        CURRENT_DATE::text,
        NOW()::text,
        'Sistema Automático',
        NOW()::text,
        'Sistema Automático',
        gen_random_uuid()
    );

    RAISE LOG '[auto_desmanchado] Molde "%" enviado a desmanchado (vueltas=%, freq=%)',
        NEW.serial, NEW.vueltas_actuales, v_vueltas_desmanch;

    RETURN NEW;
END;
$$;


-- ── PASO 2: Eliminar trigger anterior si existía ─────────────

DROP TRIGGER IF EXISTS trg_auto_desmanchado ON public.moldes;


-- ── PASO 3: Crear el trigger en moldes ───────────────────────

CREATE TRIGGER trg_auto_desmanchado
AFTER UPDATE OF vueltas_actuales
ON public.moldes
FOR EACH ROW
EXECUTE FUNCTION auto_desmanchado_moldes();


-- ── VALIDACIÓN MANUAL ────────────────────────────────────────
-- Verifica cuáles moldes están próximos al umbral de desmanchado:

/*
SELECT
    serial,
    nombre_articulo,
    estado,
    vueltas_actuales,
    vueltas_desmanchado,
    CASE
        WHEN vueltas_desmanchado > 0
         AND vueltas_actuales % vueltas_desmanchado = 0
        THEN '⚠️ DEBE DESMANCHAR'
        WHEN vueltas_desmanchado > 0
        THEN CONCAT(vueltas_desmanchado - (vueltas_actuales % vueltas_desmanchado), ' vueltas para desmanchar')
        ELSE 'Sin frecuencia configurada'
    END AS estado_desmanchado
FROM public.moldes
WHERE vueltas_desmanchado > 0
ORDER BY (vueltas_actuales % vueltas_desmanchado) ASC
LIMIT 50;
*/
