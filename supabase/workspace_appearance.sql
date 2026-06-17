-- Widget appearance preference.
-- Controls the colour scheme of the embeddable widget (and its iframe drawer):
--  'auto' → follows the host page / visitor's prefers-color-scheme (default)
--  'dark' → always dark
--  'light' → always light
alter table public.workspaces
 add column if not exists widget_theme text not null default 'auto';

alter table public.workspaces
 drop constraint if exists workspaces_widget_theme_check;

alter table public.workspaces
 add constraint workspaces_widget_theme_check
 check (widget_theme in ('auto', 'dark', 'light'));
