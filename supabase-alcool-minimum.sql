-- Vente d'alcool et minimum de commande en livraison (01/11/2026).
-- produits.alcool : affiche la mention légale et réserve l'achat aux majeurs (case sur la fiche admin).
alter table produits add column if not exists alcool boolean not null default false;
-- Minimum de commande en livraison, réglable dans l'admin → Réglages du site.
alter table parametres_site add column if not exists minimum_livraison numeric not null default 30;

update produits set alcool = true where trim(nom) in (
  'BIB ROSE VAUCLUSE LES MERIDIENNES',
  'BIB ROUGE VAUCLUSE LES MERIDIENNES',
  'BIB UBY BLANC CÔTE DE GASCOGNE',
  'BIB UBY ROSE 5 CÔTE DE GASCOGNE',
  'CIDRE FERMIER',
  'UBY BLANC COLOMBARD SAUVIGNON',
  'UBY ROSE CÔTE DE GASCOGNE',
  'UBY ROUGE MERLOT TANNAT',
  'VAUCLUSE ROSE LES MERIDIENNES',
  'CHATEAU HAUT NIVELLE PRESTIGE  75CL'
);
