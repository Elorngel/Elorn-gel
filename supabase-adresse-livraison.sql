-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Adresse de livraison (demandée au client uniquement en mode Livraison).
alter table commandes add column if not exists adresse_livraison text;
alter table commandes add column if not exists code_postal text;
alter table commandes add column if not exists ville text;
