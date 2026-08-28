-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table produits add column if not exists actif boolean not null default true;
