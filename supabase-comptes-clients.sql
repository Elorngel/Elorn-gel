-- Étape 1 (ajouts seulement, sans effet sur le site existant) — appliquée le 21/10/2026.
-- Comptes clients (créés côté serveur par la fonction `creer-compte`) et comptes admin.

create table if not exists public.clients (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  prenom text not null,
  nom text not null,
  telephone text not null,
  date_naissance date not null,
  adresse text not null,
  code_postal text not null,
  ville text not null,
  complement text,
  accepte_offres boolean not null default false,
  source text,
  cgv_acceptees_le timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.clients enable row level security;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nom text not null
);
alter table public.admins enable row level security;

-- Vrai si la personne connectée est un administrateur (Sylvie, Romuald…).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Admin : se reconnaitre" on public.admins;
create policy "Admin : se reconnaitre" on public.admins for select using (user_id = auth.uid());

drop policy if exists "Client : voir sa fiche" on public.clients;
create policy "Client : voir sa fiche" on public.clients for select using (id = auth.uid() or public.is_admin());
drop policy if exists "Client : modifier sa fiche" on public.clients;
create policy "Client : modifier sa fiche" on public.clients for update using (id = auth.uid()) with check (id = auth.uid());

-- Chaque commande est rattachée au compte qui l'a passée (vide pour les anciennes commandes).
alter table public.commandes add column if not exists client_id uuid references auth.users(id) on delete set null;
create index if not exists commandes_client_id_idx on public.commandes (client_id);

-- « Supprimer mon compte » (droit RGPD) : efface la fiche et l'accès. Les commandes passées
-- sont conservées pour la comptabilité, détachées du compte.
create or replace function public.supprimer_mon_compte() returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  delete from public.clients where id = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
