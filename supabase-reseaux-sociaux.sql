-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Liens vers les comptes Facebook et Instagram (icônes dans la barre noire du haut du site).
alter table parametres_site add column if not exists lien_facebook text;
alter table parametres_site add column if not exists lien_instagram text;
