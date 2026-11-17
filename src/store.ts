export type ToastType = "success" | "error" | "warning" | "info" | "loading" | "live";
/** string | number | DOM Node | framework node (React element when used with the React adapter) */
export type Content = string | number | boolean | Node | object | null;

export type Presence = "online" | "away" | "busy" | "offline";
/** one face: image URL, and/or a name (initials + gradient fallback when `src` is missing or fails to load) */
export interface AvatarItem { src?: string; name?: string; presence?: Presence }

export type Dedupe = "id" | "title";
export type DismissReason = "timeout" | "swipe" | "button" | "escape" | "api";
export interface ToastOptions {
  /** custom id: showing a toast with an id that is already live updates it in place instead of stacking */
  id?: string;
  title: string;
  description?: Content;
  /** URL, {src, name, presence}, or an array of either for an overlapping group. Replaces the built-in icon (ignored if `icon` is set, unless avatarPosition is "card"). */
  avatar?: string | AvatarItem | (string | AvatarItem)[];
  /** group size before collapsing into a "+N" chip. Default 3. */
  avatarMax?: number;
  /** "card": boarding-pass style card (variant "card"): header tab, big faces with name and presence, a perforated tear line, then the description and buttons. Default "leading". */
  avatarPosition?: "leading" | "card";
  /** tap / Enter on a face; `i` is its index, the "+N" chip reports `avatarMax`. Excluded from onClick and pin. */
  onAvatarClick?: (i: number) => void;
  /** animated typing dots after the title, e.g. "Ana is typing" */
  typing?: boolean;
  /** replaces the built-in icon (leading slot) */
  icon?: Content;
  /** compact right-side slot, e.g. a countdown */
  trailing?: Content;
  /** ms; null = sticky. Default 4000 (loading / live: null). */
  duration?: number | null;
  button?: { title: string; onClick: () => void };
  /** second action next to `button`, e.g. Undo / Cancel. Dismisses the toast after the click. */
  secondaryButton?: { title: string; onClick: () => void };
  /** fully custom body (string, DOM Node or framework node) in place of the title row. See dynaura.custom(). */
  custom?: Content;
  /** tap / click on the island itself (buttons excluded) */
  onClick?: () => void;
  /** 0..1. Shows a progress bar + rolling percent. Clear with update(id, { progress: undefined }). */
  progress?: number;
  /** burst of confetti when shown */
  confetti?: boolean;
  /** live activity flavor (type "live"): running timer or waveform */
  kind?: "timer" | "wave";
  /** "card": rich layout. Header tab + wider body joined by a curved notch; description is full-bleed custom content. */
  variant?: "default" | "card";
  /** per-toast override of the Toaster `queue` option */
  queue?: boolean;
  /** extra class(es) on the island, for this toast only */
  className?: string;
  /** inline styles on the island, for this toast only. CSS variables work: { "--dynaura-bg": "#123" } */
  style?: Record<string, string | number>;
  /** the toast became the visible one (not on updates) */
  onShow?: () => void;
  /** the toast ended, for any reason */
  onDismiss?: (reason: DismissReason) => void;
  /** the toast ended because its duration ran out (onDismiss("timeout") fires too) */
  onAutoClose?: () => void;
}
export interface Toast extends ToastOptions { id: string; type: ToastType }

interface State { current: Toast | null; queue: Toast[]; n: number; subs: Set<() => void>; useQueue: boolean; paused: boolean; maxQueue: number; dedupe: Dedupe }
// ponytail: global singleton (survives duplicate bundles); one Toaster per page.
const g = globalThis as { __dynaura?: State };
const S: State = (g.__dynaura ??= { current: null, queue: [], n: 0, subs: new Set(), useQueue: false, paused: false, maxQueue: Infinity, dedupe: "id" });

