-- Dividir la cuenta · cambios en la base de datos (v2)
-- Borrar cuentas (solo quien la creó), límite de personas y quitar a alguien.
-- Se pega entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez sin problema.

alter table public.split_bills add column if not exists clave text;

-- Cuántas personas hay en un nombre: "Ana y Salvi" = 2, "Ana, Luis y Pepe" = 3
create or replace function public.split_heads(p text)
returns int language sql immutable set search_path = public as $$
  select greatest(1, coalesce(array_length(
    array_remove(regexp_split_to_array(trim(coalesce(p,'')), '\s*(?:,|\s(?:y|e)\s|\s?[&+]\s?)\s*', 'i'), ''), 1), 1));
$$;

drop function if exists public.split_create(jsonb);
create or replace function public.split_create(p_data jsonb, p_clave text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  if pg_column_size(p_data) > 200000 then raise exception 'too big'; end if;
  if p_clave is not null and length(p_clave) > 100 then raise exception 'bad'; end if;
  v_id := translate(encode(extensions.gen_random_bytes(12), 'base64'), '+/=', '-_');
  insert into split_bills(id, data, clave) values (v_id, coalesce(p_data,'{}'::jsonb) || jsonb_build_object('marcas', '{}'::jsonb), p_clave);
  return v_id;
end $$;

-- Entrar en la cuenta, sin pasarse del número de personas
create or replace function public.split_join(p_id text, p_persona text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; d jsonb; tope int; hay int;
begin
  if length(p_persona) > 60 or length(trim(p_persona)) = 0 then raise exception 'bad'; end if;
  select data, ver into d, v from split_bills where id = p_id for update;
  if d is null then return null; end if;
  if coalesce(d->'personas','[]'::jsonb) ? p_persona then return v; end if;
  tope := nullif(d->>'comensales','')::int;
  select coalesce(sum(split_heads(x)),0) into hay from jsonb_array_elements_text(coalesce(d->'personas','[]'::jsonb)) x;
  if tope is not null and hay + split_heads(p_persona) > tope then
    raise exception 'lleno';
  end if;
  update split_bills
     set data = jsonb_set(data, '{personas}', coalesce(data->'personas','[]'::jsonb) || to_jsonb(p_persona), true),
         ver = ver + 1, updated_at = now()
   where id = p_id returning ver into v;
  return v;
end $$;

-- Quitar a una persona (y lo que había marcado)
create or replace function public.split_leave(p_id text, p_persona text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  update split_bills
     set data = jsonb_set(
                  jsonb_set(data, '{personas}', coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(data->'personas','[]'::jsonb)) x where x <> to_jsonb(p_persona)), '[]'::jsonb), true),
                  '{marcas}', coalesce((select jsonb_object_agg(k, val - p_persona) from jsonb_each(coalesce(data->'marcas','{}'::jsonb)) as e(k, val)), '{}'::jsonb), true),
         ver = ver + 1, updated_at = now()
   where id = p_id returning ver into v;
  return v;
end $$;

-- Borrar la cuenta: solo quien la creó (con su clave)
create or replace function public.split_delete(p_id text, p_clave text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from split_bills where id = p_id and clave is not null and clave = p_clave;
  get diagnostics n = row_count;
  return n > 0;
end $$;

revoke all on function public.split_create(jsonb, text), public.split_leave(text, text), public.split_delete(text, text), public.split_heads(text) from public;
grant execute on function public.split_create(jsonb, text), public.split_join(text, text), public.split_leave(text, text), public.split_delete(text, text) to anon, authenticated;
revoke execute on function public.split_heads(text) from anon, authenticated;
