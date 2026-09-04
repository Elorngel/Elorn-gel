-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table parametres_site add column if not exists frais_livraison numeric not null default 7;
alter table commandes add column if not exists frais_livraison numeric not null default 0;
