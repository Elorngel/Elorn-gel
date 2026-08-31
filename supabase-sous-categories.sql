-- À coller une seule fois dans Supabase > SQL Editor > Run
-- Ajoute la colonne, puis tente un classement automatique par mots-clés
-- dans le nom du produit. Ce qui ne matche rien reste vide (NULL) :
-- à finir à la main dans l'admin, c'est normal et attendu.

alter table produits add column if not exists sous_categorie text;

-- Viandes et volailles
update produits set sous_categorie = 'Boeuf' where categorie = 'Viandes et volailles' and sous_categorie is null and (nom ilike '%boeuf%' or nom ilike '%steak%' or nom ilike '%hach%' or nom ilike '%entrecote%' or nom ilike '%bavette%' or nom ilike '%onglet%');
update produits set sous_categorie = 'Veau' where categorie = 'Viandes et volailles' and sous_categorie is null and nom ilike '%veau%';
update produits set sous_categorie = 'Porc' where categorie = 'Viandes et volailles' and sous_categorie is null and (nom ilike '%porc%' or nom ilike '%lardon%' or nom ilike '%travers%');
update produits set sous_categorie = 'Agneau' where categorie = 'Viandes et volailles' and sous_categorie is null and (nom ilike '%agneau%' or nom ilike '%gigot%');
update produits set sous_categorie = 'Charcuterie' where categorie = 'Viandes et volailles' and sous_categorie is null and (nom ilike '%charcut%' or nom ilike '%jambon%' or nom ilike '%saucisson%' or nom ilike '%chipolata%' or nom ilike '%merguez%' or nom ilike '%saucisse%');
update produits set sous_categorie = 'Brochettes' where categorie = 'Viandes et volailles' and sous_categorie is null and nom ilike '%brochette%';
update produits set sous_categorie = 'Volailles' where categorie = 'Viandes et volailles' and sous_categorie is null and (nom ilike '%poulet%' or nom ilike '%dinde%' or nom ilike '%canard%' or nom ilike '%volaille%' or nom ilike '%aiguillette%' or nom ilike '%cuisse%');

-- Poissons et fruits de mer
update produits set sous_categorie = 'Saumon et truite' where categorie = 'Poissons et fruits de mer' and sous_categorie is null and (nom ilike '%saumon%' or nom ilike '%truite%');
update produits set sous_categorie = 'Poissons panés' where categorie = 'Poissons et fruits de mer' and sous_categorie is null and (nom ilike '%pané%' or nom ilike '%pane%' or nom ilike '%nugget%' or nom ilike '%meuniere%' or nom ilike '%meunière%');
update produits set sous_categorie = 'Fruits de mer' where categorie = 'Poissons et fruits de mer' and sous_categorie is null and (nom ilike '%crevette%' or nom ilike '%moule%' or nom ilike '%jacques%' or nom ilike '%calamar%' or nom ilike '%gambas%' or nom ilike '%fruits de mer%');
update produits set sous_categorie = 'Poissons blancs' where categorie = 'Poissons et fruits de mer' and sous_categorie is null and (nom ilike '%cabillaud%' or nom ilike '%limande%' or nom ilike '%colin%' or nom ilike '%lieu%' or nom ilike '%merlu%' or nom ilike '%dorade%' or nom ilike '%sole%' or nom ilike '%raie%');

-- Accompagnements
update produits set sous_categorie = 'Pommes de terre' where categorie = 'Accompagnements' and sous_categorie is null and (nom ilike '%pomme de terre%' or nom ilike '%frite%' or nom ilike '%dauphinois%');
update produits set sous_categorie = 'Poêlées' where categorie = 'Accompagnements' and sous_categorie is null and (nom ilike '%poelee%' or nom ilike '%poêlée%');
update produits set sous_categorie = 'Légumes' where categorie = 'Accompagnements' and sous_categorie is null and (nom ilike '%legume%' or nom ilike '%légume%' or nom ilike '%haricot%' or nom ilike '%carotte%' or nom ilike '%epinard%' or nom ilike '%épinard%' or nom ilike '%brocoli%' or nom ilike '%petit pois%');

-- Entrées et apéritifs
update produits set sous_categorie = 'Feuilletés' where categorie = 'Entrées et apéritifs' and sous_categorie is null and nom ilike '%feuillet%';
update produits set sous_categorie = 'Bouchées' where categorie = 'Entrées et apéritifs' and sous_categorie is null and nom ilike '%bouchee%';
update produits set sous_categorie = 'Pizzas' where categorie = 'Entrées et apéritifs' and sous_categorie is null and nom ilike '%pizza%';
update produits set sous_categorie = 'Snacking' where categorie = 'Entrées et apéritifs' and sous_categorie is null and (nom ilike '%croque%' or nom ilike '%panini%' or nom ilike '%sandwich%');
update produits set sous_categorie = 'Apéritif' where categorie = 'Entrées et apéritifs' and sous_categorie is null and (nom ilike '%aperitif%' or nom ilike '%apéritif%' or nom ilike '%toast%');

-- Plats cuisinés
update produits set sous_categorie = 'Saveurs d''Asie' where categorie = 'Plats cuisinés' and sous_categorie is null and (nom ilike '%nem%' or nom ilike '%wok%' or nom ilike '%cantonais%' or nom ilike '%asie%');
update produits set sous_categorie = 'Plats à partager' where categorie = 'Plats cuisinés' and sous_categorie is null and (nom ilike '%partager%' or nom ilike '%familial%');
update produits set sous_categorie = 'Plats individuels' where categorie = 'Plats cuisinés' and sous_categorie is null and (nom ilike '%individuel%' or nom ilike '%barquette%');

-- Desserts et glaces
update produits set sous_categorie = 'Viennoiseries' where categorie = 'Desserts et glaces' and sous_categorie is null and (nom ilike '%croissant%' or nom ilike '%chausson%' or nom ilike '%pain au chocolat%');
update produits set sous_categorie = 'Pâtisseries' where categorie = 'Desserts et glaces' and sous_categorie is null and (nom ilike '%tarte%' or nom ilike '%gateau%' or nom ilike '%gâteau%' or nom ilike '%eclair%' or nom ilike '%millefeuille%');
update produits set sous_categorie = 'Glaces et bâtonnets' where categorie = 'Desserts et glaces' and sous_categorie is null and (nom ilike '%batonnet%' or nom ilike '%bâtonnet%' or nom ilike '%cone%' or nom ilike '%cornet%' or nom ilike '%esquimau%');
update produits set sous_categorie = 'Fruits' where categorie = 'Desserts et glaces' and sous_categorie is null and nom ilike '%fruit%';

-- Épicerie et boissons
update produits set sous_categorie = 'Boissons' where categorie = 'Épicerie et boissons' and sous_categorie is null and (nom ilike '%jus%' or nom ilike '%boisson%' or nom ilike '%cubi%');
