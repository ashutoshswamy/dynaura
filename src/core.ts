import { burst } from "./confetti";
import { dynaura, getCurrent, setQueue, subscribe } from "./store";
import type { Content, Toast, ToastType } from "./store";

export type Position =
  | "top" | "top-left" | "top-center" | "top-right"
  | "bottom" | "bottom-left" | "bottom-center" | "bottom-right";

/** Any CSS color. Omitted keys fall back to the dark theme. */
export interface CustomTheme {
  background?: string; foreground?: string; muted?: string; ring?: string; button?: string;
  success?: string; error?: string; warning?: string; info?: string; loading?: string; live?: string;
}

export interface ToasterOptions {
  position?: Position;
  /** px from the screen edge */
  offset?: number;
  /** "dark" | "light" | "system" (follows OS) | custom colors */
  theme?: "dark" | "light" | "system" | CustomTheme;
  /** thin time-remaining bar on timed toasts (default true) */
  timer?: boolean;
  /** navigator.vibrate on show (default true; no-op where unsupported) */
  haptics?: boolean;
  /** show toasts one after another instead of replacing (default false) */
  queue?: boolean;
  /** framework hook: mount non-string/non-Node content (e.g. a React element) into `el`; node=null unmounts */
  render?: (el: HTMLElement, node: unknown) => void;
}
export interface ToasterHandle { set(o: ToasterOptions): void; destroy(): void }

