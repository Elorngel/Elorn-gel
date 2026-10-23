-- À appliquer APRÈS la mise en ligne du site qui passe par la fonction `passer-commande`
-- (23/10/2026). Les clients ne peuvent plus écrire directement dans les commandes : seule la
-- fonction serveur le fait, après avoir recalculé les prix, le code promo et le bon d'achat.
drop policy if exists "Client : passer commande" on commandes;
drop policy if exists "Client : lignes de ses commandes" on commande_lignes;
