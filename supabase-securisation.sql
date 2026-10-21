-- Étape 2 : verrouillage des accès (à appliquer APRÈS la mise en ligne du code des comptes
-- et la création des comptes admin, sinon l'admin ne peut plus rien modifier).
-- Avant : tout le monde pouvait lire les commandes et modifier le catalogue avec la clé publique.
-- Après : le public lit le catalogue ; seuls les administrateurs connectés le modifient ;
-- chaque client ne voit que ses propres commandes.

do $$
declare r record;
begin
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in (
      'categories', 'sous_categories', 'produits', 'variantes_produit', 'produits_accompagnements',
      'fournisseurs', 'parametres_site', 'occasions', 'occasion_questions', 'occasion_reponses',
      'occasion_selections', 'occasion_selection_produits', 'commandes', 'commande_lignes')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Catalogue et réglages : lecture pour tous, modification réservée aux administrateurs.
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'sous_categories', 'produits', 'variantes_produit', 'produits_accompagnements',
    'fournisseurs', 'parametres_site', 'occasions', 'occasion_questions', 'occasion_reponses',
    'occasion_selections', 'occasion_selection_produits']
  loop
    execute format('create policy "Lecture publique" on public.%I for select using (true)', t);
    execute format('create policy "Modification par un admin" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Commandes : un client connecté crée et voit les siennes ; l'admin voit et gère tout.
create policy "Client : passer commande" on public.commandes
  for insert to authenticated with check (client_id = auth.uid());
create policy "Client : voir ses commandes" on public.commandes
  for select using (client_id = auth.uid() or public.is_admin());
create policy "Admin : modifier les commandes" on public.commandes
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admin : supprimer les commandes" on public.commandes
  for delete using (public.is_admin());

create policy "Client : lignes de ses commandes" on public.commande_lignes
  for insert to authenticated
  with check (exists (select 1 from public.commandes c where c.id = commande_id and c.client_id = auth.uid()));
create policy "Client : voir les lignes de ses commandes" on public.commande_lignes
  for select using (
    public.is_admin()
    or exists (select 1 from public.commandes c where c.id = commande_id and c.client_id = auth.uid()));
create policy "Admin : gérer les lignes" on public.commande_lignes
  for all using (public.is_admin()) with check (public.is_admin());

-- Photos : lecture publique, envoi et suppression réservés aux administrateurs.
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (policyname like 'Upload public des photos%' or policyname like 'Suppression publique des photos%')
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;
drop policy if exists "Envoi de photos par un admin" on storage.objects;
drop policy if exists "Remplacement de photos par un admin" on storage.objects;
drop policy if exists "Suppression de photos par un admin" on storage.objects;
create policy "Envoi de photos par un admin" on storage.objects
  for insert with check (bucket_id = 'photos-produits' and public.is_admin());
create policy "Remplacement de photos par un admin" on storage.objects
  for update using (bucket_id = 'photos-produits' and public.is_admin());
create policy "Suppression de photos par un admin" on storage.objects
  for delete using (bucket_id = 'photos-produits' and public.is_admin());
