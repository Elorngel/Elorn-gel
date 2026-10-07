-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Déstockage : produit signalé "déstockage" avec son prix de déstockage.
alter table produits add column if not exists en_destockage boolean not null default false;
alter table produits add column if not exists prix_destockage numeric;
