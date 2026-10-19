-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Calendrier (admin → onglet « Calendrier ») :
--  jours_fermes : { "2026-11-11": "tout" | "retrait" | "livraison" }
--  creneaux_indisponibles : { "retrait": { "1": ["12h00 - 12h30", …] }, "livraison": { "3": ["12h00 - 14h00 (midi)"] } }
--  (clé = jour de la semaine, 1 = lundi … 5 = vendredi)
alter table parametres_site add column if not exists jours_fermes jsonb;
alter table parametres_site add column if not exists creneaux_indisponibles jsonb;

-- Horaires spéciaux pour une date précise (passent avant les créneaux habituels de la semaine) :
--  horaires_speciaux : { "2026-11-12": { "livraison": ["9h00 - 12h00 (matin)"], "retrait": ["8h00 - 8h30", …] } }
--  (liste = créneaux OUVERTS ce jour-là ; type absent = horaires habituels ; liste vide = fermé)
alter table parametres_site add column if not exists horaires_speciaux jsonb;
