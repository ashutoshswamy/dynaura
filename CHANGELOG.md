# Changelog

Format: [Keep a Changelog](https://keepachangelog.com). Versions follow semver (0.x: minor bumps may change behavior).

## 0.2.1 - 2026-11-15

### Fixed
- A running toast no longer slips behind the new page during a View Transition (e.g. framework page navigation) and pops back afterwards. The island now has its own `view-transition-name: dynaura`, so it stays on top. Keep one Toaster per page: duplicate transition names make the browser skip the transition.

## 0.2.0 - 2026-11-15

### Added
- Toast options: `id` (update or dedupe by key), `className`, `style`, `onShow`, `onDismiss(reason)`, `onAutoClose`, `onClick`, `secondaryButton`, `custom`.
- `DismissReason`: `"timeout" | "swipe" | "button" | "escape" | "api"`. `dynaura.dismiss(id?, reason?)`.
- `dynaura.custom(node, opts?)`, `dynaura.pause()`, `dynaura.resume()`.
- Toaster options: `maxQueue`, `dedupe` (`"id" | "title"`), `swipe` (`"edge" | "up" | "down" | "both" | "none"`).
- Logical positions `top-start`, `top-end`, `bottom-start`, `bottom-end`, plus logical CSS spacing for RTL.
- `Escape` dismisses the current toast.
- Entry points `dynaura/solid`, `dynaura/angular` and `dynaura/styles-no-font.css`.
- Optional peer dependencies `solid-js` (>=1.6) and `@angular/core` (>=16).
- Vue `<Toaster>` accepts `maxQueue`, `dedupe` and `swipe` props.
- Playground: a "New in 0.2" section exercising the new features, plus Solid and Angular setup snippets.
- Dev-mode `console.warn` when a second Toaster mounts.
- `test/e2e.mjs` real-browser smoke test (`npm run test:e2e`).

### Changed
- Error toasts use `role="alert"` and `aria-live="assertive"`. Other types stay `status` / `polite`.
- A toast replaced by a newer one now fires `onDismiss("api")`.
- Buttons live in a `.dynaura-actions` row. Custom CSS targeting `.dynaura-button` margins may need an update.

## 0.1.2 - 2026-11-14
### Fixed
- Card variant: leaving a card keeps a pill-shaped clip until the morph ends, so the square island no longer flashes.

## 0.1.1 - 2026-11-14
### Fixed
- Card variant: stale clip-path and row offset on exit and on variant switch.

## 0.1.0 - 2026-11-14
- Initial release: spring-morphing island toasts for React, Vue, Svelte and vanilla. Types, queue, promise, progress, live activities, card variant, themes, swipe, haptics, confetti.
