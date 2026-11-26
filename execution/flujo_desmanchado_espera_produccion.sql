-- Ejecutar completo en Supabase SQL Editor. Incluye las dependencias del calendario y del cupo.
-- Solo futuras salidas automáticas. Conserva calendario, corte y regla de 12.
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


ALTER TABLE public."BD_moldes" ADD COLUMN IF NOT EXISTS auto_desmanchado_vueltas boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.auto_desmanchado_moldes_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_umbral INTEGER;
    v_tiempo_desmanchado NUMERIC := 0.25;
    v_fecha_esperada DATE;
    v_id_bd BIGINT;
BEGIN
    v_umbral := NEW."Vueltas_Desmanchado";

    -- Regla 3: salir al alcanzar o superar el umbral configurado.
    IF v_umbral IS NULL OR v_umbral <= 0 OR NEW.vueltas_actuales IS NULL OR NEW.vueltas_actuales < v_umbral THEN
        RETURN NEW;
    END IF;

    -- Regla 4: Evitar reprocesos si el molde ya está en Por desmanchar
    IF NEW.estado::text = 'Por desmanchar' THEN
        RETURN NEW;
    END IF;

    -- Cambiar estado en moldes a Por desmanchar (usando cast seguro)
    NEW.estado := 'Por desmanchar'::public.estado_molde_type;
    NEW."Estado_reparacion" := 'En espera-produccion';

    -- Desmanchado: 0,25 días, hora de Bogotá y siguiente día hábil tras las 14:00.
    SELECT "Tiempo" INTO v_tiempo_desmanchado
    FROM public."Defectos_moldes"
    WHERE "Título" ILIKE '%Desmanchado%'
    LIMIT 1;
    IF v_tiempo_desmanchado IS NULL THEN
        v_tiempo_desmanchado := 0.25;
    END IF;
    v_fecha_esperada := NULL; -- Se calcula al ingresar a reparación.

    -- Buscar en BD_moldes el registro más adecuado (preferiblemente uno que no esté entregado)
    SELECT id INTO v_id_bd
    FROM public."BD_moldes"
    WHERE "CODIGO MOLDE" = NEW.serial
    ORDER BY
        CASE WHEN "ESTADO" ILIKE '%Entregado%' THEN 1 ELSE 0 END,
        id DESC
    LIMIT 1;

    IF v_id_bd IS NOT NULL THEN
        -- Cada nueva salida automática reemplaza todos los defectos anteriores.
        -- La guarda de estado Por desmanchar evita reiniciar el mismo trabajo.
        UPDATE public."BD_moldes"
        SET "ESTADO" = 'En espera - Produccion',
            auto_desmanchado_vueltas = true,
            "Tipo de reparacion" = 'Rapida',
            "DEFECTOS A REPARAR" = 'Desmanchado',
            "FECHA ENTRADA" = CURRENT_DATE,
            "FECHA ESPERADA" = v_fecha_esperada,
            "FECHA ENTREGA" = NULL,
            "Modified" = NOW(),
            "Modified By" = 'Sistema Automático'
        WHERE id = v_id_bd;
    ELSE
        -- Si no existe en BD_moldes, se inserta nuevo registro
        INSERT INTO public."BD_moldes" (
            id,
            "Título",
            "CODIGO MOLDE",
            "ESTADO",
            "DEFECTOS A REPARAR",
            "Tipo de reparacion",
            "FECHA ENTRADA",
            "FECHA ESPERADA",
            "Created",
            "Created By",
            "Modified",
            "Modified By",
            auto_desmanchado_vueltas,
            repair_event_id
        ) VALUES (
            (extract(epoch from now()) * 1000)::bigint,
            NEW.nombre_articulo,
            NEW.serial,
            'En espera - Produccion',
            'Desmanchado',
            'Rapida',
            CURRENT_DATE::text,
            v_fecha_esperada::text,
            NOW(),
            'Sistema Automático',
            NOW(),
            'Sistema Automático',
            true,
            gen_random_uuid()
        );
    END IF;

    RETURN NEW;
