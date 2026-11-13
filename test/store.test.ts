import { beforeEach, expect, test } from "vitest";
import { dynaura, getCurrent, setQueue } from "../src/store";

beforeEach(() => { setQueue(false); dynaura.clear(); });

test("new toast replaces current; dismiss clears", () => {
  dynaura.success("a");
  const id = dynaura.error("b");
  expect(getCurrent()?.title).toBe("b");
  dynaura.dismiss("nope");
  expect(getCurrent()).toBeTruthy();
  dynaura.dismiss(id);
  expect(getCurrent()).toBeNull();
});

test("queue: later toasts wait, dismiss advances", () => {
  setQueue(true);
  dynaura.info("one");
  const two = dynaura.info("two");
  dynaura.info({ title: "three", queue: false }); // per-toast override replaces immediately
  expect(getCurrent()?.title).toBe("three");
  dynaura.dismiss();
  expect(getCurrent()?.id).toBe(two);
});

test("update patches current and queued toasts", () => {
  setQueue(true);
  const a = dynaura.loading({ title: "up", progress: 0 });
  const b = dynaura.info("later");
  dynaura.update(a, { progress: 0.5 });
  dynaura.update(b, { title: "later!" });
  expect(getCurrent()?.progress).toBe(0.5);
  dynaura.dismiss();
  expect(getCurrent()?.title).toBe("later!");
});

test("promise morphs loading -> success / error", async () => {
  await dynaura.promise(Promise.resolve(7), { loading: "wait", success: (v) => `got ${v}`, error: "no" });
  expect([getCurrent()?.type, getCurrent()?.title]).toEqual(["success", "got 7"]);
  await dynaura.promise(Promise.reject(1), { loading: "wait", success: "ok", error: "bad" }).catch(() => {});
  await Promise.resolve();
  expect([getCurrent()?.type, getCurrent()?.title]).toEqual(["error", "bad"]);
});

test("live defaults: sticky + timer", () => {
  dynaura.live("Recording");
  expect(getCurrent()).toMatchObject({ type: "live", duration: null, kind: "timer" });
});
