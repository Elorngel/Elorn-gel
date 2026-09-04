-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table produits add column if not exists poids_reference numeric;
alter table produits add column if not exists unite_reference text not null default 'kg';
