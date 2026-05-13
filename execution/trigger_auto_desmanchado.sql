-- ============================================================
-- TRIGGER SQL: Auto-desmanchado moldes → BD_moldes
-- ============================================================
--
-- REGLA DE NEGOCIO:
--   Cada molde tiene un umbral en moldes.vueltas_desmanchado.
--   Cuando moldes.vueltas_actuales alcanza un múltiplo de ese umbral,
--   el molde sale automáticamente a desmanchar:
--     1. Se inserta un registro en BD_moldes con:
--          ESTADO             = 'En reparacion'
--          DEFECTOS A REPARAR = 'Desmanchado'
--          Tipo de reparacion = 'Reparacion rapida'
--     2. El trigger trg_sync_moldes_estado detecta 'Desmanchado' en
--        DEFECTOS A REPARAR y actualiza moldes.estado = 'Por desmanchar'
--
-- CONDICIÓN DE DISPARO:
--   - vueltas_desmanchado > 0  (molde tiene umbral configurado)
--   - vueltas_actuales > 0
--   - vueltas_actuales % vueltas_desmanchado = 0  (cada N vueltas)
--   - estado NO es 'Por desmanchar', 'En reparacion' ni 'Destruido'
--
-- CÓMO EJECUTAR:
--   Supabase → SQL Editor → pegar todo → Run
--   (Ejecutar DESPUÉS de trigger_sync_moldes_estado.sql)
-- ============================================================


-- ── PASO 1: Función del trigger ──────────────────────────────

CREATE OR REPLACE FUNCTION auto_desmanchado_moldes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_umbral INTEGER;
BEGIN
    v_umbral := NEW.vueltas_desmanchado;

    -- Guardia: umbral no configurado o vueltas inválidas
    IF v_umbral IS NULL OR v_umbral <= 0
       OR NEW.vueltas_actuales IS NULL OR NEW.vueltas_actuales <= 0 THEN
        RETURN NEW;
    END IF;

    -- Guardia: condición de múltiplo no cumplida
    IF (NEW.vueltas_actuales % v_umbral) <> 0 THEN
        RETURN NEW;
    END IF;

    -- Guardia: molde ya está pendiente o en proceso
    IF NEW.estado::text IN ('Por desmanchar', 'En reparacion', 'Destruido') THEN
        RETURN NEW;
    END IF;

    -- Insertar en BD_moldes — el defecto 'Desmanchado' activa trg_sync_moldes_estado
    -- que a su vez actualiza moldes.estado = 'Por desmanchar'
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
        'Reparacion rapida',
        CURRENT_DATE::text,
        NOW()::text,
        'Sistema Automático',
        NOW()::text,
        'Sistema Automático',
        gen_random_uuid()
    );

    RAISE LOG '[auto_desmanchado] Molde "%" → desmanchado automático (vueltas=%, umbral=%)',
        NEW.serial, NEW.vueltas_actuales, v_umbral;

    RETURN NEW;
END;
$$;


-- ── PASO 2: Eliminar trigger anterior si existía ─────────────

DROP TRIGGER IF EXISTS trg_auto_desmanchado ON public.moldes;


-- ── PASO 3: Crear trigger en moldes ──────────────────────────

CREATE TRIGGER trg_auto_desmanchado
AFTER UPDATE OF vueltas_actuales
ON public.moldes
FOR EACH ROW
EXECUTE FUNCTION auto_desmanchado_moldes();


-- ── VALIDACIÓN MANUAL ────────────────────────────────────────
/*
SELECT
    serial,
    nombre_articulo,
    estado::text,
    vueltas_actuales,
    vueltas_desmanchado,
    CASE
        WHEN vueltas_desmanchado > 0 AND vueltas_actuales % vueltas_desmanchado = 0
            THEN 'DEBE DESMANCHAR AHORA'
        WHEN vueltas_desmanchado > 0
            THEN CONCAT(vueltas_desmanchado - (vueltas_actuales % vueltas_desmanchado), ' vueltas restantes')
        ELSE 'Sin umbral configurado'
    END AS proximo_desmanchado
FROM public.moldes
WHERE vueltas_desmanchado > 0
ORDER BY (vueltas_actuales % vueltas_desmanchado) ASC
LIMIT 50;
*/
