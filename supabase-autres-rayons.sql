-- Un produit peut apparaître dans d'autres rayons que son rayon principal (30/10/2026).
-- Liste de { "categorie": "...", "sous_categorie": "..." ou null }.
alter table produits add column if not exists autres_rayons jsonb not null default '[]'::jsonb;
