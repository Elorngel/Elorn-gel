-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table parametres_site add column if not exists hero_badge text;
alter table parametres_site add column if not exists hero_titre text;
alter table parametres_site add column if not exists hero_sous_titre text;
