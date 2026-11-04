-- Horaires en plages libres (05/11/2026), réglées dans l'admin → Calendrier.
-- horaires_semaine : { retrait: { "1": [[510, 720], [840, 1050]], … }, livraison: { "1": [[540, 720], …] } }
-- horaires_jours   : { "2026-12-24": { retrait: [[480, 720]], livraison: [] } }   (liste vide = fermé)
-- Heures en minutes depuis minuit. Retrait : découpé en créneaux de 30 min ; livraison : une plage = un créneau.
alter table parametres_site add column if not exists horaires_semaine jsonb;
alter table parametres_site add column if not exists horaires_jours jsonb;
