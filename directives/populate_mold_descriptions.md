# Popular Descripción de Moldes desde Excel

Este proceso permite masificar la actualización de la columna `descripcion_molde` en la tabla `public.moldes` de Supabase.

## 1. Requisitos Previos

- El archivo Excel debe estar ubicado en: `data/moldes_descripcion.xlsx`
- El Excel debe tener exactamente estas dos columnas:
    - **serial**: El número de serie único del molde (usado para buscar el registro).
    - **descripcion_molde**: El nuevo título o descripción que deseas asignar.

## 2. Preparación

1. Asegúrate de que la columna ya existe en Supabase (Ya fue creada mediante migración).
2. Coloca tu archivo Excel en la carpeta `data/`.

## 3. Ejecución del Script

Para procesar el archivo y actualizar Supabase, ejecuta el siguiente comando en tu terminal:

```powershell
python execution/populate_mold_descriptions.py
```

## 4. Funcionamiento del Script

- El script lee el archivo Excel fila por fila.
- Utiliza el campo `serial` como identificador único para hacer un `PATCH` en la API de Supabase.
- Si no tienes instaladas las librerías `pandas` y `openpyxl`, el script intentará instalarlas automáticamente en la primera ejecución.

## 5. Solución de Problemas

- **Error de Credenciales**: Verifica que tu archivo `.env` tenga las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Serial no encontrado**: Si un serial en el Excel no existe en Supabase, el script simplemente no actualizará nada para esa fila.
- **Formato de Excel**: Asegúrate de que no haya espacios extras en los nombres de las columnas.
