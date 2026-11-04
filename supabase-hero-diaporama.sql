-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Photos 2 et 3 du diaporama de la page d'accueil (la photo 1 = hero_url existante)
alter table parametres_site add column if not exists hero_url_2 text;
alter table parametres_site add column if not exists hero_zoom_2 numeric not null default 1;
alter table parametres_site add column if not exists hero_pos_x_2 numeric not null default 50;
alter table parametres_site add column if not exists hero_pos_y_2 numeric not null default 50;
alter table parametres_site add column if not exists hero_url_3 text;
alter table parametres_site add column if not exists hero_zoom_3 numeric not null default 1;
alter table parametres_site add column if not exists hero_pos_x_3 numeric not null default 50;
alter table parametres_site add column if not exists hero_pos_y_3 numeric not null default 50;
