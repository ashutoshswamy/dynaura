import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRightIcon, ArrowsUpDownIcon, BanknotesIcon, BookOpenIcon, BugAntIcon, CalendarDaysIcon, CheckIcon, ChevronDownIcon,
  ClipboardDocumentCheckIcon, ClipboardDocumentIcon, ClockIcon, CodeBracketIcon, CursorArrowRaysIcon, FingerPrintIcon, GlobeAltIcon,
  MapPinIcon, MicrophoneIcon, MusicalNoteIcon, QueueListIcon, ServerStackIcon, ShoppingBagIcon, SparklesIcon, SwatchIcon,
  TicketIcon, ViewfinderCircleIcon,
} from "@heroicons/react/24/outline";
import { Toaster, dynaura } from "../src/index";
import type { CustomTheme, Position, ToasterProps } from "../src/index";
import { Boarding, Food, Pay, Ride } from "./cards";
import cardsSrc from "./cards.tsx?raw";
import fcCss from "./fc.css?raw";
import "../src/styles.css";
import "./fc.css";

const wait = (ms: number, fail = false) => new Promise<void>((r, j) => setTimeout(fail ? j : r, ms));
/** the exact source of a component in cards.tsx, so the code on the page is the code that runs */
const part = (n: string) => cardsSrc.split(`// <${n}>\n`)[1].split(`// </${n}>`)[0].trim();

