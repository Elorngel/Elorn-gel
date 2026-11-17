-- Deuxième photo d'un produit (17/11/2026, demandé pour les bûches) : visible seulement sur la fiche produit du site,
-- en cliquant sur la petite flèche de la photo. Même cadrage que la photo principale (zoom + position).
-- Les droits sont ceux de la table produits (modification réservée aux admins, lecture publique).
alter table produits add column if not exists photo2_url text;
alter table produits add column if not exists photo2_zoom numeric not null default 1;
alter table produits add column if not exists photo2_pos_x numeric not null default 50;
alter table produits add column if not exists photo2_pos_y numeric not null default 50;