END;
$$;


-- Esta función sustituye el conteo al salir por conteo al ingresar a reparación.
CREATE OR REPLACE FUNCTION public.aplicar_orden_diario_desmanchado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
 estado_nuevo text := regexp_replace(translate(lower(coalesce(NEW."ESTADO",'')),'ó','o'),'[^a-z]','','g');
 estado_anterior text;
BEGIN
 IF NOT NEW.auto_desmanchado_vueltas
    OR coalesce(NEW."DEFECTOS A REPARAR",'') NOT ILIKE '%desmanch%' THEN RETURN NEW; END IF;
 IF estado_nuevo = 'enesperaproduccion' THEN
    NEW."FECHA ESPERADA" := NULL;
    NEW."FECHA ENTREGA" := NULL;
    RETURN NEW;
 END IF;
 IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;
 estado_anterior := regexp_replace(translate(lower(coalesce(OLD."ESTADO",'')),'ó','o'),'[^a-z]','','g');
 IF estado_anterior = 'enesperaproduccion' AND estado_nuevo = 'enreparacion' THEN
    NEW."FECHA ESPERADA" := public.registrar_salida_desmanchado(NEW."CODIGO MOLDE", clock_timestamp());
    -- Permitir el aviso existente a SAP también si la transición se hace desde Supabase.
    NEW."Modified By" := 'Sistema Automático';
    NEW."Modified" := clock_timestamp();
 ELSIF estado_nuevo = 'enreparacion' AND estado_anterior = 'enreparacion' THEN
    -- Guardar notas o reintentar SAP no reinicia la fecha.
    NEW."FECHA ESPERADA" := OLD."FECHA ESPERADA";
    -- Una edición humana no debe borrar un aviso pendiente o en proceso.
    IF OLD."Modified By" IN ('Sistema Automático', 'Sistema Automático · SAP en proceso')
       AND coalesce(NEW."Modified By",'') NOT LIKE 'Sistema Automático%' THEN
        NEW."Modified By" := OLD."Modified By";
        NEW."Modified" := OLD."Modified";
    END IF;
 END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_orden_diario_desmanchado ON public."BD_moldes";
CREATE TRIGGER trg_orden_diario_desmanchado
BEFORE INSERT OR UPDATE ON public."BD_moldes"
FOR EACH ROW EXECUTE FUNCTION public.aplicar_orden_diario_desmanchado();

-- Conservar la función de sincronización instalada y añadir solo la guarda
-- para la escritura anidada iniciada por el trigger automático de vueltas.
DO $sync_patch$
DECLARE definicion text;
BEGIN
 IF to_regprocedure('public.sync_moldes_estado()') IS NULL THEN RETURN; END IF;
 SELECT pg_get_functiondef('public.sync_moldes_estado()'::regprocedure) INTO definicion;
 IF position('auto_desmanchado_vueltas' IN definicion) > 0 THEN RETURN; END IF;
 IF position('BEGIN' IN definicion) = 0 THEN
    RAISE EXCEPTION 'No se reconoce la función de sincronización; no se aplicó el cambio';
 END IF;
 EXECUTE regexp_replace(definicion, 'BEGIN', 'BEGIN' || chr(10) || $guard$
    -- La salida automática ya asigna NEW.estado en el trigger de vueltas.
    -- Evitar actualizar la misma fila mientras ese BEFORE UPDATE sigue ejecutándose.
    IF pg_trigger_depth() > 1
       AND coalesce(to_jsonb(NEW)->>'auto_desmanchado_vueltas','false') = 'true'
       AND NEW."Modified By" = 'Sistema Automático'
       AND NEW."ESTADO" = 'En espera - Produccion' THEN
        RETURN NEW;
    END IF;
$guard$);
END;
$sync_patch$;

COMMIT;
