-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table parametres_site add column if not exists bandeau_haut text;
alter table parametres_site add column if not exists contact_email text;
alter table parametres_site add column if not exists contact_telephone text;
alter table parametres_site add column if not exists adresse text;
