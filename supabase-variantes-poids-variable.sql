-- À coller une seule fois dans Supabase > SQL Editor > Run

-- Conditionnements multiples (ex: 500g / 1kg / 1,5kg pour un même produit)
create table if not exists variantes_produit (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid references produits(id) on delete cascade,
  poids text not null,
  prix_livraison numeric not null,
  est_defaut boolean not null default false,
  ordre int not null default 0
);

alter table variantes_produit enable row level security;

create policy "Lecture publique des variantes"
  on variantes_produit for select
  using (true);

create policy "Ecriture publique des variantes (admin, à sécuriser plus tard)"
  on variantes_produit for all
  using (true)
  with check (true);

-- Poids variable (produits vendus au poids réel selon arrivage, ex: volaille fermière)
alter table produits add column if not exists poids_variable boolean not null default false;
alter table produits add column if not exists prix_kg_ref numeric;
alter table produits add column if not exists poids_kg numeric;
