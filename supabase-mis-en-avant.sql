-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table produits add column if not exists mis_en_avant boolean not null default false;
