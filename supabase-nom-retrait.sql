-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table produits add column if not exists nom_retrait text;
