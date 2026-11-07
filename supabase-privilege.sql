-- 07/11/2026 : carte Privilège (39 € par an, vendue hors site) = livraison offerte pendant 1 an.
-- Cochée par un admin dans l'onglet « Clients », avec la date d'achat de la carte.

-- Date d'achat de la carte (vide = pas client Privilège). Valable jusqu'à la veille du même jour l'année suivante.
alter table clients add column if not exists privilege_debut date;

-- Les clients ne peuvent pas la modifier : leurs droits d'écriture sur « clients » sont limités aux coordonnées
-- (grant update (prenom, nom, …) dans supabase-offres.sql) et cette colonne n'en fait pas partie.
-- Seul un admin la règle, par cette fonction.
create or replace function public.definir_privilege(p_client uuid, p_debut date)
returns date language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;
  update clients set privilege_debut = p_debut where id = p_client;
  return p_debut;
end $$;
revoke all on function public.definir_privilege(uuid, date) from public, anon;
grant execute on function public.definir_privilege(uuid, date) to authenticated;

-- Sur la commande : livraison offerte au titre de la carte Privilège (affichage admin, emails, bon imprimé).
alter table commandes add column if not exists privilege boolean not null default false;