/* ---------- UI pieces ---------- */
function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: T[]; onChange: (v: T) => void; label: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ x: 0, w: 0 });
  useLayoutEffect(() => {
    const b = refs.current[value];
    if (b) setPill({ x: b.offsetLeft, w: b.offsetWidth });
  }, [value]);
  return (
    <div className="seg" role="group" aria-label={label}>
      <span className="pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
      {options.map((o) => (
        <button key={o} ref={(el) => { refs.current[o] = el; }} aria-pressed={o === value} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

type Icon = typeof SparklesIcon;
const Switch = ({ on, set, label, icon: I }: { on: boolean; set: (v: boolean) => void; label: string; icon: Icon }) => (
  <label><span className="lab"><I strokeWidth={1.8} />{label}</span><button className="sw" role="switch" aria-checked={on} onClick={() => set(!on)} /></label>
);

/** copyable code block; several tabs when `code` is an object */
function Code({ code, dark }: { code: string | Record<string, string>; dark?: boolean }) {
  const tabs = typeof code === "string" ? { Code: code } : code;
  const names = Object.keys(tabs);
  const [tab, setTab] = useState(names[0]);
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(tabs[tab] ?? ""); } catch { /* clipboard blocked */ }
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  };
  return (
    <div className={dark ? "code dark" : "code"}>
      <div className="code-head">
        <div className="tabs">{names.length > 1 ? names.map((n) => <button key={n} aria-pressed={n === tab} onClick={() => setTab(n)}>{n}</button>) : <span className="lang">{names[0]}</span>}</div>
        <button className="copy" data-done={done} onClick={copy} aria-label="Copy code">
          {done ? <CheckIcon strokeWidth={2.4} /> : <ClipboardDocumentIcon strokeWidth={2} />}<span className="copy-t">{done ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre tabIndex={0}><code>{tabs[tab] ?? tabs[names[0]]}</code></pre>
    </div>
  );
}

const SectionHead = ({ title, lead }: { title: string; lead: string }) => (
  <header className="sec-h"><h2>{title}</h2><p>{lead}</p></header>
);

/** one example: copy and trigger on the left, live preview on the right, code on demand */
function Example({ title, blurb, code, action, children }: { title: string; blurb: string; code: string | Record<string, string>; action: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <article className="ex">
      <div className="ex-meta">
        <h3>{title}</h3>
        <p>{blurb}</p>
        <div className="ex-act">
          {action}
          <button className="tgl" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
            <CodeBracketIcon strokeWidth={1.9} />{open ? "Hide code" : "Show code"}<ChevronDownIcon className="chev" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="stage">{children}</div>
      <div className="ex-code" id={id} data-open={open} {...(open ? {} : ({ inert: "" } as object))}><div><Code code={code} /></div></div>
    </article>
  );
}
const Btn = ({ f, children, ghost }: { f: () => void; children: ReactNode; ghost?: boolean }) => (
  <button className={ghost ? "btn ghost" : "btn"} onClick={f}>{children}</button>
);

/** static preview of a card toast, built from the same markup the toast renders */
function Preview({ state, icon: I, title, trailing, button, children }: { state: string; icon: Icon; title: string; trailing?: string; button: string; children: ReactNode }) {
  return (
    <div className="pv" style={{ ["--state" as string]: state }}>
      <div className="pv-head"><span className="pv-badge"><I strokeWidth={2.2} /></span><b>{title}</b>{trailing && <span className="pv-trail">{trailing}</span>}</div>
      {children}
      <span className="pv-btn">{button}</span>
    </div>
  );
}

/* ---------- data ---------- */
const THEMES = ["dark", "light", "system", "custom"] as const;
const POSITIONS: Position[] = ["top", "top-left", "top-right", "bottom", "bottom-left", "bottom-right"];
const DEFAULT_CUSTOM: Required<CustomTheme> = {
  background: "#2b1055", foreground: "#ffffff", muted: "#c9b8f5", ring: "#4a2c85", button: "#432478",
  success: "#7cffcb", error: "#ff7a90", warning: "#ffd666", info: "#a6c8ff", loading: "#b9a8e8", live: "#ffb86b",
};
const COLOR_KEYS = Object.keys(DEFAULT_CUSTOM) as (keyof CustomTheme)[];
const MESSAGES = [
  { id: 1, from: "Maya", text: "Lunch tomorrow?" },
  { id: 2, from: "Dev", text: "PR is ready for review" },
  { id: 3, from: "Sam", text: "Invoice attached" },
];

const SETUP = {
  React: `import { Toaster, dynaura } from "dynaura";
import "dynaura/styles.css";

export default function App() {
  return (
    <>
      <Toaster position="top" theme="light" />  {/* mount once */}
      <button onClick={() => dynaura.success("Saved")}>Save</button>
    </>
  );
}`,
  Vue: `<script setup>
import { Toaster, dynaura } from "dynaura/vue";
import "dynaura/styles.css";
</script>

<template>
  <Toaster position="top" theme="light" />
  <button @click="dynaura.success('Saved')">Save</button>
</template>`,
  Svelte: `<script>
  import { toaster, dynaura } from "dynaura/svelte";
  import "dynaura/styles.css";
</script>

<div use:toaster={{ position: "top", theme: "light" }} />
<button on:click={() => dynaura.success("Saved")}>Save</button>`,
  Vanilla: `import { createToaster, dynaura } from "dynaura/vanilla";
import "dynaura/styles.css";

createToaster({ position: "top", theme: "light" });
dynaura.success("Saved");`,
};

const SOCIALS: { name: string; href: string; Icon?: Icon; path?: string }[] = [
  { name: "Portfolio", href: "https://ashutoshswamy.in", Icon: GlobeAltIcon },
  { name: "GitHub", href: "https://github.com/ashutoshswamy", path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/ashutoshswamy", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" },
  { name: "X", href: "https://x.com/ashutoshswamy_", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
];
const PROJECT: { label: string; Icon: Icon; value: string; href: string }[] = [
  { label: "Docs", Icon: BookOpenIcon, value: "dynaura.ashutoshswamy.in", href: "https://dynaura.ashutoshswamy.in" },
  { label: "Source", Icon: CodeBracketIcon, value: "github.com/ashutoshswamy/dynaura", href: "https://github.com/ashutoshswamy/dynaura" },
  { label: "Issues", Icon: BugAntIcon, value: "Report a bug or request a feature", href: "https://github.com/ashutoshswamy/dynaura/issues" },
];

const DEV_CODE = `git clone https://github.com/ashutoshswamy/dynaura.git
cd dynaura
npm install
npm run dev     # this playground
npm test        # vitest + jsdom
npm run build   # tsup -> dist/`;

const richCode = (name: string, component: string, call: string) => ({
  Toast: `${call}`,
  [name]: part(component),
  CSS: fcCss.trim(),
});

const welcome = () =>
  dynaura.info({
    title: "Hello from dynaura",
    icon: <SparklesIcon width={16} height={16} strokeWidth={2} />,
    description: "This pill is the library. Every example below is live.",
    duration: 6500,
  });

function App() {
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("dark");
  const [position, setPosition] = useState<Position>("top");
  const [queue, setQueue] = useState(false);
  const [timer, setTimer] = useState(true);
  const [custom, setCustom] = useState<Required<CustomTheme>>(DEFAULT_CUSTOM);
  const themeProp: ToasterProps["theme"] = theme === "custom" ? custom : theme;

  const [msgs, setMsgs] = useState(MESSAGES);
  const [pct, setPct] = useState(0);
  const [rec, setRec] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const upTimer = useRef<number | undefined>(undefined);
  const recStart = useRef<number | null>(null);
  useEffect(() => () => clearInterval(upTimer.current), []);

  // the one authored moment: the island introduces itself once per session
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("dynaura-welcome") === "1"; sessionStorage.setItem("dynaura-welcome", "1"); } catch { /* storage blocked */ }
    if (seen) return;
    const t = setTimeout(welcome, 700);
    return () => clearTimeout(t);
  }, []);

  const del = (m: (typeof MESSAGES)[number]) => {
    setMsgs((x) => x.filter((y) => y.id !== m.id));
    dynaura.info({
      title: "Message deleted",
      button: { title: "Undo", onClick: () => setMsgs((x) => [...x, m].sort((a, b) => a.id - b.id)) },
      duration: 5000,
    });
  };

  const upload = () => {
    clearInterval(upTimer.current);
    setPct(0);
    const id = dynaura.loading({ title: "Uploading brand-assets.zip", progress: 0 });
    let p = 0;
    upTimer.current = window.setInterval(() => {
      p = Math.min(1, p + 0.05 + Math.random() * 0.07);
      setPct(p);
      if (p >= 1) {
        clearInterval(upTimer.current);
        dynaura.update(id, { type: "success", title: "Upload complete", description: "48 MB synced to your workspace.", progress: undefined, duration: 4500, confetti: true });
      } else dynaura.update(id, { progress: p });
    }, 260);
  };

  const stopRec = () => {
    if (recStart.current === null) return;
    const s = Math.max(1, Math.round((Date.now() - recStart.current) / 1000));
    recStart.current = null;
    setRec(null);
    dynaura.success({ title: "Memo saved", description: `${s}s recording added to Voice Notes.` });
  };
  const record = () => {
    if (recStart.current !== null) return stopRec();
    recStart.current = Date.now();
    setRec(recStart.current);
    dynaura.live({ title: "Recording voice memo", button: { title: "Stop", onClick: stopRec } });
  };

  const play = () => {
    if (playing) { dynaura.dismiss(); setPlaying(false); return; }
    setPlaying(true);
    dynaura.live({ title: "Now playing", kind: "wave", description: "Lofi Dusk, Night Drive", button: { title: "Pause", onClick: () => setPlaying(false) } });
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText("https://dynaura.dev/share/8f2a"); } catch { /* ignore */ }
    dynaura.success({ title: "Link copied", icon: <ClipboardDocumentCheckIcon width={16} height={16} strokeWidth={2} /> });
  };

  return (
    <>
      <Toaster theme={themeProp} position={position} queue={queue} timer={timer} />

      <div className="strip">
        <div className="wrap"><span>Local test playground. Run it with <code>npm run dev</code>; it imports <code>src/</code> directly. This is not the docs site.</span></div>
      </div>

      <div className="wrap">
        <div className="top">
          <a className="brand" href="#top" aria-label="dynaura home"><img src="/logo-mark.png" alt="" width={70} height={34} />dynaura</a>
          <nav className="nav" aria-label="Project links">
            <a href="https://dynaura.ashutoshswamy.in" target="_blank" rel="noreferrer"><BookOpenIcon strokeWidth={1.8} /><span>Docs</span></a>
            <a href="https://github.com/ashutoshswamy/dynaura" target="_blank" rel="noreferrer"><CodeBracketIcon strokeWidth={1.8} /><span>GitHub</span></a>
          </nav>
        </div>

        <header className="hero" id="top">
          <h1>Toasts that move like a Dynamic Island.</h1>
          <p>One pill, spring-morphing between states. Swipe it away, pin it, or fill it with your own card.</p>
          <div className="cta">
            <button className="btn" onClick={welcome}><SparklesIcon strokeWidth={1.9} />Try the island</button>
            <a className="btn ghost" href="#setup">Read the setup</a>
          </div>
        </header>

      </div>

      <div className="bar">
        <div className="wrap bar-in">
          <label><span className="lab" title="Theme"><SwatchIcon strokeWidth={1.8} aria-hidden="true" /><span className="vh">Theme</span></span><Seg label="Theme" value={theme} options={[...THEMES]} onChange={setTheme} /></label>
          <label><span className="lab" title="Position"><ViewfinderCircleIcon strokeWidth={1.8} aria-hidden="true" /><span className="vh">Position</span></span><Seg label="Position" value={position} options={POSITIONS} onChange={setPosition} /></label>
          <Switch icon={QueueListIcon} label="Queue" on={queue} set={setQueue} />
          <Switch icon={ClockIcon} label="Timer bar" on={timer} set={setTimer} />
        </div>
      </div>

      <main className="wrap">
        {theme === "custom" && (
          <div className="picker" role="group" aria-label="Custom theme colors">
            {COLOR_KEYS.map((k) => (
              <label className="pk" key={k}>
                <input type="color" value={custom[k]} onChange={(e) => setCustom((c) => ({ ...c, [k]: e.target.value }))} aria-label={`${k} color`} />
                <span>{k}</span>
              </label>
            ))}
            <button className="pk-reset" onClick={() => setCustom(DEFAULT_CUSTOM)}>Reset</button>
            <div className="pk-code"><Code code={`<Toaster theme={{\n${COLOR_KEYS.map((k) => `  ${k}: "${custom[k]}",`).join("\n")}\n}} />`} /></div>
          </div>
        )}

        <section className="sec" id="setup">
          <SectionHead title="Set up in a minute" lead="Mount one Toaster, then call dynaura from anywhere." />
          <div className="setup"><Code code={SETUP} /></div>
        </section>

        <section className="sec">
          <SectionHead title="Rich cards" lead="Set variant to card and pass any component as the description. The header tab follows the position." />
          <div className="exs">
            <Example title="Boarding pass" blurb="Gate, seat, group and a barcode in one card."
              code={richCode("Boarding.tsx", "boarding", `dynaura.info({
  title: "Boarding soon",
  trailing: "40 min",
  variant: "card",
  duration: 9000,
  description: <Boarding />,
  button: { title: "Show boarding pass", onClick: openPass },
});`)}
              action={<Btn f={() => dynaura.info({ title: "Boarding soon", trailing: "40 min", variant: "card", duration: 9000, description: <Boarding />, button: { title: "Show boarding pass", onClick: () => dynaura.success("Pass added to Wallet") } })}>Check in</Btn>}>
              <Preview state="#0969da" icon={TicketIcon} title="Boarding soon" trailing="40 min" button="Show boarding pass"><Boarding /></Preview>
            </Example>

            <Example title="Ride arriving" blurb="A driver card with live trip steps."
              code={richCode("Ride.tsx", "ride", `dynaura.info({
  title: "Driver arriving",
  trailing: "3 min",
  variant: "card",
  description: <Ride />,
  button: { title: "Call driver", onClick: callDriver },
});`)}
              action={<Btn f={() => dynaura.info({ title: "Driver arriving", trailing: "3 min", variant: "card", duration: 9000, description: <Ride />, button: { title: "Call driver", onClick: () => dynaura.success("Calling Arjun") } })}>Request ride</Btn>}>
              <Preview state="#0969da" icon={MapPinIcon} title="Driver arriving" trailing="3 min" button="Call driver"><Ride /></Preview>
            </Example>

            <Example title="Food delivery" blurb="A step tracker inside the body."
              code={richCode("Food.tsx", "food", `dynaura.warning({
  title: "Out for delivery",
  trailing: "12 min",
  variant: "card",
  description: <Food />,
  button: { title: "Track order", onClick: openMap },
});`)}
              action={<Btn f={() => dynaura.warning({ title: "Out for delivery", trailing: "12 min", variant: "card", duration: 9000, description: <Food />, button: { title: "Track order", onClick: () => dynaura.info("Opening map") } })}>Order dinner</Btn>}>
              <Preview state="#9a6700" icon={ShoppingBagIcon} title="Out for delivery" trailing="12 min" button="Track order"><Food /></Preview>
            </Example>

            <Example title="Money sent" blurb="Amount, balance and a receipt action."
              code={richCode("Pay.tsx", "pay", `dynaura.success({
  title: "Payment sent",
  variant: "card",
  confetti: true,
  description: <Pay />,
  button: { title: "View receipt", onClick: openReceipt },
});`)}
              action={<Btn f={() => dynaura.success({ title: "Payment sent", variant: "card", confetti: true, duration: 9000, description: <Pay />, button: { title: "View receipt", onClick: () => dynaura.info("Opening receipt") } })}>Send $128</Btn>}>
              <Preview state="#1a7f37" icon={BanknotesIcon} title="Payment sent" button="View receipt"><Pay /></Preview>
            </Example>
          </div>
        </section>

        <section className="sec">
          <SectionHead title="Everyday toasts" lead="Success, errors, warnings and info, with actions, custom icons and trailing slots." />
          <div className="exs">
            <Example title="Checkout complete" blurb="Success with confetti and an action."
              code={`dynaura.success({
  title: "Order placed",
  description: "Arriving Thursday, order #4821",
  confetti: true,
  button: { title: "Track", onClick: openTracking },
});`}
              action={<Btn f={() => dynaura.success({ title: "Order placed", description: "Arriving Thursday, order #4821", confetti: true, button: { title: "Track", onClick: () => dynaura.info("Opening tracking") } })}>Place order</Btn>}>
              <div className="row"><span className="dot">AP</span><b>AirPods Case</b><span className="sp">$29.00</span></div>
              <div className="row"><span className="dot">SH</span><b>Shipping</b><span className="sp">Free</span></div>
            </Example>

            <Example title="Payment declined" blurb="An error whose retry starts a promise."
              code={`dynaura.error({
  title: "Payment failed",
  description: "Card ending 4242 was declined.",
  button: {
    title: "Retry",
    onClick: () =>
      dynaura.promise(charge(), {
        loading: "Retrying payment…",
        success: { title: "Payment received" },
        error: "Failed again",
      }),
  },
});`}
              action={<Btn f={() => dynaura.error({ title: "Payment failed", description: "Card ending 4242 was declined.", button: { title: "Retry", onClick: () => dynaura.promise(wait(1400), { loading: "Retrying payment…", success: { title: "Payment received", description: "Thanks, receipt sent." }, error: "Failed" }) } })}>Pay now</Btn>}>
              <div className="row"><span className="dot">VS</span><b>Visa ending 4242</b><span className="sp">Exp 12/27</span></div>
            </Example>

            <Example title="Storage almost full" blurb="A warning with a custom icon."
              code={`import { ServerStackIcon } from "@heroicons/react/24/outline";

dynaura.warning({
  title: "Storage almost full",
  icon: <ServerStackIcon width={16} height={16} />,
  description: "94% of 15 GB used. Free up space to keep syncing.",
  button: { title: "Manage", onClick: openStorage },
});`}
              action={<Btn f={() => dynaura.warning({ title: "Storage almost full", icon: <ServerStackIcon width={16} height={16} strokeWidth={2} />, description: "94% of 15 GB used. Free up space to keep syncing.", button: { title: "Manage", onClick: () => dynaura.info("Opening storage") } })}>Check storage</Btn>}>
              <div className="row"><b>Cloud drive</b><span className="sp">14.1 of 15 GB</span></div>
              <div className="meter" style={{ ["--w" as string]: "94%", ["--c" as string]: "#b25000" }}><i /></div>
            </Example>

            <Example title="Meeting reminder" blurb="Info with a trailing countdown slot."
              code={`import { CalendarDaysIcon } from "@heroicons/react/24/outline";

dynaura.info({
  title: "Design sync starts soon",
  icon: <CalendarDaysIcon width={16} height={16} />,   // any React node
  trailing: "5 min",
  description: "Room 4B, Zoom link is ready.",
  button: { title: "Join", onClick: joinCall },
});`}
              action={<Btn f={() => dynaura.info({ title: "Design sync starts soon", icon: <CalendarDaysIcon width={16} height={16} strokeWidth={2} />, trailing: "5 min", description: "Room 4B, Zoom link is ready.", button: { title: "Join", onClick: () => dynaura.success("Joining") } })}>Remind me</Btn>}>
              <div className="row"><span className="dot">15:30</span><b>Design sync</b><span className="sp">Room 4B</span></div>
            </Example>

            <Example title="Copy link" blurb="A compact toast with no body."
              code={`import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

await navigator.clipboard.writeText(url);
dynaura.success({
  title: "Link copied",
  icon: <ClipboardDocumentCheckIcon width={16} height={16} />,
});`}
              action={<Btn f={copyLink}>Copy share link</Btn>}>
              <div className="row"><b style={{ fontFamily: "var(--mono)", fontSize: 13 }}>dynaura.dev/share/8f2a</b></div>
            </Example>
          </div>
        </section>

        <section className="sec">
          <SectionHead title="Flows" lead="Promises, progress, undo and queues: toasts that change as work happens." />
          <div className="exs">
            <Example title="Deploy to production" blurb="Loading, then success or error, in the same island."
              code={`dynaura.promise(deploy(), {
  loading: "Deploying to production…",
  success: (r) => ({ title: "Deployed", description: \`\${r.version} is live\` }),
  error: { title: "Deploy failed", description: "Health check timed out." },
});`}
              action={<div className="btns">
                <Btn f={() => dynaura.promise(wait(2200), { loading: "Deploying to production…", success: { title: "Deployed", description: "v2.4.1 is live in 3 regions." }, error: "Failed" })}>Deploy</Btn>
                <Btn ghost f={() => dynaura.promise(wait(2000, true), { loading: "Deploying to production…", success: "Done", error: { title: "Deploy failed", description: "Health check timed out in eu-west." } })}>Deploy (fails)</Btn>
              </div>}>
              <div className="row"><span className="dot">main</span><b>fix: checkout rounding</b><span className="sp">a3f9c1</span></div>
            </Example>

            <Example title="File upload" blurb="Live progress with rolling digits, then confetti."
              code={`const id = dynaura.loading({ title: "Uploading", progress: 0 });

onProgress((p) => dynaura.update(id, { progress: p }));   // 0..1

dynaura.update(id, {
  type: "success",
  title: "Upload complete",
  progress: undefined,
  duration: 4500,
  confetti: true,
});`}
              action={<Btn f={upload}>Upload</Btn>}>
              <div className="row"><span className="dot">ZIP</span><b>brand-assets.zip</b><span className="sp">{Math.round(pct * 100)}%</span></div>
              <div className="meter" style={{ ["--w" as string]: `${pct * 100}%` }}><i /></div>
            </Example>

            <Example title="Undo delete" blurb="An action button that really restores the row."
              code={`dynaura.info({
  title: "Message deleted",
  duration: 5000,
  button: { title: "Undo", onClick: () => restore(message) },
});`}
              action={<Btn ghost f={() => setMsgs(MESSAGES)}>Reset list</Btn>}>
              {msgs.length === 0 && <div className="empty">Inbox zero. Reset the list to try again.</div>}
              {msgs.map((m) => (
                <div className="msg" key={m.id}><b>{m.from}</b><span>{m.text}</span><button onClick={() => del(m)}>Delete</button></div>
              ))}
            </Example>

            <Example title="Send invites" blurb="Queue: one toast after another, none lost."
              code={`for (const name of ["Maya", "Dev", "Sam"]) {
  dynaura.info({ title: \`Invite sent to \${name}\`, queue: true, duration: 1600 });
}

// or turn it on globally: <Toaster queue />`}
              action={<Btn f={() => ["Maya", "Dev", "Sam"].forEach((n) => dynaura.info({ title: `Invite sent to ${n}`, queue: true, duration: 1600 }))}>Invite 3 people</Btn>}>
              <div className="row"><span className="dot">MA</span><b>Maya</b><span className="sp">maya@studio.co</span></div>
              <div className="row"><span className="dot">DE</span><b>Dev</b><span className="sp">dev@studio.co</span></div>
              <div className="row"><span className="dot">SA</span><b>Sam</b><span className="sp">sam@studio.co</span></div>
            </Example>
          </div>
        </section>

        <section className="sec">
          <SectionHead title="Live activities" lead="Sticky islands that keep running until you stop them." />
          <div className="exs">
            <Example title="Voice memo" blurb="A live timer that keeps counting."
              code={`dynaura.live({
  title: "Recording voice memo",
  button: { title: "Stop", onClick: stopRecording },
});`}
              action={<Btn f={record}>{rec === null ? "Start recording" : "Stop recording"}</Btn>}>
              <div className="row"><span className="dot"><MicrophoneIcon strokeWidth={1.8} /></span><b>New memo</b><span className="sp">{rec === null ? "Ready" : "Recording"}</span></div>
            </Example>

            <Example title="Music player" blurb="A live waveform with playback controls."
              code={`dynaura.live({
  kind: "wave",
  title: "Now playing",
  description: "Lofi Dusk, Night Drive",
  button: { title: "Pause", onClick: pause },
});`}
              action={<Btn f={play}>{playing ? "Stop" : "Play"}</Btn>}>
              <div className="row"><span className="dot"><MusicalNoteIcon strokeWidth={1.8} /></span><b>Lofi Dusk</b><span className="sp">Night Drive</span></div>
            </Example>
          </div>
        </section>

        <section className="sec">
          <SectionHead title="Gestures" lead="Hover, pin and swipe work the same on every toast." />
          <div className="gest">
            <div><h3><CursorArrowRaysIcon strokeWidth={1.8} />Hover</h3><p>Expands the island and pauses the timer. Leave and it resumes with the exact time left.</p></div>
            <div><h3><FingerPrintIcon strokeWidth={1.8} />Tap or long-press</h3><p>Pins an expandable toast open. Tap anywhere else to let go.</p></div>
            <div><h3><ArrowsUpDownIcon strokeWidth={1.8} />Swipe</h3><p>Flick toward the screen edge to dismiss. A short pull snaps back.</p></div>
          </div>
        </section>

        <section className="sec" id="developer">
          <SectionHead title="Built in the open" lead="dynaura is built and tested from this playground. A full documentation site is on its way." />
          <div className="dev">
            <div>
              <h3 className="dev-name">Ashutosh Swamy</h3>
              <p className="dev-bio">Maintainer of dynaura. The code, the docs and the rest of the work are all one click away.</p>
              <div className="dev-links">
                {SOCIALS.map((x) => (
                  <a key={x.name} href={x.href} target="_blank" rel="noreferrer">
                    {x.Icon ? <x.Icon strokeWidth={1.8} aria-hidden="true" /> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d={x.path} fill="currentColor" /></svg>}{x.name}
                  </a>
                ))}
              </div>
              <div className="dev-list">
                {PROJECT.map((x) => (
                  <a key={x.label} href={x.href} target="_blank" rel="noreferrer">
                    <span><x.Icon strokeWidth={1.8} aria-hidden="true" />{x.label}</span><b>{x.value}</b><ArrowUpRightIcon className="arrow" strokeWidth={2} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
            <div className="term">
              <div className="term-bar"><i /><i /><i /><span>~/dynaura</span></div>
              <Code dark code={{ bash: DEV_CODE }} />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span className="foot-brand"><img src="/logo-mark.png" alt="" width={50} height={24} />dynaura</span>
          <span>MIT licensed. A local playground for development, not the docs site.</span>
          <nav aria-label="Footer">
            <a href="https://dynaura.ashutoshswamy.in" target="_blank" rel="noreferrer">Docs</a>
            <a href="https://github.com/ashutoshswamy/dynaura" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://ashutoshswamy.in" target="_blank" rel="noreferrer">ashutoshswamy.in</a>
          </nav>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
