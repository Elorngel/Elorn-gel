-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table produits add column if not exists description text;
alter table produits add column if not exists ingredients text;
