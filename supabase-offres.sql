-- Codes promo, bons d'achat et parrainage (23/10/2026).
-- Les commandes sont désormais enregistrées par la fonction serveur `passer-commande`, qui
-- recalcule les prix et applique code promo et bon d'achat (voir aussi supabase-verrou-commandes.sql).

-- Réglages du parrainage (admin → onglet « Offres »)
alter table parametres_site add column if not exists parrainage_actif boolean not null default true;
alter table parametres_site add column if not exists parrainage_montant numeric not null default 25;
alter table parametres_site add column if not exists parrainage_minimum numeric not null default 50;
alter table parametres_site add column if not exists parrainage_validite_mois integer not null default 1;

-- Détail des remises sur la commande
alter table commandes add column if not exists sous_total numeric;
alter table commandes add column if not exists code_promo text;
alter table commandes add column if not exists remise_code numeric not null default 0;
alter table commandes add column if not exists remise_bon numeric not null default 0;
alter table commandes add column if not exists bon_id uuid;
alter table commandes add column if not exists saisie_par_admin boolean not null default false;
alter table commande_lignes add column if not exists variante_id uuid;

-- Codes promo : jamais lisibles par le public (sinon on pourrait lister tous les codes) ;
-- le panier les vérifie avec la fonction verifier_code_promo ci-dessous.
create table if not exists codes_promo (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{3,30}$'),
  pourcentage numeric not null check (pourcentage > 0 and pourcentage <= 100),
  max_utilisations integer check (max_utilisations is null or max_utilisations > 0),
  debut date,
  fin date,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
alter table codes_promo enable row level security;
drop policy if exists "Codes promo : admin" on codes_promo;
create policy "Codes promo : admin" on codes_promo for all using (public.is_admin()) with check (public.is_admin());

-- Un code ne sert qu'une fois par compte client (les commandes saisies par un admin pour un
-- client au téléphone ne comptent pas pour le compte de l'admin).
create unique index if not exists commandes_code_une_fois_par_compte
  on commandes (code_promo, client_id) where code_promo is not null and not saisie_par_admin;

insert into codes_promo (code, pourcentage, max_utilisations)
values ('BIENVENUE10', 10, 50)
on conflict (code) do nothing;

-- Parrainage : chaque client a un code ; le filleul le saisit en créant son compte.
alter table clients add column if not exists code_parrain text unique;
alter table clients add column if not exists parrain_id uuid references clients(id) on delete set null;

create or replace function public.nouveau_code_parrain(p_prenom text)
returns text language plpgsql set search_path = public as $$
declare
  base text;
  essai text;
  i int := 0;
begin
  base := upper(regexp_replace(
    translate(coalesce(p_prenom, ''),
      'àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
      'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'),
    '[^A-Za-z]', '', 'g'));
  base := left(coalesce(nullif(base, ''), 'BONTIN'), 8);
  loop
    i := i + 1;
    essai := base || lpad(floor(random() * (case when i < 20 then 100 else 10000 end))::int::text,
                          case when i < 20 then 2 else 4 end, '0');
    exit when not exists (select 1 from clients where code_parrain = essai);
  end loop;
  return essai;
end $$;

create or replace function public.clients_code_parrain()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.code_parrain is null then
    new.code_parrain := public.nouveau_code_parrain(new.prenom);
  end if;
  return new;
end $$;

drop trigger if exists clients_code_parrain on clients;
create trigger clients_code_parrain before insert on clients
  for each row execute function public.clients_code_parrain();

update clients set code_parrain = public.nouveau_code_parrain(prenom) where code_parrain is null;

-- Un client ne peut modifier que ses coordonnées (pas son code parrain ni son parrain).
revoke update on clients from anon, authenticated;
grant update (prenom, nom, telephone, date_naissance, adresse, code_postal, ville, complement, accepte_offres)
  on clients to authenticated;

-- Bons d'achat (parrainage, et plus tard anniversaire) : créés uniquement par le serveur.
create table if not exists bons_achat (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  montant numeric not null check (montant > 0),
  minimum_commande numeric not null default 0,
  motif text not null check (motif in ('parrainage_filleul', 'parrainage_parrain', 'anniversaire', 'geste')),
  filleul_id uuid references clients(id) on delete set null,
  valable_jusqu_au timestamptz not null,
  commande_id uuid references commandes(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table bons_achat enable row level security;
drop policy if exists "Bons : voir les siens" on bons_achat;
create policy "Bons : voir les siens" on bons_achat for select using (client_id = auth.uid() or public.is_admin());
drop policy if exists "Bons : admin" on bons_achat;
create policy "Bons : admin" on bons_achat for all using (public.is_admin()) with check (public.is_admin());
-- Un seul bon « parrain » par filleul.
create unique index if not exists bons_un_par_filleul on bons_achat (filleul_id) where motif = 'parrainage_parrain';

-- Vérification d'un code promo depuis le panier (sans révéler la liste des codes).
create or replace function public.verifier_code_promo(p_code text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  c codes_promo;
  nb int;
  aujourdhui date := (now() at time zone 'Europe/Paris')::date;
begin
  select * into c from codes_promo where code = upper(trim(coalesce(p_code, '')));
  if not found or not c.actif then
    return json_build_object('ok', false, 'message', 'Ce code n''existe pas ou n''est plus valable.');
  end if;
  if c.debut is not null and aujourdhui < c.debut then
    return json_build_object('ok', false, 'message', 'Ce code n''est pas encore valable.');
  end if;
  if c.fin is not null and aujourdhui > c.fin then
    return json_build_object('ok', false, 'message', 'Ce code a expiré.');
  end if;
  select count(*) into nb from commandes where code_promo = c.code;
  if c.max_utilisations is not null and nb >= c.max_utilisations then
    return json_build_object('ok', false, 'message', 'Ce code a déjà été utilisé le nombre maximum de fois.');
  end if;
  if auth.uid() is not null and not public.is_admin() and exists (
    select 1 from commandes where code_promo = c.code and client_id = auth.uid() and not saisie_par_admin
  ) then
    return json_build_object('ok', false, 'message', 'Vous avez déjà utilisé ce code.');
  end if;
  return json_build_object(
    'ok', true,
    'code', c.code,
    'pourcentage', c.pourcentage,
    'restantes', case when c.max_utilisations is null then null else c.max_utilisations - nb end
  );
end $$;
grant execute on function public.verifier_code_promo(text) to anon, authenticated;

-- Nombre d'utilisations de chaque code (onglet « Offres » de l'admin).
create or replace function public.utilisations_codes_promo()
returns table (code text, utilisations bigint) language sql stable security definer set search_path = public as $$
  select code_promo, count(*) from commandes where code_promo is not null and public.is_admin() group by code_promo
$$;
grant execute on function public.utilisations_codes_promo() to authenticated;

-- Récompense du parrain : quand la 1re commande d'au moins le minimum (hors frais de livraison)
-- de son filleul passe en « Livrée / retirée », le parrain reçoit son bon.
create or replace function public.recompenser_parrain()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  f clients;
  r parametres_site;
begin
  if new.statut is distinct from 'livree' or old.statut = 'livree' or new.saisie_par_admin then
    return new;
  end if;
  select * into f from clients where id = new.client_id;
  if not found or f.parrain_id is null then
    return new;
  end if;
  select * into r from parametres_site where id = 1;
  if not coalesce(r.parrainage_actif, false) then
    return new;
  end if;
  if coalesce(new.sous_total, new.total - coalesce(new.frais_livraison, 0)) < r.parrainage_minimum then
    return new;
  end if;
  insert into bons_achat (client_id, montant, minimum_commande, motif, filleul_id, valable_jusqu_au)
  values (f.parrain_id, r.parrainage_montant, r.parrainage_minimum, 'parrainage_parrain', f.id,
          now() + make_interval(months => r.parrainage_validite_mois))
  on conflict (filleul_id) where motif = 'parrainage_parrain' do nothing;
  return new;
end $$;

drop trigger if exists commandes_recompense_parrain on commandes;
create trigger commandes_recompense_parrain after update of statut on commandes
  for each row execute function public.recompenser_parrain();
