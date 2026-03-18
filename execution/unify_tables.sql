-- RUN THIS IN SUPABASE SQL EDITOR

-- Eliminar si ya existe la tabla o si falló antes y dejó algo a medias:
DROP TABLE IF EXISTS public.registros_moldes;

-- 1. Create the unified table mapping columns and resolving type differences
CREATE TABLE public.registros_moldes AS
SELECT 
    "ID"::text AS "ID",
    "Nombre"::text AS "Nombre",
    "CODIGO MOLDE"::text AS "CODIGO MOLDE",
    "DEFECTOS A REPARAR"::text AS "DEFECTOS A REPARAR",
    "FECHA ENTRADA"::text AS "FECHA ENTRADA",
    "FECHA ESPERADA"::text AS "FECHA ESPERADA",
    "FECHA ENTREGA"::text AS "FECHA ENTREGA",
    "ESTADO"::text AS "ESTADO",
    "OBSERVACIONES"::text AS "OBSERVACIONES",
    "Usuario"::text AS "Usuario",
    "Recibido"::text AS "Recibido",
    "Prioridad"::text AS "Prioridad",
    "H altura de pestaña"::text AS "H altura de pestaña",
    "Created"::text AS "Created",
    "Responsable"::text AS "Responsable",
    "Tipo de reparacion"::text AS "Tipo de reparacion",
    "Tipo"::text AS "Tipo",
    "espesor_pestana"::text AS "espesor_pestana",
    "espesor_bowl"::text AS "espesor_bowl",
    "espesor_fondo"::text AS "espesor_fondo",
    "espesor_parte_plana"::text AS "espesor_parte_plana",
    "espesor_angulos"::text AS "espesor_angulos",
    "espesor_radios"::text AS "espesor_radios",
    "Modified"::text AS "Modified",
    "Created By"::text AS "Created By",
    "Modified By"::text AS "Modified By"
FROM public.base_datos_moldes

UNION ALL

SELECT 
    "ID"::text AS "ID",
    "Título"::text AS "Nombre",
    "CODIGO MOLDE"::text AS "CODIGO MOLDE",
    "DEFECTOS A REPARAR"::text AS "DEFECTOS A REPARAR",
    "FECHA ENTRADA"::text AS "FECHA ENTRADA",
    "FECHA ESPERADA"::text AS "FECHA ESPERADA",
    "FECHA ENTREGA"::text AS "FECHA ENTREGA",
    "ESTADO"::text AS "ESTADO",
    "OBSERVACIONES"::text AS "OBSERVACIONES",
    "Usuario"::text AS "Usuario",
    "Recibido"::text AS "Recibido",
    "Prioridad"::text AS "Prioridad",
    "H altura de pestaña"::text AS "H altura de pestaña",
    "Created"::text AS "Created",
    "Responsable"::text AS "Responsable",
    "Tipo de reparación"::text AS "Tipo de reparacion", 
    "Tipo"::text AS "Tipo",
    NULL::text AS "espesor_pestana",
    NULL::text AS "espesor_bowl",
    NULL::text AS "espesor_fondo",
    NULL::text AS "espesor_parte_plana",
    NULL::text AS "espesor_angulos",
    NULL::text AS "espesor_radios",
    NULL::text AS "Modified",
    NULL::text AS "Created By",
    NULL::text AS "Modified By"
FROM public.migracion_moldes;

-- 2. Grant access to authenticated users
GRANT ALL ON TABLE public.registros_moldes TO authenticated;
GRANT ALL ON TABLE public.registros_moldes TO anon;
GRANT ALL ON TABLE public.registros_moldes TO service_role;
