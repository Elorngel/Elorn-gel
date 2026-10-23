-- Emails de commande envoyés une seule fois par commande (fonction send-order-emails, 23/10/2026).
alter table commandes add column if not exists email_envoye_le timestamptz;
