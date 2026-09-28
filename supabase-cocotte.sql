-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Mode de cuisson "Cocotte" (même principe que les autres : temps_<mode>)
alter table produits add column if not exists temps_cocotte text;
