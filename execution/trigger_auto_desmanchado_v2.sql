-- ============================================================
-- TRIGGER SQL: Auto-desmanchado moldes v2
-- ============================================================

-- 1. Crear tabla de festivos y poblarla
CREATE TABLE IF NOT EXISTS public.festivos_colombia (
    fecha DATE PRIMARY KEY
);

INSERT INTO public.festivos_colombia (fecha) VALUES
('2026-01-01'), ('2026-01-06'), ('2026-03-23'), ('2026-04-02'), ('2026-04-03'),
('2026-05-01'), ('2026-05-18'), ('2026-06-08'), ('2026-06-15'), ('2026-06-29'),
('2026-07-20'), ('2026-08-07'), ('2026-08-17'), ('2026-10-12'), ('2026-11-02'),
('2026-11-16'), ('2026-12-08'), ('2026-12-25')
ON CONFLICT (fecha) DO NOTHING;

-- 2. Función para calcular días hábiles
CREATE OR REPLACE FUNCTION public.calcular_fecha_esperada_v2(fecha_inicio date, p_tiempo numeric)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
    v_fecha date := fecha_inicio;
    v_days_to_add integer := floor(p_tiempo);
    v_added integer := 0;
BEGIN
    WHILE v_added < v_days_to_add LOOP
        v_fecha := v_fecha + interval '1 day';
        IF EXTRACT(ISODOW FROM v_fecha) NOT IN (6, 7) AND NOT EXISTS(SELECT 1 FROM public.festivos_colombia WHERE fecha = v_fecha) THEN
            v_added := v_added + 1;
        END IF;
    END LOOP;

    -- Asegurar que el día final sea hábil
    WHILE EXTRACT(ISODOW FROM v_fecha) IN (6, 7) OR EXISTS(SELECT 1 FROM public.festivos_colombia WHERE fecha = v_fecha) LOOP
        v_fecha := v_fecha + interval '1 day';
    END LOOP;

    RETURN v_fecha;
END;
$$;

-- 3. Función del trigger
CREATE OR REPLACE FUNCTION public.auto_desmanchado_moldes_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_umbral INTEGER;
    v_tiempo_desmanchado NUMERIC := 0.25;
    v_fecha_esperada DATE;
    v_id_bd BIGINT;
    v_estado_bd TEXT;
    v_defectos TEXT;
BEGIN
    v_umbral := NEW."Vueltas_Desmanchado";

    -- Regla 3: Si moldes.vueltas_actuales es igual a moldes."Vueltas_Desmanchado"
    IF v_umbral IS NULL OR v_umbral <= 0 OR NEW.vueltas_actuales <> v_umbral THEN
        RETURN NEW;
    END IF;

    -- Regla 4: Evitar reprocesos si el molde ya está en Por desmanchar
    IF NEW.estado::text = 'Por desmanchar' THEN
        RETURN NEW;
    END IF;

    -- Cambiar estado en moldes a Por desmanchar (usando cast seguro)
    NEW.estado := 'Por desmanchar'::public.estado_molde_type;

    -- Calcular fecha esperada
    SELECT "Tiempo" INTO v_tiempo_desmanchado 
    FROM public."Defectos_moldes" 
    WHERE "Título" ILIKE '%Desmanchado%' 
    LIMIT 1;
    
    IF v_tiempo_desmanchado IS NULL THEN
        v_tiempo_desmanchado := 0.25;
    END IF;

    v_fecha_esperada := public.calcular_fecha_esperada_v2(CURRENT_DATE, v_tiempo_desmanchado);

    -- Buscar en BD_moldes el registro más adecuado (preferiblemente uno que no esté entregado)
    SELECT id, "ESTADO", "DEFECTOS A REPARAR" INTO v_id_bd, v_estado_bd, v_defectos 
    FROM public."BD_moldes" 
    WHERE "CODIGO MOLDE" = NEW.serial 
    ORDER BY 
        CASE WHEN "ESTADO" ILIKE '%Entregado%' THEN 1 ELSE 0 END,
        id DESC 
    LIMIT 1;

    IF v_id_bd IS NOT NULL THEN
        -- Si ya tiene ESTADO = 'En reparación' y DEFECTOS incluye 'Desmanchado', no duplicar.
        IF NOT (v_estado_bd ILIKE 'En reparaci_n' AND v_defectos ILIKE '%Desmanchado%') THEN
            
            -- Agregar Desmanchado sin sobrescribir (Regla 5)
            IF v_defectos IS NULL OR btrim(v_defectos) = '' THEN
                v_defectos := 'Desmanchado';
            ELSIF v_defectos NOT ILIKE '%Desmanchado%' THEN
                v_defectos := v_defectos || ', Desmanchado';
            END IF;

            UPDATE public."BD_moldes"
            SET "ESTADO" = 'En reparación',
                "Tipo de reparacion" = 'Rapida',
                "DEFECTOS A REPARAR" = v_defectos,
                "FECHA ENTRADA" = CURRENT_DATE,
                "FECHA ESPERADA" = v_fecha_esperada,
                "Modified" = NOW()::text,
                "Modified By" = 'Sistema Automático'
            WHERE id = v_id_bd;
        END IF;
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
            repair_event_id
        ) VALUES (
            (extract(epoch from now()) * 1000)::bigint,
            NEW.nombre_articulo,
            NEW.serial,
            'En reparación',
            'Desmanchado',
            'Rapida',
            CURRENT_DATE::text,
            v_fecha_esperada::text,
            NOW()::text,
            'Sistema Automático',
            NOW()::text,
            'Sistema Automático',
            gen_random_uuid()
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Recrear el Trigger
DROP TRIGGER IF EXISTS trg_auto_desmanchado ON public.moldes;
DROP TRIGGER IF EXISTS trg_auto_desmanchado_v2 ON public.moldes;

CREATE TRIGGER trg_auto_desmanchado_v2
BEFORE INSERT OR UPDATE OF vueltas_actuales
ON public.moldes
FOR EACH ROW
EXECUTE FUNCTION public.auto_desmanchado_moldes_v2();
