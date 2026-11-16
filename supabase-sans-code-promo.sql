-- Produits exclus des codes promo (16/11/2026) : case « Exclu des codes promo » dans la fiche produit de l'admin.
-- Le code du client (BIENVENUE10…) ne s'applique pas à ces produits et ils ne comptent pas pour le minimum du code.
-- Logique dans supabase/functions/_shared/calculCommande.js (panier ET fonction passer-commande).
alter table produits add column if not exists sans_code_promo boolean not null default false;
