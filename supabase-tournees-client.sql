-- 12/11/2026 : conseil « Livraison groupée » côté client, activable par l'admin (onglet Tournées → Réglages).
alter table parametres_site add column if not exists tournees_conseil_actif boolean not null default false;

-- Tournées à venir, pour le panier : seulement les dates et les communes (pas le nom du commercial), et RIEN tant
-- que l'interrupteur de l'admin est éteint.
create or replace function public.tournees_a_venir()
returns table (jour date, communes text[]) language sql stable security definer set search_path = public as $$
  select t.jour, t.communes
  from tournees t
  where t.jour > (now() at time zone 'Europe/Paris')::date
    and coalesce((select p.tournees_conseil_actif from parametres_site p where p.id = 1), false)
  order by t.jour
$$;
revoke all on function public.tournees_a_venir() from public;
grant execute on function public.tournees_a_venir() to anon, authenticated;
