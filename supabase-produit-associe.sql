-- À coller une seule fois dans Supabase > SQL Editor > Run
alter table produits add column if not exists produit_associe_id uuid references produits(id) on delete set null;
alter table produits add column if not exists produit_associe_label text;
