<div align="center">

# dynaura

**Dynamic Island toasts for the web.**<br />
One pill that spring-morphs between states, swipes away, and stays out of your way.

[![npm version](https://img.shields.io/npm/v/dynaura?color=15140f&label=npm)](https://www.npmjs.com/package/dynaura)
[![license](https://img.shields.io/badge/license-MIT-15140f)](./LICENSE)
[![types](https://img.shields.io/badge/types-included-3178c6)](#typescript)
[![dependencies](https://img.shields.io/badge/dependencies-0-30d158)](./package.json)

[**Documentation**](https://dynaura.ashutoshswamy.in) &nbsp;·&nbsp; [GitHub](https://github.com/ashutoshswamy/dynaura) &nbsp;·&nbsp; [Report a bug](https://github.com/ashutoshswamy/dynaura/issues)

</div>

<br />

```tsx
dynaura.success({ title: "Saved", description: "Your changes are live." });
```

That is the whole setup: mount one `<Toaster />`, call `dynaura` from anywhere.

## Contents

[Why dynaura](#why-dynaura) · [Install](#install) · [Quick start](#quick-start) · [Recipes](#recipes) · [API](#api) · [Gestures](#gestures) · [Theming](#theming) · [Accessibility](#accessibility) · [Browser support](#browser-support) · [Troubleshooting](#troubleshooting) · [Development](#development) · [Author](#author)

## Why dynaura

|                               |                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **One island, real motion**   | A single pill morphs between compact and expanded using a CSS `linear()` spring. No animation library.                                      |
| **Rich cards**                | `variant: "card"` turns the toast into a header tab plus any custom body, joined by a curved notch. Flight passes, ride trackers, receipts. |
| **Live activities**           | Sticky toasts with a running timer or an animated waveform.                                                                                 |
| **Progress that feels alive** | A value bar and rolling digits, updated in place with `dynaura.update`.                                                                     |
| **Built for touch**           | Swipe to dismiss, tap or long-press to pin, hover to pause.                                                                                 |
| **Themeable**                 | Dark, light, system, or your own colors. Everything is a CSS variable.                                                                      |
| **Any framework**             | React, Vue, Svelte, or plain JS, all on one shared core.                                                                                    |
| **Light and accessible**      | Zero dependencies, typed, `aria-live`, and `prefers-reduced-motion` respected.                                                              |

## Install

```sh
npm install dynaura
```

## Quick start

Mount **one** `Toaster`, import the stylesheet once, then call `dynaura` from anywhere.

### React

```tsx
import { Toaster, dynaura } from "dynaura";
import "dynaura/styles.css";

export default function App() {
  return (
    <>
      <Toaster />
      <button
        onClick={() =>
          dynaura.success({
            title: "Saved",
            description: "Your changes are live.",
          })
        }
      >
        Save
      </button>
    </>
  );
}
```

Works with Next.js App Router: the bundle ships with `"use client"`, so render `<Toaster />` from a client component or your root layout.

<details>
<summary><b>Vue</b></summary>

```vue
<script setup>
import { Toaster, dynaura } from "dynaura/vue";
import "dynaura/styles.css";
</script>

<template>
  <Toaster position="top" theme="system" />
  <button @click="dynaura.success('Saved')">Save</button>
</template>
```

</details>

<details>
<summary><b>Svelte</b></summary>

```svelte
<script>
  import { toaster, dynaura } from "dynaura/svelte";
  import "dynaura/styles.css";
</script>

<div use:toaster={{ position: "top", theme: "system" }} />
<button on:click={() => dynaura.success("Saved")}>Save</button>
```

</details>

<details>
<summary><b>Vanilla JS</b></summary>

```js
import { createToaster, dynaura } from "dynaura/vanilla";
import "dynaura/styles.css";

const toaster = createToaster({ position: "top" });
dynaura.info("Hello");
// toaster.destroy() to unmount
```

</details>

## Recipes

### Success, error and actions

```ts
dynaura.error({
  title: "Payment failed",
  description: "Card ending 4242 was declined.",
  button: { title: "Retry", onClick: retry },
});
```

The island expands to show the description and button, then collapses before it dismisses. A `button` click dismisses the toast.

### Promises

```ts
dynaura.promise(save(), {
  loading: "Saving…",
  success: (data) => ({ title: "Saved", description: `Version ${data.v}` }),
  error: { title: "Failed", description: "Check your connection." },
});
```

The same island morphs from loading to success or error. `success` and `error` can be strings, option objects, or functions of the result. The original promise is returned.

### Progress

```ts
const id = dynaura.loading({ title: "Uploading", progress: 0 });

onProgress((p) => dynaura.update(id, { progress: p })); // 0 to 1

dynaura.update(id, {
  type: "success",
  title: "Upload complete",
  progress: undefined, // clear the bar
  duration: 4000,
  confetti: true,
});
```

Frequent `progress` updates do not restart the toast.

### Live activities

```ts
dynaura.live({
  title: "Recording voice memo",
  button: { title: "Stop", onClick: stop },
});

dynaura.live({ title: "Now playing", kind: "wave" }); // animated waveform instead of a timer
```

### Rich cards

```tsx
dynaura.info({
  title: "Boarding soon",
  trailing: "40 min",
  variant: "card",
  duration: 9000,
  description: <BoardingPass />, // any React node (or a DOM Node in Vue, Svelte and vanilla)
  button: { title: "Show boarding pass", onClick: openPass },
});
```

Card content inherits the toast colors through `var(--dynaura-fg)`, `var(--dynaura-muted)` and `var(--state)`, so it follows any theme. It looks best with `theme="light"`. The header tab follows `position`: centered for `top` and `bottom`, flush to the edge for `-left` and `-right`.

### Queue

```ts
// show toasts one after another instead of replacing the current one
<Toaster queue />

// or per toast
dynaura.info({ title: "Invite sent to Maya", queue: true, duration: 1600 });
```

### Custom icons and trailing slots

```tsx
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

dynaura.info({
  title: "Design sync starts soon",
  icon: <CalendarDaysIcon width={16} height={16} />, // replaces the built-in icon
  trailing: "5 min", // small right-side slot
});
```

## API

### `dynaura`

| Method                                                     | Description                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `success(opts)` `error(opts)` `warning(opts)` `info(opts)` | Show a toast. `opts` is a string (title only) or an options object. Returns the toast id. |
| `loading(opts)`                                            | Sticky toast with a spinner.                                                              |
| `live(opts)`                                               | Live activity: sticky, with a running timer (default) or a waveform (`kind: "wave"`).     |
| `promise(promise, { loading, success, error })`            | Morphs loading into success or error. Returns the original promise.                       |
| `update(id, patch)`                                        | Patch a toast in place, including `type`. Also works on queued toasts.                    |
| `dismiss(id?)`                                             | Dismiss the current toast (the next queued one shows) or a specific id.                   |
| `clear()`                                                  | Dismiss everything, including the queue.                                                  |

### Toast options

| Option        | Type                          | Default           | Description                                                             |
| ------------- | ----------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `title`       | `string`                      | required          | Main text.                                                              |
| `description` | `string \| Node \| ReactNode` |                   | Shown when the island expands.                                          |
| `icon`        | same                          | built-in          | Replaces the leading icon.                                              |
| `trailing`    | same                          |                   | Small right-side slot, e.g. `"2 min"`.                                  |
| `duration`    | `number \| null`              | `4000`            | Milliseconds. `null` is sticky. `loading` and `live` default to `null`. |
| `button`      | `{ title, onClick }`          |                   | Action button. The toast dismisses after the click.                     |
| `progress`    | `number` (0 to 1)             |                   | Value bar plus rolling-digit percent.                                   |
| `confetti`    | `boolean`                     | `false`           | Confetti burst when shown. Skipped under reduced motion.                |
| `kind`        | `"timer" \| "wave"`           | `"timer"`         | Flavor of a `live` toast.                                               |
| `variant`     | `"default" \| "card"`         | `"default"`       | `"card"`: header tab plus a full-bleed custom body.                     |
| `queue`       | `boolean`                     | Toaster's `queue` | Per-toast override of the Toaster option.                               |

> Strings are always inserted as text, never as HTML.
> React nodes work in the React adapter. Vue, Svelte and vanilla accept strings or DOM nodes.

### `<Toaster />` and `createToaster()` options

| Option     | Type                                                                           | Default  | Description                                              |
| ---------- | ------------------------------------------------------------------------------ | -------- | -------------------------------------------------------- |
| `position` | `"top"` `"top-left"` `"top-right"` `"bottom"` `"bottom-left"` `"bottom-right"` | `"top"`  | Where the island sits.                                   |
| `offset`   | `number`                                                                       | `12`     | Pixels from the screen edge. Safe-area insets are added. |
| `theme`    | `"dark" \| "light" \| "system" \| CustomTheme`                                 | `"dark"` | See [Theming](#theming).                                 |
| `queue`    | `boolean`                                                                      | `false`  | Show toasts one after another.                           |
| `timer`    | `boolean`                                                                      | `true`   | Thin time-remaining bar on timed toasts.                 |
| `haptics`  | `boolean`                                                                      | `true`   | `navigator.vibrate` on show. A no-op where unsupported.  |

Mount **one** Toaster per page.

### Entry points

| Import               | Use                                  |
| -------------------- | ------------------------------------ |
| `dynaura`            | React: `Toaster`, `dynaura`          |
| `dynaura/vue`        | Vue 3: `Toaster`, `dynaura`          |
| `dynaura/svelte`     | Svelte: `toaster` action, `dynaura`  |
| `dynaura/vanilla`    | Plain JS: `createToaster`, `dynaura` |
| `dynaura/styles.css` | The stylesheet. Import it once.      |

### TypeScript

Types ship with the package: `ToastOptions`, `ToastType`, `ToasterProps`, `CustomTheme`, `Position` and `Content`.

```ts
import type { ToastOptions, CustomTheme } from "dynaura";
```

## Gestures

| Gesture                          | Result                                                                  |
| -------------------------------- | ----------------------------------------------------------------------- |
| **Hover** (mouse)                | Expands and pauses the timer. Leaving resumes with the exact time left. |
| **Tap**                          | Pins an expandable toast open and paused. Tap outside to unpin.         |
| **Long-press**                   | Pins, with haptic feedback.                                             |
| **Swipe** toward the screen edge | Dismisses. A short swipe snaps back.                                    |

## Theming

```tsx
<Toaster theme="light" />
<Toaster theme="system" />   {/* follows the OS */}
<Toaster theme={{ background: "#2b1055", foreground: "#ffffff", success: "#7cffcb" }} />
```

`CustomTheme` keys take any CSS color, and all are optional: `background`, `foreground`, `muted`, `ring`, `button`, `success`, `error`, `warning`, `info`, `loading`, `live`. Missing keys fall back to the dark theme.

Everything is a CSS variable, so you can also override styles directly:

```css
.dynaura-root {
  --dynaura-font: "Inter", system-ui, sans-serif;
  --dynaura-duration: 500ms; /* morph speed */
  --dynaura-success: #00c853;
}
```

### Font

The default font is [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque). `dynaura/styles.css` loads it from Google Fonts with an `@import` on its first line. To self-host or skip the request, copy the stylesheet without that line and set `--dynaura-font`.

## Accessibility

- The island has `role="status"` and `aria-live="polite"`.
- Action buttons are keyboard focusable, with a visible focus ring.
- Under `prefers-reduced-motion: reduce`, motion is cut to near-instant. Loading spinners keep spinning.
- Rolling digits expose their value through `aria-label`.
- Text is rendered as text. Toast strings can never inject HTML.

## Browser support

Modern evergreen browsers. The morph uses CSS `linear()` easing (Chrome 113+, Safari 17.2+, Firefox 112+) and `color-mix()`. Older browsers fall back to a bounce curve. Without `color-mix()` support, tinted backgrounds fall back to a neutral tint.

Tested in Chrome and WebKit with Playwright. Firefox has not been verified yet.

## Troubleshooting

<details>
<summary><b>Nothing appears</b></summary>

Check that `<Toaster />` is mounted once and that `dynaura/styles.css` is imported. Without the stylesheet the island renders unstyled.

</details>

<details>
<summary><b>The font is wrong, or I need to avoid Google Fonts</b></summary>

The stylesheet's first line is an `@import` for Bricolage Grotesque. Copy the stylesheet without it, or set `--dynaura-font` to your own font. This is also the fix for a strict Content Security Policy.

</details>

<details>
<summary><b>Can I have more than one Toaster?</b></summary>

No. State is a single global, so mount one Toaster per page.

</details>

<details>
<summary><b>Does it work with SSR?</b></summary>

Yes. The Toaster renders nothing on the server and mounts on the client. Calling `dynaura.*` on the server only sets state and shows nothing.

</details>

<details>
<summary><b>The toast sits under the notch or home indicator on iOS</b></summary>

Add `viewport-fit=cover` to your viewport meta tag. dynaura adds `env(safe-area-inset-*)` to the offset.

</details>

<details>
<summary><b>My description is a React component but it does not show in Vue or Svelte</b></summary>

React nodes only work in the React adapter. In Vue, Svelte and vanilla, pass a string or a DOM `Node`.

</details>

## Development

```sh
git clone https://github.com/ashutoshswamy/dynaura.git
cd dynaura
npm install
npm run dev     # local test playground (not the docs site): imports src/ directly
npm test        # vitest + jsdom
npm run build   # tsup, outputs dist/
```

The playground at `http://localhost:5173` exercises every feature: themes (with live color pickers for custom), positions, queue, the timer bar, rich cards, and copyable code for each example. The code shown there comes from the files that run, so it cannot drift.

<details>
<summary><b>How it works</b></summary>

- **One island.** A single DOM element holds the current toast. A new toast morphs it instead of stacking, unless `queue` is on.
- **Size morph.** The core measures the compact row and the expanded content, then transitions `width`, `height` and `border-radius` between them with a CSS `linear()` spring.
- **Card variant.** The header tab and body are drawn as one `clip-path`. The core recomputes the outline every frame while the size transitions.
- **Timers.** Remaining time is tracked, so hover, drag and pin pause and resume exactly. The timer bar is a CSS animation that pauses with them.
- **Adapters.** Vue, Svelte and vanilla are thin wrappers over `createToaster()`. React adds portals so `description`, `icon` and `trailing` can be React nodes.

</details>

<details>
<summary><b>Adding an adapter</b></summary>

Call `createToaster(options)` on mount and `.destroy()` on unmount. Forward option changes with `.set()`. If the framework has its own node type, pass a `render(el, node)` option: the core calls it with `node = null` to unmount.

</details>

<details>
<summary><b>Releasing</b></summary>

```sh
npm version patch      # or minor / major
npm publish            # prepublishOnly runs typecheck, build and tests first
```

</details>

## Author

Built and maintained by **Ashutosh Swamy**.

[Portfolio](https://ashutoshswamy.in) &nbsp;·&nbsp; [GitHub](https://github.com/ashutoshswamy) &nbsp;·&nbsp; [LinkedIn](https://www.linkedin.com/in/ashutoshswamy) &nbsp;·&nbsp; [X](https://x.com/ashutoshswamy_)

If dynaura is useful to you, a star on [GitHub](https://github.com/ashutoshswamy/dynaura) helps others find it.

## License

[MIT](./LICENSE) © 2026 dynaura
