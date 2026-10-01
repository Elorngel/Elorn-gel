-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Jusqu'ici, aucune politique n'autorisait la suppression de photos : en
-- changeant la photo d'un produit, l'ancien fichier restait coincé dans le
-- stockage pour toujours (c'est ce qui a fait gonfler l'espace utilisé).
create policy "Suppression publique des photos (admin, à sécuriser plus tard)"
  on storage.objects for delete
  using (bucket_id = 'photos-produits');
