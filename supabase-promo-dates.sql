-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Promotions : prix promo (au lieu d'un taux) + période de validité (dates incluses).
alter table produits add column if not exists prix_promo numeric;
alter table produits add column if not exists promo_debut date;
alter table produits add column if not exists promo_fin date;
