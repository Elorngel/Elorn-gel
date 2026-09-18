-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Questionnaire de conseil produit : occasions, questions filtres, sélections, journal.

-- ─── Configuration (gérée dans l'admin, onglet "Occasions") ───────────────

create table if not exists occasions (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ordre int not null default 0,
  actif boolean not null default true,
  created_at timestamptz default now()
);

-- 2 questions filtres maximum par occasion (ordre 0 = première, 1 = seconde)
create table if not exists occasion_questions (
  id uuid primary key default gen_random_uuid(),
  occasion_id uuid not null references occasions(id) on delete cascade,
  ordre int not null default 0 check (ordre in (0, 1)),
  libelle text not null,
  unique (occasion_id, ordre)
);

create table if not exists occasion_reponses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references occasion_questions(id) on delete cascade,
  libelle text not null,
  ordre int not null default 0
);

-- Une sélection = une combinaison de réponses (une par question) + une intro.
-- reponse_1_id correspond à la question d'ordre 0, reponse_2_id à celle d'ordre 1.
-- Une colonne vide = cette question n'existe pas pour l'occasion.
-- Supprimer une réponse supprime automatiquement les sélections qui l'utilisaient.
create table if not exists occasion_selections (
  id uuid primary key default gen_random_uuid(),
  occasion_id uuid not null references occasions(id) on delete cascade,
  reponse_1_id uuid references occasion_reponses(id) on delete cascade,
  reponse_2_id uuid references occasion_reponses(id) on delete cascade,
  intro text,
  unique nulls not distinct (occasion_id, reponse_1_id, reponse_2_id)
);

create table if not exists occasion_selection_produits (
  id uuid primary key default gen_random_uuid(),
  selection_id uuid not null references occasion_selections(id) on delete cascade,
  produit_id uuid not null references produits(id) on delete cascade,
  ordre int not null default 0,
  unique (selection_id, produit_id)
);

alter table occasions enable row level security;
alter table occasion_questions enable row level security;
alter table occasion_reponses enable row level security;
alter table occasion_selections enable row level security;
alter table occasion_selection_produits enable row level security;

create policy "Lecture publique occasions" on occasions for select using (true);
create policy "Ecriture publique occasions (admin, a securiser plus tard)"
  on occasions for all using (true) with check (true);

create policy "Lecture publique occasion_questions" on occasion_questions for select using (true);
create policy "Ecriture publique occasion_questions (admin, a securiser plus tard)"
  on occasion_questions for all using (true) with check (true);

create policy "Lecture publique occasion_reponses" on occasion_reponses for select using (true);
create policy "Ecriture publique occasion_reponses (admin, a securiser plus tard)"
  on occasion_reponses for all using (true) with check (true);

create policy "Lecture publique occasion_selections" on occasion_selections for select using (true);
create policy "Ecriture publique occasion_selections (admin, a securiser plus tard)"
  on occasion_selections for all using (true) with check (true);

create policy "Lecture publique occasion_selection_produits" on occasion_selection_produits for select using (true);
create policy "Ecriture publique occasion_selection_produits (admin, a securiser plus tard)"
  on occasion_selection_produits for all using (true) with check (true);

-- ─── Journal des interactions ─────────────────────────────────────────────
-- Contrairement aux tables ci-dessus, celle-ci contient les textes libres
-- tapés par les clients : elle n'est PAS lisible avec la clé publique du site.
--   • le site (clé publique) peut seulement AJOUTER une ligne "questionnaire"
--   • les questions libres sont ajoutées par la fonction serveur conseil-produit
-- Pour consulter : Supabase > Table Editor (tables et vues ci-dessous).

create table if not exists conseil_interactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid,                       -- relie les lignes d'une même ouverture de l'assistant
  type text not null check (type in ('questionnaire', 'question_libre')),
  mode text,                             -- 'livraison' ou 'retrait'
  occasion_id uuid references occasions(id) on delete set null,
  occasion_nom text,                     -- copie du texte : reste lisible si l'occasion est renommée/supprimée
  reponses jsonb,                        -- [{ "question": "...", "reponse": "..." }]
  selection_id uuid references occasion_selections(id) on delete set null,
  selection_trouvee boolean,             -- false = combinaison demandée mais aucune sélection remplie
  question_libre text check (char_length(question_libre) <= 500),
  reponse_ia text check (char_length(reponse_ia) <= 3000),
  produits_recommandes jsonb,            -- [{ "id": "...", "nom": "..." }]
  tokens_entree int,                     -- pour suivre le coût réel de l'IA
  tokens_sortie int
);

create index if not exists conseil_interactions_created_idx on conseil_interactions (created_at desc);
create index if not exists conseil_interactions_session_idx on conseil_interactions (session_id);

alter table conseil_interactions enable row level security;

create policy "Ajout public des interactions questionnaire"
  on conseil_interactions for insert
  with check (type = 'questionnaire' and question_libre is null and reponse_ia is null);

-- Vues de lecture pratiques (visibles dans le Table Editor de Supabase).
-- security_invoker + revoke : elles restent illisibles avec la clé publique.

create or replace view conseil_combinaisons_demandees
with (security_invoker = true) as
select
  occasion_nom,
  (select string_agg(r->>'reponse', ' · ') from jsonb_array_elements(coalesce(reponses, '[]'::jsonb)) r) as reponses,
  count(*) as nb_demandes,
  count(*) filter (where selection_trouvee is false) as nb_sans_selection,
  max(created_at) as derniere_demande
from conseil_interactions
where type = 'questionnaire'
group by 1, 2
order by nb_demandes desc;

create or replace view conseil_questions_libres
with (security_invoker = true) as
select
  created_at,
  question_libre as question,
  reponse_ia as reponse,
  produits_recommandes,
  (select s.occasion_nom from conseil_interactions s
    where s.session_id = q.session_id and s.type = 'questionnaire'
    order by s.created_at desc limit 1) as occasion_deja_choisie,
  mode
from conseil_interactions q
where type = 'question_libre'
order by created_at desc;

revoke all on conseil_combinaisons_demandees from anon, authenticated;
revoke all on conseil_questions_libres from anon, authenticated;
