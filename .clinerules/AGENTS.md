Use Vue 3 with Options API, SCSS, Element Plus, and Yarn. Code must be consistent: camelCase for JS, kebab-case for CSS and components, component filenames with capital letters. Write async calls only with .then().catch. Project structure includes assets, components, composables, layout, pages, store, services, styles, and router. Components are ordered as template, script (name, props, data, computed, methods, watch), and scoped style, with imports always above export default. Styles are split into variables.scss for variables, themes.scss for light/dark themes using CSS variables switched via data-theme on html/body, and main.scss as the entry point and global rules. All CSS colors must be in hsl. Use Element Plus components by default, applying the current color scheme and rules, overriding native styles in main.scss. The interface must be very compact with minimal paddings.
Database schema
CREATE TABLE public.tours (
id uuid NOT NULL DEFAULT gen_random_uuid(),
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp without time zone NOT NULL DEFAULT now(),
name text NOT NULL,
data jsonb,
owner_id uuid,
CONSTRAINT tours_pkey PRIMARY KEY (id),
CONSTRAINT tours_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);