-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Zone de livraison : liste des communes desservies (tableau de noms).
-- Vide ou absent = aucune restriction.
alter table parametres_site add column if not exists zone_livraison jsonb;
