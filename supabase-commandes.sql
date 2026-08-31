-- À coller une seule fois dans Supabase > SQL Editor > Run

create table if not exists commandes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nom_client text not null,
  telephone text not null,
  email text,
  mode text not null, -- 'livraison' ou 'retrait'
  note text,
  total numeric not null default 0,
  statut text not null default 'nouvelle' -- 'nouvelle' / 'preparee' / 'livree'
);

create table if not exists commande_lignes (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid references commandes(id) on delete cascade,
  produit_id uuid references produits(id) on delete set null,
  nom_produit text not null,
  prix_unitaire numeric not null,
  quantite int not null
);

alter table commandes enable row level security;
alter table commande_lignes enable row level security;

create policy "Creation publique des commandes"
  on commandes for insert
  with check (true);

create policy "Lecture publique des commandes (admin, à sécuriser plus tard)"
  on commandes for select
  using (true);

create policy "Mise à jour publique des commandes (admin, à sécuriser plus tard)"
  on commandes for update
  using (true);

create policy "Creation publique des lignes de commande"
  on commande_lignes for insert
  with check (true);

create policy "Lecture publique des lignes de commande"
  on commande_lignes for select
  using (true);
