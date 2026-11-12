-- 12/11/2026 : « mot de passe oublié ». Journal des demandes, pour limiter les envois (3 par heure et par
-- adresse, 30 par heure en tout). Lisible et modifiable par la seule fonction serveur (aucune règle d'accès).
create table if not exists demandes_mot_de_passe (
  id bigint generated always as identity primary key,
  email text not null,
  created_at timestamptz not null default now()
);
create index if not exists demandes_mot_de_passe_email on demandes_mot_de_passe (email, created_at);
alter table demandes_mot_de_passe enable row level security;
