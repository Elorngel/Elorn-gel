-- À coller une seule fois dans Supabase > SQL Editor > Run

-- Position/zoom pour chaque photo produit
alter table produits add column if not exists photo_zoom numeric not null default 1;
alter table produits add column if not exists photo_pos_x numeric not null default 50;
alter table produits add column if not exists photo_pos_y numeric not null default 50;

-- Réglages du site : une seule ligne (photo vitrine + logo)
create table if not exists parametres_site (
  id int primary key default 1,
  hero_url text,
  hero_zoom numeric not null default 1,
  hero_pos_x numeric not null default 50,
  hero_pos_y numeric not null default 50,
  logo_url text,
  constraint single_row check (id = 1)
);

alter table parametres_site enable row level security;

create policy "Lecture publique des réglages"
  on parametres_site for select
  using (true);

create policy "Ecriture publique des réglages (admin, à sécuriser plus tard)"
  on parametres_site for all
  using (true)
  with check (true);

insert into parametres_site (id) values (1)
on conflict (id) do nothing;
