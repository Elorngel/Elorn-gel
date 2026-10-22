-- Mode maintenance (admin → « Site en maintenance ») : les visiteurs voient la page
-- « On revient très vite », les administrateurs connectés continuent de voir le site.
alter table parametres_site add column if not exists en_maintenance boolean not null default false;
alter table parametres_site add column if not exists message_maintenance text;
