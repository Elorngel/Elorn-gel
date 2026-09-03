-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table produits add column if not exists en_promo boolean not null default false;
alter table produits add column if not exists taux_promo numeric not null default 0;
