-- 10/11/2026 : code promo valable seulement en retrait (ou seulement en livraison). Vide = les deux.
alter table codes_promo add column if not exists mode text check (mode is null or mode in ('retrait', 'livraison'));

create or replace function public.verifier_code_promo(p_code text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  c codes_promo;
  nb int;
  aujourdhui date := (now() at time zone 'Europe/Paris')::date;
begin
  select * into c from codes_promo where code = upper(trim(coalesce(p_code, '')));
  if not found or not c.actif then
    return json_build_object('ok', false, 'message', 'Ce code n''existe pas ou n''est plus valable.');
  end if;
  if c.debut is not null and aujourdhui < c.debut then
    return json_build_object('ok', false, 'message', 'Ce code n''est pas encore valable.');
  end if;
  if c.fin is not null and aujourdhui > c.fin then
    return json_build_object('ok', false, 'message', 'Ce code a expiré.');
  end if;
  select count(*) into nb from commandes where code_promo = c.code;
  if c.max_utilisations is not null and nb >= c.max_utilisations then
    return json_build_object('ok', false, 'message', 'Ce code a déjà été utilisé le nombre maximum de fois.');
  end if;
  if auth.uid() is not null and not public.is_admin() and exists (
    select 1 from commandes where code_promo = c.code and client_id = auth.uid() and not saisie_par_admin
  ) then
    return json_build_object('ok', false, 'message', 'Vous avez déjà utilisé ce code.');
  end if;
  return json_build_object(
    'ok', true,
    'code', c.code,
    'pourcentage', c.pourcentage,
    'montant', c.montant,
    'minimum_commande', c.minimum_commande,
    'mode', c.mode,
    'restantes', case when c.max_utilisations is null then null else c.max_utilisations - nb end
  );
end $$;
grant execute on function public.verifier_code_promo(text) to anon, authenticated;
