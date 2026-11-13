-- Mode Black Friday (13/11/2026) : bannière « ticket de caisse » sur la page d'accueil, activable dans l'admin
-- (onglet « Black Friday »). Tant que black_actif = false, rien ne change sur le site.
-- black : textes, lien du menu et liste des produits du ticket (voir src/lib/blackFriday.js).
alter table parametres_site add column if not exists black_actif boolean not null default false;
alter table parametres_site add column if not exists black jsonb;