const end = (t: Toast, r: DismissReason) => { t.onDismiss?.(r); if (r === "timeout") t.onAutoClose?.(); };
// replaced / removed toasts get `r`; a toast gaining the spotlight fires onShow
const set = (t: Toast | null, r: DismissReason = "api") => {
  const p = S.current;
  S.current = t;
  notify();
  if (p && p.id !== t?.id) end(p, r);
  if (t && t.id !== p?.id) t.onShow?.();
};

export const subscribe = (f: () => void) => { S.subs.add(f); return () => { S.subs.delete(f); }; };
export const getCurrent = () => S.current;
export const setQueue = (v: boolean) => { S.useQueue = v; };
export const setQueueOpts = (maxQueue: number, dedupe: Dedupe) => { S.maxQueue = maxQueue; S.dedupe = dedupe; };
export const isPaused = () => S.paused;
const notify = () => S.subs.forEach((f) => f());

const norm = (o: ToastOptions | string): ToastOptions => (typeof o === "string" ? { title: o } : o);

const make = (type: ToastType) => (o: ToastOptions | string) => {
  const o2 = norm(o);
  const sticky = type === "loading" || type === "live";
  const t0 = { duration: sticky ? null : 4000, ...(type === "live" ? { kind: "timer" as const } : {}), ...o2, type };
  // dedupe: same custom id (always), or same title when dedupe: "title" -> update in place, timer restarts
  const dup = [S.current, ...S.queue].find((x) => x && ((o2.id && x.id === o2.id) || (S.dedupe === "title" && o2.title && x.title === o2.title)));
  if (dup) { const { id: _, ...patch } = t0; update(dup.id, patch); return dup.id; }
  const t: Toast = { ...t0, id: o2.id ?? String(++S.n) };
  if (S.current && (t.queue ?? S.useQueue)) {
    S.queue.push(t);
    while (S.queue.length > S.maxQueue) end(S.queue.shift()!, "api"); // drop the oldest waiting toast
  } else set(t);
  return t.id;
};

function update(id: string, patch: Partial<ToastOptions> & { type?: ToastType }) {
  if (S.current?.id === id) return set({ ...S.current, ...patch });
  const i = S.queue.findIndex((t) => t.id === id);
  if (i >= 0) S.queue[i] = { ...S.queue[i], ...patch };
}

type Resolve<T> = ToastOptions | string | ((v: T) => ToastOptions | string);
const pick = <T,>(r: Resolve<T>, v: T) => norm(typeof r === "function" ? r(v) : r);

export const dynaura = {
  success: make("success"),
  error: make("error"),
  warning: make("warning"),
  info: make("info"),
  loading: make("loading"),
  /** Live activity: sticky island with a running timer (default) or waveform. */
  live: make("live"),
  update,
  /** fully custom body: string, DOM Node or (React adapter) element. Options as usual, `title` optional. */
  custom: (content: Content, o: Partial<ToastOptions> = {}) => make("info")({ title: "", ...o, custom: content }),
  /** freeze every timer (e.g. while a modal is open). Toasts shown meanwhile start frozen too. */
  pause: () => { S.paused = true; notify(); },
  resume: () => { S.paused = false; notify(); },
  /** dismiss the current toast (next queued one shows) or a specific id */
  dismiss: (id?: string, reason: DismissReason = "api") => {
    if (id && S.current?.id !== id) {
      const q = S.queue.find((t) => t.id === id);
      S.queue = S.queue.filter((t) => t.id !== id);
      if (q) end(q, reason);
      return;
    }
    set(S.queue.shift() ?? null, reason);
  },
  clear: () => { const q = S.queue; S.queue = []; set(null); q.forEach((t) => end(t, "api")); },
  promise<T>(p: Promise<T>, o: { loading: ToastOptions | string; success: Resolve<T>; error: Resolve<unknown> }) {
    const id = make("loading")(o.loading);
    p.then(
      (v) => update(id, { duration: 4000, ...pick(o.success, v), type: "success" }),
      (e) => update(id, { duration: 4000, ...pick(o.error, e), type: "error" }),
    );
    return p;
  },
};
