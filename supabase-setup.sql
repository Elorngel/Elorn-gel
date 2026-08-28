-- À coller en une seule fois dans Supabase > SQL Editor > New query > Run

create table produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie text,
  poids text,
  tags text,
  prix_livraison numeric not null default 0,
  prix_par_kg text,
  photo_url text,
  en_rupture boolean not null default false,
  created_at timestamptz default now()
);

alter table produits enable row level security;

create policy "Lecture publique des produits"
  on produits for select
  using (true);

create policy "Ecriture publique des produits (admin, à sécuriser plus tard)"
  on produits for all
  using (true)
  with check (true);

insert into storage.buckets (id, name, public)
values ('photos-produits', 'photos-produits', true);

create policy "Lecture publique des photos"
  on storage.objects for select
  using (bucket_id = 'photos-produits');

create policy "Upload public des photos (admin, à sécuriser plus tard)"
  on storage.objects for insert
  with check (bucket_id = 'photos-produits');

-- Quelques produits d'exemple pour tester tout de suite
insert into produits (nom, categorie, poids, tags, prix_livraison, prix_par_kg) values
('4 Filets de cabillaud', 'Poissons et fruits de mer', '1 kg', 'France, MSC', 14.90, '14,90 €/kg'),
('Mini gratins dauphinois x6', 'Accompagnements', 'Boîte 600 g', 'France, Artisanal', 8.50, '14,17 €/kg'),
('Légumes du soleil bio', 'Accompagnements', '1 kg', 'Bio, France', 6.20, '6,20 €/kg'),
('Bûche glacée framboise', 'Desserts et glaces', '6 parts', 'France', 12.90, '21,50 €/kg');
