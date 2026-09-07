-- À coller une seule fois dans Supabase > SQL Editor > Run

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  ordre int not null default 0
);

create table if not exists sous_categories (
  id uuid primary key default gen_random_uuid(),
  categorie_id uuid references categories(id) on delete cascade,
  nom text not null,
  ordre int not null default 0
);

alter table categories enable row level security;
alter table sous_categories enable row level security;

create policy "Lecture publique categories" on categories for select using (true);
create policy "Ecriture publique categories (admin, a securiser plus tard)" on categories for all using (true) with check (true);
create policy "Lecture publique sous_categories" on sous_categories for select using (true);
create policy "Ecriture publique sous_categories (admin, a securiser plus tard)" on sous_categories for all using (true) with check (true);

-- Reprend les catégories déjà en place, pour ne rien perdre
insert into categories (nom, ordre) values
('Entrées et apéritifs', 0),
('Viandes et volailles', 1),
('Poissons et fruits de mer', 2),
('Accompagnements', 3),
('Plats cuisinés', 4),
('Desserts et glaces', 5),
('Épicerie et boissons', 6)
on conflict (nom) do nothing;

-- Reprend les sous-catégories déjà en place
insert into sous_categories (categorie_id, nom, ordre)
select c.id, s.nom, s.ordre from categories c
join (values
  ('Entrées et apéritifs','Feuilletés',0),
  ('Entrées et apéritifs','Bouchées',1),
  ('Entrées et apéritifs','Apéritif',2),
  ('Entrées et apéritifs','Pizzas',3),
  ('Entrées et apéritifs','Snacking',4),
  ('Viandes et volailles','Boeuf',0),
  ('Viandes et volailles','Veau',1),
  ('Viandes et volailles','Porc',2),
  ('Viandes et volailles','Agneau',3),
  ('Viandes et volailles','Charcuterie',4),
  ('Viandes et volailles','Volailles',5),
  ('Viandes et volailles','Brochettes',6),
  ('Poissons et fruits de mer','Poissons blancs',0),
  ('Poissons et fruits de mer','Saumon et truite',1),
  ('Poissons et fruits de mer','Poissons panés',2),
  ('Poissons et fruits de mer','Fruits de mer',3),
  ('Accompagnements','Légumes',0),
  ('Accompagnements','Poêlées',1),
  ('Accompagnements','Pommes de terre',2),
  ('Plats cuisinés','Plats individuels',0),
  ('Plats cuisinés','Plats à partager',1),
  ('Plats cuisinés','Saveurs d''Asie',2),
  ('Desserts et glaces','Pâtisseries',0),
  ('Desserts et glaces','Viennoiseries',1),
  ('Desserts et glaces','Glaces et bâtonnets',2),
  ('Desserts et glaces','Bacs de glace',3),
  ('Desserts et glaces','Fruits',4),
  ('Épicerie et boissons','Boissons',0),
  ('Épicerie et boissons','Épicerie sucrée',1),
  ('Épicerie et boissons','Épicerie salée',2)
) as s(cat_nom, nom, ordre) on c.nom = s.cat_nom;
