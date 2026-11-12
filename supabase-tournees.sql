-- 12/11/2026 : tournées des commerciaux (Julien, Fabrice, Gilles, Dominique). Pour l'instant visibles et
-- modifiables seulement par les admins (rien côté client).
create table if not exists tournees (
  id uuid primary key default gen_random_uuid(),
  commercial text not null,
  jour date not null,
  lieu text,                         -- texte d'origine du tableau Excel (« BREST ST MARC 08 »)
  communes text[] not null default '{}', -- noms des communes (comme dans src/data/communesZone.js)
  created_at timestamptz not null default now(),
  unique (commercial, jour)
);
alter table tournees enable row level security;
drop policy if exists "Tournées : admin" on tournees;
create policy "Tournées : admin" on tournees for all using (public.is_admin()) with check (public.is_admin());

-- Réglages : zone du dépôt (livrée par Romuald tous les jours) et distance d'une tournée pour la conseiller.
alter table parametres_site add column if not exists tournees_rayon_depot numeric not null default 10;
alter table parametres_site add column if not exists tournees_rayon_proximite numeric not null default 3;
