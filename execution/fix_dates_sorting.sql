-- Convert FECHA ENTRADA strings to DATE type
-- First, make sure any empty/NULL strings are proper NULL
UPDATE public.registros_moldes SET 
  "FECHA ENTRADA" = NULL 
WHERE "FECHA ENTRADA" = 'NULL' OR "FECHA ENTRADA" = '';

-- Change column type by parsing the current values
-- PostgreSQL supports parsing many common date formats automatically
ALTER TABLE public.registros_moldes
  ALTER COLUMN "FECHA ENTRADA" TYPE date 
  USING TO_DATE("FECHA ENTRADA", 'MM/DD/YYYY');

-- Do the same for other date columns if necessary to fix sorting
UPDATE public.registros_moldes SET "FECHA ESPERADA" = NULL WHERE "FECHA ESPERADA" = 'NULL' OR "FECHA ESPERADA" = '';
ALTER TABLE public.registros_moldes ALTER COLUMN "FECHA ESPERADA" TYPE date USING TO_DATE("FECHA ESPERADA", 'MM/DD/YYYY');

UPDATE public.registros_moldes SET "FECHA ENTREGA" = NULL WHERE "FECHA ENTREGA" = 'NULL' OR "FECHA ENTREGA" = '';
ALTER TABLE public.registros_moldes ALTER COLUMN "FECHA ENTREGA" TYPE date USING TO_DATE("FECHA ENTREGA", 'MM/DD/YYYY');

UPDATE public.registros_moldes SET "Created" = NULL WHERE "Created" = 'NULL' OR "Created" = '';
-- Some 'Created' values have time - parse with timestamp
ALTER TABLE public.registros_moldes ALTER COLUMN "Created" TYPE timestamp with time zone USING TO_TIMESTAMP("Created", 'MM/DD/YYYY HH:MI AM');
