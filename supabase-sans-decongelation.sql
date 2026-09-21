-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Case à cocher "Sans décongélation préalable" sur la fiche produit
alter table produits add column if not exists sans_decongelation boolean not null default false;
