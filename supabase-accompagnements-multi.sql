-- À coller une seule fois dans Supabase > SQL Editor > Run

create table if not exists produits_accompagnements (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid references produits(id) on delete cascade,
  produit_associe_id uuid references produits(id) on delete cascade,
  ordre int not null default 0
);

alter table produits_accompagnements enable row level security;

create policy "Lecture publique accompagnements"
  on produits_accompagnements for select
  using (true);

create policy "Ecriture publique accompagnements (admin, a securiser plus tard)"
  on produits_accompagnements for all
  using (true)
  with check (true);

-- Reprend l'ancienne suggestion unique déjà en place (si tu en avais choisi une)
insert into produits_accompagnements (produit_id, produit_associe_id, ordre)
select id, produit_associe_id, 0
from produits
where produit_associe_id is not null;
