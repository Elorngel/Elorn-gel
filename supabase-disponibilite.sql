-- À coller une seule fois dans Supabase > SQL Editor > Run

-- Disponibilité au niveau du produit (s'il n'a pas de conditionnements multiples)
alter table produits add column if not exists dispo_livraison boolean not null default true;
alter table produits add column if not exists dispo_retrait boolean not null default true;

-- Disponibilité au niveau de chaque conditionnement (500g, 1kg, 1,5kg...)
alter table variantes_produit add column if not exists dispo_livraison boolean not null default true;
alter table variantes_produit add column if not exists dispo_retrait boolean not null default true;
