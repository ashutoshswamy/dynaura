export type ToastType = "success" | "error" | "warning" | "info" | "loading" | "live";
/** string | number | DOM Node | framework node (React element when used with the React adapter) */
export type Content = string | number | boolean | Node | object | null;

export interface ToastOptions {
  title: string;
  description?: Content;
  /** replaces the built-in icon (leading slot) */
  icon?: Content;
  /** compact right-side slot, e.g. a countdown */
  trailing?: Content;
  /** ms; null = sticky. Default 4000 (loading / live: null). */
  duration?: number | null;
  button?: { title: string; onClick: () => void };
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
}
export interface Toast extends ToastOptions { id: string; type: ToastType }

interface State { current: Toast | null; queue: Toast[]; n: number; subs: Set<() => void>; useQueue: boolean }
// ponytail: global singleton (survives duplicate bundles); one Toaster per page.
const g = globalThis as { __dynaura?: State };
const S: State = (g.__dynaura ??= { current: null, queue: [], n: 0, subs: new Set(), useQueue: false });

const set = (t: Toast | null) => { S.current = t; S.subs.forEach((f) => f()); };

export const subscribe = (f: () => void) => { S.subs.add(f); return () => { S.subs.delete(f); }; };
export const getCurrent = () => S.current;
export const setQueue = (v: boolean) => { S.useQueue = v; };

const norm = (o: ToastOptions | string): ToastOptions => (typeof o === "string" ? { title: o } : o);

const make = (type: ToastType) => (o: ToastOptions | string) => {
  const id = String(++S.n);
  const sticky = type === "loading" || type === "live";
  const t: Toast = { duration: sticky ? null : 4000, ...(type === "live" ? { kind: "timer" as const } : {}), ...norm(o), id, type };
  if (S.current && (t.queue ?? S.useQueue)) S.queue.push(t);
  else set(t);
  return id;
};

const update = (id: string, patch: Partial<ToastOptions> & { type?: ToastType }) => {
  if (S.current?.id === id) return set({ ...S.current, ...patch });
  const i = S.queue.findIndex((t) => t.id === id);
  if (i >= 0) S.queue[i] = { ...S.queue[i], ...patch };
};

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
  /** dismiss the current toast (next queued one shows) or a specific id */
  dismiss: (id?: string) => {
    if (id && S.current?.id !== id) { S.queue = S.queue.filter((t) => t.id !== id); return; }
    set(S.queue.shift() ?? null);
  },
  clear: () => { S.queue = []; set(null); },
  promise<T>(p: Promise<T>, o: { loading: ToastOptions | string; success: Resolve<T>; error: Resolve<unknown> }) {
    const id = make("loading")(o.loading);
    p.then(
      (v) => update(id, { duration: 4000, ...pick(o.success, v), type: "success" }),
      (e) => update(id, { duration: 4000, ...pick(o.error, e), type: "error" }),
    );
    return p;
  },
};
