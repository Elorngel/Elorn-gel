-- À coller une seule fois dans Supabase > SQL Editor > Run

create table if not exists fournisseurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  logo_url text,
  logo_zoom numeric not null default 1,
  logo_pos_x numeric not null default 50,
  logo_pos_y numeric not null default 50,
  ordre int not null default 0
);

alter table fournisseurs enable row level security;

create policy "Lecture publique fournisseurs"
  on fournisseurs for select
  using (true);

create policy "Ecriture publique fournisseurs (admin, a securiser plus tard)"
  on fournisseurs for all
  using (true)
  with check (true);

-- Reprend automatiquement tous les noms de fournisseurs déjà utilisés
-- dans le catalogue, pour ne rien avoir à ressaisir.
insert into fournisseurs (nom)
select distinct trim(fournisseur) from produits
where fournisseur is not null and trim(fournisseur) <> ''
on conflict (nom) do nothing;
