-- Mode fêtes (13/11/2026) : bannière « Le menu des fêtes » sur la page d'accueil, activable dans l'admin
-- (onglet « Fêtes »). Tant que fetes_actif = false, rien ne change sur le site.
-- fetes : textes, 4 produits (id, phrase, nom affiché), date du décompte et dates à retenir (voir src/lib/fetes.js).
alter table parametres_site add column if not exists fetes_actif boolean not null default false;
alter table parametres_site add column if not exists fetes jsonb;