const VAR: Record<keyof CustomTheme, string> = {
  background: "bg", foreground: "fg", muted: "muted", ring: "ring", button: "btn",
  success: "success", error: "error", warning: "warning", info: "info", loading: "loading", live: "live",
};
const svg = (d: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON: Record<Exclude<ToastType, "live">, string> = {
  success: svg('<path class="dynaura-draw" d="M5 12.5l4.5 4.5L19 7.5"/>'),
  error: svg('<path class="dynaura-draw" d="M7 7l10 10M17 7L7 17"/>'),
  warning: svg('<path class="dynaura-draw" d="M12 6v7M12 17.5v.01"/>'),
  info: svg('<path class="dynaura-draw" d="M12 11v6M12 7.5v.01"/>'),
  loading: svg('<circle class="dynaura-spin" cx="12" cy="12" r="8" stroke-dasharray="30 50"/>'),
};
const DOT = '<span class="dynaura-dot"></span>';
const WAVE = '<span class="dynaura-wave"><i></i><i></i><i></i><i></i></span>';
const VIBRATE: Record<ToastType, number[]> = { success: [12], error: [24, 40, 24], warning: [30], info: [8], loading: [], live: [8] };

const f2 = (n: number) => +n.toFixed(2);
/** Outline of the "card" variant: header tab (cw x ch, left edge at hx) on top of a w x h body, joined by concave fillets. */
function outline(w: number, h: number, cw: number, ch: number, hx: number) {
  if (h <= ch + 1 || w <= cw + 1) {
    const q = f2(Math.min(h / 2, w / 2, 32));
    return `M${q} 0H${f2(w - q)}A${q} ${q} 0 0 1 ${f2(w)} ${q}V${f2(h - q)}A${q} ${q} 0 0 1 ${f2(w - q)} ${f2(h)}H${q}A${q} ${q} 0 0 1 0 ${f2(h - q)}V${q}A${q} ${q} 0 0 1 ${q} 0Z`;
  }
  const r = f2(Math.min(ch / 2, 32));
  const b = f2(Math.max(0, Math.min(28, (h - ch) / 2, (w - cw) / 2)));
  const f = f2(Math.min(16, b));
  const x0 = f2(hx), x1 = f2(hx + cw);
  const flushL = hx < 1, flushR = hx + cw > w - 1;
  let d = `M${f2(x0 + r)} 0H${f2(x1 - r)}A${r} ${r} 0 0 1 ${x1} ${r}`;
  d += flushR
    ? `V${f2(h - b)}`
    : `V${f2(ch - f)}A${f} ${f} 0 0 0 ${f2(x1 + f)} ${f2(ch)}H${f2(w - b)}A${b} ${b} 0 0 1 ${f2(w)} ${f2(ch + b)}V${f2(h - b)}`;
  d += `A${b} ${b} 0 0 1 ${f2(w - b)} ${f2(h)}H${b}A${b} ${b} 0 0 1 0 ${f2(h - b)}`;
  d += flushL
    ? `V${r}`
    : `V${f2(ch + b)}A${b} ${b} 0 0 1 ${b} ${f2(ch)}H${f2(x0 - f)}A${f} ${f} 0 0 0 ${x0} ${f2(ch - f)}V${r}`;
  return d + `A${r} ${r} 0 0 1 ${f2(x0 + r)} 0Z`;
}

const h = (tag: string, cls: string, parent?: Element) => {
  const e = document.createElement(tag);
  e.className = cls;
  parent?.append(e);
  return e;
};
const restart = (e: HTMLElement) => { e.style.animation = "none"; void e.offsetWidth; e.style.animation = ""; };

/** Rolling-digit text: digits are vertical strips moved with a spring transition. */
function roll(e: HTMLElement, s: string) {
  const sig = s.replace(/\d/g, "0");
  if (e.dataset.sig !== sig) {
    e.dataset.sig = sig;
    e.replaceChildren();
    e.setAttribute("role", "img");
    for (const ch of s) {
      if (/\d/.test(ch)) {
        const d = h("span", "dynaura-digit", e);
        d.setAttribute("aria-hidden", "true");
        h("span", "dynaura-strip", d).innerHTML = "0123456789".replace(/\d/g, "<i>$&</i>");
      } else h("span", "dynaura-char", e).textContent = ch;
    }
  }
  e.setAttribute("aria-label", s);
  [...s].forEach((ch, i) => { if (/\d/.test(ch)) (e.children[i] as HTMLElement).style.setProperty("--d", ch); });
}

export function createToaster(initial: ToasterOptions = {}): ToasterHandle {
  const o = { position: "top", offset: 12, theme: "dark", timer: true, haptics: true, queue: false } as Required<Omit<ToasterOptions, "render">> & Pick<ToasterOptions, "render">;
  const merge = (n: ToasterOptions) => { for (const k in n) if ((n as any)[k] !== undefined) (o as any)[k] = (n as any)[k]; };
  merge(initial);

  // ---- DOM ----
  const root = h("div", "dynaura-root");
  const drag = h("div", "dynaura-drag", root);
  const island = h("div", "dynaura-island", drag);
  island.setAttribute("role", "status");
  island.setAttribute("aria-live", "polite");
  const inner = h("div", "dynaura-inner", island);
  const row = h("div", "dynaura-row", inner);
  const badge = h("span", "dynaura-badge", row);
  const title = h("span", "dynaura-title", row);
  const trail = h("span", "dynaura-trailing", row);
  const body = h("div", "dynaura-body", inner);
  const desc = h("div", "dynaura-desc", body);
  const btn = h("button", "dynaura-button", body) as HTMLButtonElement;
  const bar = h("div", "dynaura-bar", island);
  island.hidden = true;
  island.dataset.expanded = "false";
  island.dataset.paused = "false";
  document.body.append(root);

  // ---- state ----
  let t: Toast | null = null;
  let expanded = false, hovered = false, pinned = false, dragging = false, ready = false;
  let hideT: any, expandT: any, collapseT: any, dismissT: any, liveI: any, lp: any;
  let remaining = 0, startedAt = 0, liveStart = 0;
  let sz = { cw: 0, ch: 0, ew: 0, eh: 0 };
  let applied: string[] = [];
  const hosts = new Map<HTMLElement, HTMLElement>();

  const dir = () => (o.position.startsWith("bottom") ? 1 : -1); // sign of "toward the screen edge" in y
  const hasBody = () => !!t && ((t.description != null && typeof t.description !== "boolean") || !!t.button);
  const paused = () => hovered || pinned || dragging;

  // fill a slot; framework nodes go into a fresh host so later unmounts never touch live DOM
  function put(slot: HTMLElement, c: Content | undefined) {
    const old = hosts.get(slot);
    if (old) { o.render?.(old, null); hosts.delete(slot); }
    slot.replaceChildren();
    if (c == null || typeof c === "boolean") return;
    if (typeof c === "string" || typeof c === "number") slot.textContent = String(c);
    else if (c instanceof Node) slot.append(c);
    else if (o.render) { const host = h("span", "dynaura-host", slot) as HTMLElement; hosts.set(slot, host); o.render(host, c); }
  }

  // ---- size morph ----
  let raf = 0;
  const isCard = () => t?.variant === "card";
  // card variant: follow the transitioning width/height each frame and redraw the notch outline
  function shape() {
    if (!isCard()) { island.style.clipPath = ""; row.style.transform = ""; return; }
    const cs = getComputedStyle(island);
    const w = parseFloat(cs.width), hh = parseFloat(cs.height);
    if (!isFinite(w) || !isFinite(hh) || w <= 0) return;
    // header tab follows the position: centered island, or flush to the left / right edge
    const x = o.position.split("-")[1];
    const hx = x === "left" ? 0 : x === "right" ? Math.max(0, w - sz.cw) : Math.max(0, (w - sz.cw) / 2);
    row.style.transform = `translateX(${f2(hx)}px)`;
    island.style.clipPath = `path('${outline(w, hh, sz.cw, sz.ch, hx)}')`;
  }
  function shapeLoop() {
    cancelAnimationFrame(raf);
    const end = performance.now() + 1300;
    const f = () => { shape(); if (performance.now() < end) raf = requestAnimationFrame(f); };
    f();
  }
  function size() {
    if (!sz.cw) return;
    const w = expanded ? sz.ew : sz.cw, hh = expanded ? sz.eh : sz.ch;
    island.style.width = w + "px";
    island.style.height = hh + "px";
    island.style.borderRadius = isCard() ? "0" : Math.min(hh / 2, 32) + "px";
    if (isCard()) shapeLoop(); else island.style.clipPath = "";
  }
  function measure() {
    if (island.hidden) return;
    sz = { cw: row.offsetWidth, ch: row.offsetHeight, ew: inner.offsetWidth, eh: inner.offsetHeight };
    size();
    if (!ready && sz.cw) requestAnimationFrame(() => { ready = true; island.dataset.ready = "true"; });
  }
  const ro = new ResizeObserver(measure);
  ro.observe(row); ro.observe(inner);

  function setExpanded(v: boolean) {
    v = v && hasBody();
    if (v === expanded) return;
    expanded = v;
    island.dataset.expanded = String(v);
    size();
  }

  // ---- timers (remaining-time bookkeeping so hover/drag pause is exact) ----
  function clear() {
    if (startedAt) { remaining -= Date.now() - startedAt; startedAt = 0; }
    clearTimeout(collapseT); clearTimeout(dismissT);
  }
  function arm() {
    clear();
    if (!t || t.duration == null || paused()) return;
    const id = t.id;
    startedAt = Date.now();
    collapseT = setTimeout(() => { if (!pinned) setExpanded(false); }, Math.max(0, remaining - 500));
    dismissT = setTimeout(() => dynaura.dismiss(id), remaining);
  }
  function sync() {
    island.dataset.paused = String(paused());
    if (paused()) { clear(); if (hovered || pinned) setExpanded(true); } else arm();
  }

  // ---- content ----
  function tick() {
    if (!t || t.trailing != null) return;
    if (t.progress != null) roll(trail, Math.round(t.progress * 100) + "%");
    else if (t.type === "live" && (t.kind ?? "timer") === "timer") {
      const s = Math.floor((Date.now() - liveStart) / 1000);
      roll(trail, `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
    }
  }
  const hasTrail = (n: Toast) => n.trailing != null || n.progress != null || (n.type === "live" && (n.kind ?? "timer") === "timer");

  function apply(n: Toast, p: Toast | null) {
    const ch = (k: keyof Toast) => !p || n[k] !== p[k];
    island.dataset.type = n.type;
    island.dataset.variant = drag.dataset.variant = n.variant ?? "default";
    if (ch("type") || ch("icon") || ch("kind")) {
      put(badge, undefined);
      if (n.icon != null) put(badge, n.icon);
      else badge.innerHTML = n.type === "live" ? ((n.kind ?? "timer") === "wave" ? WAVE : DOT) : ICON[n.type];
      restart(badge);
    }
    if (ch("title")) { title.textContent = n.title; restart(title); }
    if (ch("trailing") || ch("progress") || ch("type") || ch("kind")) {
      trail.hidden = !hasTrail(n);
      if (n.trailing != null) { delete trail.dataset.sig; trail.removeAttribute("aria-label"); put(trail, n.trailing); }
      else if (!hasTrail(n)) { delete trail.dataset.sig; put(trail, undefined); }
    }
    if (ch("description")) put(desc, n.description);
    desc.hidden = n.description == null || typeof n.description === "boolean";
    btn.hidden = !n.button;
    if (n.button) btn.textContent = n.button.title;
    body.hidden = !(n.description != null && typeof n.description !== "boolean") && !n.button;
    // bar: value progress, else time remaining
    bar.dataset.mode = n.progress != null ? "value" : n.duration != null ? "time" : "none";
    bar.style.setProperty("--p", String(n.progress ?? 0));
  }

  function feedback(n: Toast) {
    // Chrome blocks vibrate (and logs an error) until the user has interacted with the page
    const active = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true;
    if (o.haptics && typeof navigator !== "undefined" && navigator.vibrate && active && VIBRATE[n.type].length) navigator.vibrate(VIBRATE[n.type]);
    if (n.confetti && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(() => {
        const r = island.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, getComputedStyle(island).getPropertyValue("--state").trim() || "#30d158");
      });
    }
  }

  const onlyProgress = (p: Toast, n: Toast) =>
    (p.progress == null) === (n.progress == null) &&
    [...new Set([...Object.keys(n), ...Object.keys(p)])].every((k) => k === "progress" || (n as any)[k] === (p as any)[k]);

  function render() {
    const n = getCurrent();
    const p = t;
    if (!n) { if (p) leave(); return; }
    const same = !!p && p.id === n.id;
    if (same && onlyProgress(p!, n)) { // frequent progress updates: don't reset anything
      t = n; bar.style.setProperty("--p", String(n.progress ?? 0)); tick(); return;
    }
    t = n;
    clearTimeout(hideT);
    if (island.hidden) { // entering from nothing
      island.hidden = false;
      drag.style.transform = ""; drag.style.opacity = "";
      restart(island);
    }
    island.dataset.open = "true";
    if (!same) { liveStart = Date.now(); pinned = false; }
    apply(n, same ? p : null);
    measure();
    if (!same || n.type !== p!.type) feedback(n);

    clearInterval(liveI);
    if (n.type === "live") liveI = setInterval(tick, 1000);
    tick();

    // timer + autopilot
    clear(); startedAt = 0; remaining = n.duration ?? 0;
    restart(bar); // clears inline animation props, so set the duration after
    bar.style.animationDuration = (n.duration ?? 0) + "ms";
    if (!pinned) setExpanded(false);
    clearTimeout(expandT);
    if (hasBody()) expandT = setTimeout(() => setExpanded(true), 450);
    sync();
  }

  function leave() {
    clear(); startedAt = 0;
    clearTimeout(expandT); clearInterval(liveI);
    hovered = pinned = dragging = false;
    t = null;
    island.dataset.open = "false";
    hideT = setTimeout(() => {
      cancelAnimationFrame(raf); island.style.clipPath = "";
      island.hidden = true; ready = false; expanded = false;
      delete island.dataset.ready; island.dataset.expanded = "false";
      island.style.width = island.style.height = island.style.borderRadius = "";
      [badge, trail, desc].forEach((s) => put(s, undefined));
      delete trail.dataset.sig;
    }, 450);
  }

  btn.onclick = () => {
    const c = t;
    if (c?.button) { c.button.onClick(); dynaura.dismiss(c.id); }
  };

  // ---- pointer: hover (mouse), tap-to-pin, long-press, swipe to dismiss ----
  // ponytail: swipe is vertical only (toward the anchored screen edge); add horizontal for corner positions if wanted.
  let sy = 0, t0 = 0, moved = false, longed = false;
  island.addEventListener("pointerenter", (e) => { if ((e as PointerEvent).pointerType === "mouse") { hovered = true; sync(); } });
  island.addEventListener("pointerleave", (e) => {
    if ((e as PointerEvent).pointerType !== "mouse") return;
    hovered = false;
    if (!pinned) setExpanded(false);
    sync();
  });
  drag.addEventListener("pointerdown", (e) => {
    if (!t || (e.target as Element).closest("button")) return;
    dragging = true; moved = longed = false; sy = e.clientY; t0 = Date.now();
    drag.setPointerCapture?.(e.pointerId);
    drag.style.transition = "none";
    lp = setTimeout(() => { if (!moved) { longed = true; pinned = true; if (o.haptics) navigator.vibrate?.(8); sync(); } }, 450);
    sync();
  });
  drag.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - sy;
    if (Math.abs(dy) > 6) { moved = true; clearTimeout(lp); }
    if (!moved) return;
    const d = dy * dir();
    const off = d > 0 ? d : -Math.sqrt(-d) * 4; // rubber-band when pulled the wrong way
    drag.style.transform = `translateY(${off * dir()}px)`;
  });
  const up = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false; clearTimeout(lp);
    drag.style.transition = "";
    const d = (e.clientY - sy) * dir();
    const v = d / Math.max(1, Date.now() - t0);
    if (e.type === "pointerup" && moved && (d > 40 || (v > 0.5 && d > 10)) && t) { dynaura.dismiss(t.id); return; }
    drag.style.transform = "";
    if (e.type === "pointerup" && !moved && !longed && hasBody()) {
      pinned = !pinned;
      if (!pinned && !hovered) setExpanded(false);
    }
    sync();
  };
  drag.addEventListener("pointerup", up);
  drag.addEventListener("pointercancel", up);
  const outside = (e: Event) => {
    if (pinned && !island.contains(e.target as Node)) { pinned = false; if (!hovered) setExpanded(false); sync(); }
  };
  document.addEventListener("pointerdown", outside);

  // ---- options ----
  function set(n: ToasterOptions) {
    merge(n);
    setQueue(o.queue);
    const [y, x = "center"] = o.position.split("-");
    root.dataset.y = y; root.dataset.x = x;
    root.dataset.timer = String(o.timer);
    root.dataset.theme = typeof o.theme === "object" ? "custom" : o.theme;
    root.style.setProperty("--dynaura-offset", o.offset + "px");
    applied.forEach((v) => root.style.removeProperty(v));
    applied = [];
    if (typeof o.theme === "object")
      for (const k in o.theme) {
        const v = `--dynaura-${VAR[k as keyof CustomTheme]}`;
        root.style.setProperty(v, (o.theme as any)[k]);
        applied.push(v);
      }
  }
  set({});
  const unsub = subscribe(render);
  render();

  return {
    set,
    destroy() {
      unsub(); ro.disconnect(); cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", outside);
      clear(); [hideT, expandT, liveI, lp].forEach((x) => { clearTimeout(x); clearInterval(x); });
      [badge, trail, desc].forEach((s) => put(s, undefined));
      root.remove();
    },
  };
}
