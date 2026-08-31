-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table commandes add column if not exists creneau_retrait text;
