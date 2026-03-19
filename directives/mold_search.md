PV_MOLDES V2.4
# Directive: Mold Search and Detail

## Goal
Provide a user-friendly interface to search for molds by name or code and display their full technical characteristics.

## Inputs
- Search query (string)
- `base_datos_moldes` table schema

## Tools/Scripts
- `src/components/molds/MoldSearch.tsx`: UI for searching.
- `src/components/molds/MoldDetails.tsx`: UI for displaying data.

## Flow
1. User enters text in the search bar.
2. The system queries Supabase using `ilike` on `Nombre` and `CODIGO MOLDE`.
3. A list of partial matches is displayed.
4. User selects a mold from the list.
5. All columns from the table for that specific mold are rendered.

## Edge Cases
- No results found: Display "No se encontraron moldes".
- Database error: Display a friendly error message and log to console.
- Missing data: Handle null values gracefully in the UI.
