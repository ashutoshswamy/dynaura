Open Graph image for the dynaura docs site: `og.png` (2400x1260), `og-1200.png` (1200x630), the editable `index.html`, and `meta.html` with the tags to paste into the site's `<head>`.
Re-render with `node og-image/render.mjs` (needs `playwright-core` and Chrome; or set `PLAYWRIGHT_CORE_DIR` to a folder that has it in `node_modules`). `img/` holds the toast screenshots from `assets/`, trimmed to their visible bounds.
In the docs site, copy `og.png` into the static folder (`public/og.png` or the framework's equivalent) so it is served at `/og.png`, then paste `meta.html` into the `<head>`.
