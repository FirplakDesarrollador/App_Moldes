-- Fecha esperada del desmanchado automático: 0,25 días y corte después de las 14:00.
-- Ejecutar completo en Supabase SQL Editor. No actualiza ingresos anteriores.
BEGIN;

CREATE OR REPLACE FUNCTION public.es_festivo_colombia(p_fecha date)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE STRICT
AS $$
DECLARE
    y integer := extract(year FROM p_fecha)::integer;
    a integer; b integer; c integer; d integer; e integer;
    f integer; g integer; h integer; i integer; k integer;
    l integer; m integer; n integer;
    pascua date;
BEGIN
    -- Domingo de Pascua del calendario gregoriano (Meeus/Jones/Butcher).
    a := y % 19; b := y / 100; c := y % 100;
    d := b / 4; e := b % 4; f := (b + 8) / 25;
    g := (b - f + 1) / 3;
    h := (19*a + b - d - g + 15) % 30;
    i := c / 4; k := c % 4;
    l := (32 + 2*e + 2*i - h - k) % 7;
    m := (a + 11*h + 22*l) / 451;
    n := h + l - 7*m + 114;
    pascua := make_date(y, n / 31, n % 31 + 1);

    RETURN p_fecha = ANY(ARRAY[
        make_date(y,1,1), make_date(y,5,1),
        make_date(y,7,20), make_date(y,8,7),
        make_date(y,12,8), make_date(y,12,25),
        pascua - 3, pascua - 2
    ]) OR EXISTS (
        SELECT 1
        FROM unnest(ARRAY[
            make_date(y,1,6), make_date(y,3,19),
            make_date(y,6,29), make_date(y,8,15),
            make_date(y,10,12), make_date(y,11,1),
            make_date(y,11,11),
            pascua + 39, pascua + 60, pascua + 68
        ]) AS fechas(fecha)
        WHERE p_fecha = fecha + ((8 - extract(isodow FROM fecha)::integer) % 7)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.calcular_fecha_desmanchado(
    p_ingreso timestamptz DEFAULT clock_timestamp()
)
RETURNS date
LANGUAGE plpgsql IMMUTABLE STRICT
AS $$
DECLARE
    ingreso_local timestamp := p_ingreso AT TIME ZONE 'America/Bogota';
    fecha date := ingreso_local::date;
BEGIN
    -- En un día hábil, hasta las 14:00 inclusive se entrega el mismo día.
    -- Después de las 14:00 se busca el siguiente día hábil.
    -- Un ingreso en fin de semana o festivo pasa al próximo día hábil.
    IF extract(isodow FROM fecha) NOT IN (6,7)
       AND NOT public.es_festivo_colombia(fecha)
       AND ingreso_local::time > time '14:00' THEN
        fecha := fecha + 1;
    END IF;

    WHILE extract(isodow FROM fecha) IN (6,7)
          OR public.es_festivo_colombia(fecha) LOOP
        fecha := fecha + 1;
    END LOOP;
    RETURN fecha;
END;
$$;

-- Cambiar SOLO la asignación de fecha esperada sobre la función instalada.
-- Las condiciones, catálogo, campos, fechas de entrada y trigger quedan intactos.
DO $patch$
DECLARE
    definicion text;
    coincidencias integer;
    patron text := 'v_fecha_esperada[[:space:]]*:=[[:space:]]*public[.]calcular_fecha_esperada_v2[[:space:]]*[(][[:space:]]*CURRENT_DATE[[:space:]]*,[[:space:]]*v_tiempo_desmanchado[[:space:]]*[)][[:space:]]*;';
    linea_nueva text := 'v_fecha_esperada := public.calcular_fecha_desmanchado(clock_timestamp());';
BEGIN
    SELECT pg_get_functiondef('public.auto_desmanchado_moldes_v2()'::regprocedure)
    INTO definicion;

    IF position(linea_nueva IN definicion) > 0 THEN
        RAISE NOTICE 'La corrección de fecha esperada ya está instalada';
        RETURN;
    END IF;

    SELECT count(*) INTO coincidencias
    FROM regexp_matches(definicion, patron, 'g');

    IF coincidencias <> 1 THEN
        RAISE EXCEPTION 'Se esperaba un único cálculo de fecha esperada; se encontraron %. No se aplicó el cambio.', coincidencias;
    END IF;

    -- El patrón acepta espacios y saltos de línea, sin cambiar el resto del cuerpo.
    EXECUTE regexp_replace(definicion, patron, linea_nueva);
END;
$patch$;

-- Comprobaciones: un error revierte toda la instalación.
DO $$
BEGIN
    IF public.calcular_fecha_desmanchado('2026-11-20 13:59:00-05') <> date '2026-11-20'
       OR public.calcular_fecha_desmanchado('2026-11-20 14:00:00-05') <> date '2026-11-20'
       OR public.calcular_fecha_desmanchado('2026-11-20 14:00:01-05') <> date '2026-11-23'
       OR public.calcular_fecha_desmanchado('2026-11-13 15:00:00-05') <> date '2026-11-17'
       OR public.calcular_fecha_desmanchado('2026-11-21 16:00:00-05') <> date '2026-11-23'
       OR public.calcular_fecha_desmanchado('2026-12-24 15:00:00-05') <> date '2026-12-28'
       OR public.calcular_fecha_desmanchado('2026-12-31 15:00:00-05') <> date '2027-01-04'
       OR public.calcular_fecha_desmanchado('2026-01-09 15:00:00-05') <> date '2026-01-13'
       OR public.calcular_fecha_desmanchado('2026-04-01 15:00:00-05') <> date '2026-04-06' THEN
        RAISE EXCEPTION 'Falló la validación de fechas de desmanchado';
    END IF;
END;
$$;
COMMIT;
