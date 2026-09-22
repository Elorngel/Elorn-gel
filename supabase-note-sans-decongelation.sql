-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Texte optionnel affiché sous "Sans décongélation préalable" (ex : "à cuire directement à la poêle")
alter table produits add column if not exists note_sans_decongelation text;
