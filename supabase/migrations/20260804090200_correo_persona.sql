-- ─────────────────────────────────────────────────────────────────────────
--  Correo electrónico como segundo contacto, junto a teléfono. Opcional
--  igual que teléfono: el programa siempre ha funcionado con teléfono como
--  contacto principal, no hay razón para exigir correo ahora.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.persona add column correo text;

comment on column public.persona.correo is 'Contacto opcional adicional al teléfono. Formato validado en la aplicación, no aquí.';
