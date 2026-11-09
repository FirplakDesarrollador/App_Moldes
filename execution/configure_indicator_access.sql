-- Run in the Supabase SQL Editor after creating indicadores_fabricacion_moldes.
-- This script configures permissions; it does not change KPI equations.
begin;

create table if not exists public.responsables_indicadores_moldes (
    user_id uuid primary key references auth.users(id) on delete cascade,
    nombre text not null unique
        check (nombre in ('Sara Aguilar', 'Brian Sánchez')),
    creado_en timestamptz not null default now()
);

alter table public.responsables_indicadores_moldes enable row level security;
revoke all on public.responsables_indicadores_moldes from public, anon, authenticated;
grant select on public.responsables_indicadores_moldes to authenticated;

drop policy if exists responsables_consultar_propio on public.responsables_indicadores_moldes;
create policy responsables_consultar_propio
    on public.responsables_indicadores_moldes for select to authenticated
    using (user_id = (select auth.uid()));

alter table public.indicadores_fabricacion_moldes enable row level security;
revoke all on public.indicadores_fabricacion_moldes from public, anon, authenticated;
grant select, insert, update on public.indicadores_fabricacion_moldes to authenticated;

drop policy if exists indicadores_responsables_leer on public.indicadores_fabricacion_moldes;
create policy indicadores_responsables_leer
    on public.indicadores_fabricacion_moldes for select to authenticated
    using (
        exists (select 1 from public.responsables_indicadores_moldes
                where user_id = (select auth.uid()))
    );

drop policy if exists indicadores_responsables_insertar on public.indicadores_fabricacion_moldes;
create policy indicadores_responsables_insertar
    on public.indicadores_fabricacion_moldes for insert to authenticated
    with check (
        tipo_reparacion = 'REPARACION_ESPECIAL' and planta = 'PRINCIPAL'
        and exists (select 1 from public.responsables_indicadores_moldes
                    where user_id = (select auth.uid()))
    );

drop policy if exists indicadores_responsables_actualizar on public.indicadores_fabricacion_moldes;
create policy indicadores_responsables_actualizar
    on public.indicadores_fabricacion_moldes for update to authenticated
    using (
        tipo_reparacion = 'REPARACION_ESPECIAL' and planta = 'PRINCIPAL'
        and exists (select 1 from public.responsables_indicadores_moldes
                    where user_id = (select auth.uid()))
    )
    with check (
        tipo_reparacion = 'REPARACION_ESPECIAL' and planta = 'PRINCIPAL'
        and exists (select 1 from public.responsables_indicadores_moldes
                    where user_id = (select auth.uid()))
    );

-- Attribute writes to the verified account rather than a browser-provided name.
create or replace function public.atribuir_guardado_indicadores_moldes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    responsable text;
begin
    select nombre into responsable
    from public.responsables_indicadores_moldes
    where user_id = (select auth.uid());

    if responsable is null then
        raise exception 'Cuenta sin autorización para guardar indicadores'
            using errcode = '42501';
    end if;

    new.actualizado_por := responsable;
    new.calculado_en := now();
    if tg_op = 'UPDATE' then
        new.creado_en := old.creado_en;
    else
        new.creado_en := now();
    end if;
    return new;
end;
$$;

revoke all on function public.atribuir_guardado_indicadores_moldes()
    from public, anon, authenticated;

drop trigger if exists atribuir_guardado_indicadores on public.indicadores_fabricacion_moldes;
create trigger atribuir_guardado_indicadores
    before insert or update on public.indicadores_fabricacion_moldes
    for each row execute function public.atribuir_guardado_indicadores_moldes();

commit;
