-- Consentement aux offres par SMS (16/11/2026) : case sous le téléphone à la création du compte et dans « Mon compte ».
-- Non cochée par défaut (accord explicite obligatoire pour la prospection par SMS). La date du dernier accord est gardée
-- comme preuve (sms_consenti_le), remise à vide si le client retire son accord.
alter table clients add column if not exists accepte_sms boolean not null default false;
alter table clients add column if not exists sms_consenti_le timestamptz;

create or replace function public.clients_consentement_sms() returns trigger
language plpgsql as $$
begin
  if new.accepte_sms and (tg_op = 'INSERT' or not coalesce(old.accepte_sms, false)) then
    new.sms_consenti_le := now();
  elsif not new.accepte_sms then
    new.sms_consenti_le := null;
  end if;
  return new;
end $$;

drop trigger if exists clients_consentement_sms on clients;
create trigger clients_consentement_sms before insert or update of accepte_sms on clients
  for each row execute function public.clients_consentement_sms();

-- Le client peut modifier lui-même ce choix (comme accepte_offres) ; la date, elle, n'est posée que par le déclencheur.
grant update (accepte_sms) on clients to authenticated;
