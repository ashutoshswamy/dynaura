import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createToaster, dynaura } from "../src/vanilla";
import type { ToasterHandle } from "../src/vanilla";

let c: ToasterHandle;
const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const island = () => $(".dynaura-island");
const ev = (el: Element, type: string, props: Record<string, unknown> = {}) =>
  el.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), props));

beforeEach(() => { vi.useFakeTimers(); c = createToaster(); });
afterEach(() => { c.destroy(); dynaura.clear(); vi.useRealTimers(); });

test("shows toast, expands, collapses, auto-dismisses", () => {
  dynaura.success({ title: "Saved", description: "ok", duration: 3000 });
  expect(island().hidden).toBe(false);
  expect($(".dynaura-title").textContent).toBe("Saved");
  expect(island().dataset.type).toBe("success");
  expect(island().dataset.expanded).toBe("false");
  vi.advanceTimersByTime(460);
  expect(island().dataset.expanded).toBe("true");
  vi.advanceTimersByTime(2100); // collapse at duration-500
  expect(island().dataset.expanded).toBe("false");
  vi.advanceTimersByTime(500);
  expect(island().dataset.open).toBe("false");
  vi.advanceTimersByTime(500);
  expect(island().hidden).toBe(true);
});

test("hover pauses the timer, leave resumes with remaining time", () => {
  dynaura.info({ title: "hi", duration: 2000 });
  vi.advanceTimersByTime(1000);
  ev(island(), "pointerenter", { pointerType: "mouse" });
  vi.advanceTimersByTime(10_000);
  expect(island().dataset.open).toBe("true");
  ev(island(), "pointerleave", { pointerType: "mouse" });
  vi.advanceTimersByTime(900);
  expect(island().dataset.open).toBe("true");
  vi.advanceTimersByTime(200);
  expect(island().dataset.open).toBe("false");
});

test("progress updates roll digits without restarting the toast", () => {
  const id = dynaura.loading({ title: "Uploading", progress: 0.1 });
  const trail = $(".dynaura-trailing");
  expect(trail.getAttribute("aria-label")).toBe("10%");
  const badge = $(".dynaura-badge");
  dynaura.update(id, { progress: 0.42 });
  expect(trail.getAttribute("aria-label")).toBe("42%");
  expect($(".dynaura-badge")).toBe(badge);
  expect(island().querySelector<HTMLElement>(".dynaura-bar")!.style.getPropertyValue("--p")).toBe("0.42");
  dynaura.update(id, { type: "success", title: "Done", progress: undefined, duration: 1000 });
  expect(trail.hidden).toBe(true);
  expect(island().dataset.type).toBe("success");
});

test("queue option shows toasts in order", () => {
  c.set({ queue: true });
  dynaura.info({ title: "one", duration: 1000 });
  dynaura.info({ title: "two", duration: 1000 });
  expect($(".dynaura-title").textContent).toBe("one");
  vi.advanceTimersByTime(1001);
  expect($(".dynaura-title").textContent).toBe("two");
});

test("live toast ticks a timer", () => {
  dynaura.live("Recording");
  expect($(".dynaura-trailing").getAttribute("aria-label")).toBe("0:00");
  vi.advanceTimersByTime(65_000);
  expect($(".dynaura-trailing").getAttribute("aria-label")).toBe("1:05");
});

test("themes + positions", () => {
  c.set({ theme: { background: "#123456", success: "#0f0" }, position: "bottom-right" });
  const r = $(".dynaura-root");
  expect(r.dataset.theme).toBe("custom");
  expect(r.style.getPropertyValue("--dynaura-bg")).toBe("#123456");
  expect([r.dataset.y, r.dataset.x]).toEqual(["bottom", "right"]);
  c.set({ theme: "light" });
  expect(r.style.getPropertyValue("--dynaura-bg")).toBe(""); // custom vars cleared
  expect(r.dataset.theme).toBe("light");
});

test("swipe toward the edge dismisses; short swipe snaps back", () => {
  dynaura.info({ title: "swipe", duration: null });
  const d = $(".dynaura-drag");
  ev(d, "pointerdown", { clientY: 100, pointerId: 1 });
  ev(d, "pointermove", { clientY: 90 });
  ev(d, "pointerup", { clientY: 90 }); // 10px up: too short
  expect(island().dataset.open).toBe("true");
  ev(d, "pointerdown", { clientY: 100, pointerId: 1 });
  ev(d, "pointermove", { clientY: 40 });
  ev(d, "pointerup", { clientY: 40 }); // 60px up on a top toast
  expect(island().dataset.open).toBe("false");
});

test("tap pins an expandable toast; outside click unpins", () => {
  dynaura.info({ title: "t", description: "d", duration: 1000 });
  const d = $(".dynaura-drag");
  ev(d, "pointerdown", { clientY: 10, pointerId: 1 });
  ev(d, "pointerup", { clientY: 10 });
  vi.advanceTimersByTime(5000);
  expect(island().dataset.open).toBe("true");
  expect(island().dataset.expanded).toBe("true");
  ev(document.body, "pointerdown");
  vi.advanceTimersByTime(1100);
  expect(island().dataset.open).toBe("false");
});

test("custom text content is escaped (no HTML injection)", () => {
  dynaura.info({ title: "<img src=x onerror=alert(1)>", description: "<b>x</b>" });
  expect(document.querySelector(".dynaura-island img")).toBeNull();
  expect($(".dynaura-desc").textContent).toBe("<b>x</b>");
});

test("card variant flags island + wrapper (outline drawn from live size)", () => {
  dynaura.success({ title: "Booked", variant: "card", description: "x" });
  expect(island().dataset.variant).toBe("card");
  expect($(".dynaura-drag").dataset.variant).toBe("card");
  dynaura.info("plain");
  expect(island().dataset.variant).toBe("default");
  expect(island().style.clipPath).toBe("");
});

test("timer bar: duration survives the animation restart; modes; timer=false flag", () => {
  dynaura.info({ title: "t", duration: 3000 });
  const bar = $<HTMLElement>(".dynaura-bar");
  expect(bar.dataset.mode).toBe("time");
  expect(bar.style.animationDuration).toBe("3000ms");
  ev(island(), "pointerenter", { pointerType: "mouse" });
  expect(island().dataset.paused).toBe("true"); // CSS pauses the bar on this flag
  ev(island(), "pointerleave", { pointerType: "mouse" });
  expect(island().dataset.paused).toBe("false");
  dynaura.loading({ title: "sticky" });
  expect(bar.dataset.mode).toBe("none");
  dynaura.loading({ title: "up", progress: 0.3 });
  expect(bar.dataset.mode).toBe("value");
  c.set({ timer: false });
  expect($(".dynaura-root").dataset.timer).toBe("false");
});
