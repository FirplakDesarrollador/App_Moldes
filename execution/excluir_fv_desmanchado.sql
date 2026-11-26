-- Exclusión temporal de FV: límite de desmanchado = 12.
-- No actualiza registros ni modifica ninguna otra regla del trigger.
BEGIN;
DO $patch$
DECLARE
 definicion text;
 anterior text := 'v_umbral IS NULL OR v_umbral <= 0 OR NEW.vueltas_actuales IS NULL';
 nueva text := 'v_umbral IS NULL OR v_umbral <= 0 OR v_umbral = 12 OR NEW.vueltas_actuales IS NULL';
BEGIN
 SELECT pg_get_functiondef('public.auto_desmanchado_moldes_v2()'::regprocedure) INTO definicion;
 IF position(nueva IN definicion) > 0 THEN RETURN; END IF;
 IF position(anterior IN definicion) = 0 THEN
    RAISE EXCEPTION 'No se reconoce la condición instalada. No se modificó el trigger.';
 END IF;
 EXECUTE replace(definicion, anterior, nueva);
END;
$patch$;
COMMIT;
