-- 06/11/2026 : email au parrain quand son bon de 25 € est créé, et minimum du parrainage à 30 €.

-- Date d'envoi de l'email « vous avez gagné un bon » (un seul envoi par bon).
alter table bons_achat add column if not exists email_envoye_le timestamptz;

-- Minimum de commande du parrainage : 30 € au lieu de 50 € (réglable ensuite dans l'admin → Offres).
update parametres_site set parrainage_minimum = 30 where id = 1;
-- Bons de parrainage pas encore utilisés : même minimum.
update bons_achat set minimum_commande = 30
  where commande_id is null and motif in ('parrainage_parrain', 'parrainage_filleul') and minimum_commande = 50;
