-- First create the two individual accounts under Authentication > Users.
-- Emails confirmed by the user. Run in the SQL Editor after creating accounts.
begin;
do $$
declare
    sara_email text := 'sara.aguilar@firplak.com';
    brian_email text := 'brian.sanchez@firplak.com';
    sara_id uuid;
    brian_id uuid;
begin
    if sara_email = 'REEMPLAZAR_CORREO_SARA' or brian_email = 'REEMPLAZAR_CORREO_BRIAN' then
        raise exception 'Reemplaza los correos de Sara y Brian antes de ejecutar';
    end if;

    select id into sara_id from auth.users where lower(email) = lower(btrim(sara_email));
    select id into brian_id from auth.users where lower(email) = lower(btrim(brian_email));
    if sara_id is null or brian_id is null or sara_id = brian_id then
        raise exception 'Deben existir dos cuentas diferentes en Authentication > Users';
    end if;

    insert into public.responsables_indicadores_moldes (user_id, nombre)
    values (sara_id, 'Sara Aguilar'), (brian_id, 'Brian Sánchez')
    on conflict (user_id) do update set nombre = excluded.nombre;
end;
$$;
commit;

select nombre from public.responsables_indicadores_moldes order by nombre;
