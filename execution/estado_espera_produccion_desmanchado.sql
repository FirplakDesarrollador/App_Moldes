-- Solo futuras salidas automáticas por vueltas; no modifica datos existentes.
BEGIN;
DO $patch$
DECLARE
 definicion text;
 ancla text := 'NEW.estado := ''Por desmanchar''::public.estado_molde_type;';
 linea text := 'NEW."Estado_reparacion" := ''En espera-produccion'';';
BEGIN
 SELECT pg_get_functiondef('public.auto_desmanchado_moldes_v2()'::regprocedure) INTO definicion;
 IF position(linea IN definicion) > 0 THEN RETURN; END IF;
 IF position(ancla IN definicion) = 0 THEN
  RAISE EXCEPTION 'No se encontró la asignación esperada. No se aplicó el cambio.';
 END IF;
 EXECUTE replace(definicion, ancla, ancla || chr(10) || '    ' || linea);
END;
$patch$;
COMMIT;
