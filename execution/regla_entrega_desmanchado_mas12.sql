-- Permite todas las salidas. Después de las 14:00 O desde el molde 13,
-- entrega el siguiente día hábil. Las dos condiciones NO se acumulan.
-- Requiere las funciones de calendario ya instaladas. Ejecutar completo en Supabase.
BEGIN;

CREATE TABLE IF NOT EXISTS public.desmanchado_orden_diario (
    fecha date PRIMARY KEY,
    cantidad integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0)
);
CREATE TABLE IF NOT EXISTS public.desmanchado_salidas_diarias (
    fecha date NOT NULL,
    codigo text NOT NULL,
    posicion integer NOT NULL CHECK (posicion > 0),
    fecha_esperada date NOT NULL,
    registrado_en timestamptz NOT NULL,
    PRIMARY KEY (fecha, codigo),
    UNIQUE (fecha, posicion)
);
ALTER TABLE public.desmanchado_orden_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desmanchado_salidas_diarias ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.desmanchado_orden_diario, public.desmanchado_salidas_diarias FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.fecha_desmanchado_segun_orden(p_ingreso timestamptz, p_posicion integer)
RETURNS date LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = ''
AS $$
DECLARE entrega date := public.calcular_fecha_desmanchado(p_ingreso);
BEGIN
    IF p_posicion < 1 THEN RAISE EXCEPTION 'Posición diaria inválida'; END IF;
    IF p_posicion > 12 AND entrega <= (p_ingreso AT TIME ZONE 'America/Bogota')::date THEN
        -- Solo desplazar si el cálculo por horario aún dejaba entrega el mismo día.
        -- Si ya pasó al siguiente hábil, conservar esa fecha: no sumar otro día.
        entrega := entrega + 1;
        WHILE extract(isodow FROM entrega) IN (6,7)
              OR public.es_festivo_colombia(entrega) LOOP
            entrega := entrega + 1;
        END LOOP;
    END IF;
    RETURN entrega;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_salida_desmanchado(p_codigo text, p_ingreso timestamptz)
RETURNS date LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    dia date := (p_ingreso AT TIME ZONE 'America/Bogota')::date;
    codigo_normalizado text := upper(btrim(p_codigo));
    posicion_salida integer;
    entrega date;
BEGIN
    IF nullif(codigo_normalizado, '') IS NULL OR p_ingreso IS NULL THEN
        RAISE EXCEPTION 'Se requieren código y fecha de salida';
    END IF;
    -- Orden diario único aun con salidas simultáneas. No es un límite de salidas.
    PERFORM pg_catalog.pg_advisory_xact_lock(734120, dia - date '2000-01-01');
    SELECT s.fecha_esperada INTO entrega
    FROM public.desmanchado_salidas_diarias s
    WHERE s.fecha = dia AND s.codigo = codigo_normalizado;
    IF FOUND THEN RETURN entrega; END IF;

    INSERT INTO public.desmanchado_orden_diario AS orden(fecha, cantidad)
    VALUES (dia, 1)
    ON CONFLICT (fecha) DO UPDATE SET cantidad = orden.cantidad + 1
    RETURNING cantidad INTO posicion_salida;

    entrega := public.fecha_desmanchado_segun_orden(p_ingreso, posicion_salida);
    INSERT INTO public.desmanchado_salidas_diarias
        (fecha, codigo, posicion, fecha_esperada, registrado_en)
    VALUES (dia, codigo_normalizado, posicion_salida, entrega, p_ingreso);
    RETURN entrega;
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_salida_desmanchado(text,timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.aplicar_orden_diario_desmanchado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NEW."Modified By" IS DISTINCT FROM 'Sistema Automático'
       OR coalesce(NEW."DEFECTOS A REPARAR", '') NOT ILIKE '%desmanch%'
       OR coalesce(NEW."ESTADO", '') NOT ILIKE '%reparaci%'
       OR nullif(btrim(NEW."CODIGO MOLDE"), '') IS NULL THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        -- Un reintento del aviso a SAP no es otra salida.
        IF NEW."Modified" IS NOT DISTINCT FROM OLD."Modified" THEN RETURN NEW; END IF;
    END IF;
    NEW."FECHA ESPERADA" := public.registrar_salida_desmanchado(NEW."CODIGO MOLDE", clock_timestamp());
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.aplicar_orden_diario_desmanchado() FROM PUBLIC, anon, authenticated;

-- Inicializar con las salidas automáticas identificables de hoy, sin cambiar sus registros.
DO $$
DECLARE r record; dia date := (clock_timestamp() AT TIME ZONE 'America/Bogota')::date;
BEGIN
    PERFORM pg_catalog.pg_advisory_xact_lock(734120, dia - date '2000-01-01');
    FOR r IN
        SELECT b."CODIGO MOLDE" AS codigo FROM public."BD_moldes" b
        WHERE btrim(b."FECHA ENTRADA"::text) = dia::text
          AND b."Modified By" LIKE 'Sistema Automático%'
          AND b."DEFECTOS A REPARAR" ILIKE '%desmanch%'
        ORDER BY b."Modified" ASC NULLS LAST, b.id ASC
    LOOP
        PERFORM public.registrar_salida_desmanchado(r.codigo, dia::timestamp AT TIME ZONE 'America/Bogota');
    END LOOP;
END;
$$;

-- No reemplaza ni recrea el trigger de vueltas; solo añade el ajuste de entrega.
DROP TRIGGER IF EXISTS trg_orden_diario_desmanchado ON public."BD_moldes";
CREATE TRIGGER trg_orden_diario_desmanchado
BEFORE INSERT OR UPDATE OF "Modified", "Modified By", "DEFECTOS A REPARAR", "ESTADO"
ON public."BD_moldes" FOR EACH ROW
EXECUTE FUNCTION public.aplicar_orden_diario_desmanchado();

-- Verificación de fechas. Cualquier fallo revierte toda la instalación.
DO $$
BEGIN
    IF public.fecha_desmanchado_segun_orden('2026-11-23 10:00-05',12) <> date '2026-11-23'
       OR public.fecha_desmanchado_segun_orden('2026-11-23 10:00-05',13) <> date '2026-11-24'
       OR public.fecha_desmanchado_segun_orden('2026-11-23 15:00-05',12) <> date '2026-11-24'
       OR public.fecha_desmanchado_segun_orden('2026-11-23 15:00-05',13) <> date '2026-11-24'
       OR public.fecha_desmanchado_segun_orden('2026-11-20 10:00-05',13) <> date '2026-11-23'
       OR public.fecha_desmanchado_segun_orden('2026-11-20 15:00-05',13) <> date '2026-11-23'
       OR public.fecha_desmanchado_segun_orden('2026-11-13 10:00-05',13) <> date '2026-11-17'
       OR public.fecha_desmanchado_segun_orden('2026-12-24 15:00-05',13) <> date '2026-12-28' THEN
        RAISE EXCEPTION 'Falló la validación de entrega sin acumulación';
    END IF;
END;
$$;
COMMIT;
