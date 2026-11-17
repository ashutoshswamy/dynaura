import { afterEach, expect, test } from "vitest";
import { Injector, PLATFORM_ID, runInInjectionContext } from "@angular/core";
import { createRoot as solidRoot } from "solid-js";
import { createApp, h, nextTick, ref } from "vue";
import { dynaura as angularDynaura, injectToaster } from "../src/angular";
import { Toaster as SolidToaster, dynaura as solidDynaura } from "../src/solid";
import { toaster, dynaura as svelteDynaura } from "../src/svelte";
import { createToaster, dynaura } from "../src/vanilla";
import { Toaster as VueToaster, dynaura as vueDynaura } from "../src/vue";

const root = () => document.querySelector<HTMLElement>(".dynaura-root");
const faces = () => document.querySelectorAll(".dynaura-badge .dynaura-face").length;
const avatar = { title: "Ana", avatar: [{ name: "Ana Ruiz" }, { name: "Ben Okafor" }] }; // every adapter shares one core: the new options must flow through

afterEach(() => dynaura.clear());

test("every entry point re-exports the same store", () => {
  expect([vueDynaura, solidDynaura, svelteDynaura, angularDynaura].every((d) => d === dynaura)).toBe(true);
});

test("vanilla: mounts, shows an avatar toast, destroys", () => {
  const c = createToaster({ position: "bottom" });
  expect(root()?.dataset.y).toBe("bottom");
  dynaura.info(avatar);
  expect(faces()).toBe(2);
  c.set({ position: "top" });
  expect(root()?.dataset.y).toBe("top");
  c.destroy();
  expect(root()).toBeNull();
});

test("vue: mounts, reacts to prop changes, unmounts", async () => {
  const pos = ref("top");
  const el = document.createElement("div");
  const app = createApp({ render: () => h(VueToaster, { position: pos.value }) });
  app.mount(el);
  expect(root()?.dataset.y).toBe("top");
  pos.value = "bottom";
  await nextTick();
  expect(root()?.dataset.y).toBe("bottom");
  dynaura.info(avatar);
  expect(faces()).toBe(2);
  app.unmount();
  expect(root()).toBeNull();
});

test("svelte action: mounts, updates, destroys", () => {
  const a = toaster(document.createElement("div"), { position: "bottom" });
  expect(root()?.dataset.y).toBe("bottom");
  a.update({ position: "top" });
  expect(root()?.dataset.y).toBe("top");
  dynaura.info(avatar);
  expect(faces()).toBe(2);
  a.destroy();
  expect(root()).toBeNull();
});

test("solid: mounts inside a root and cleans up on dispose", () => {
  let dispose = () => {};
  solidRoot((d) => { dispose = d; SolidToaster({ position: "bottom" }); });
  expect(root()?.dataset.y).toBe("bottom");
  dynaura.info(avatar);
  expect(faces()).toBe(2);
  dispose();
  expect(root()).toBeNull();
});

test("angular: injectToaster mounts, destroys with the host, no-ops on the server", () => {
  const inj = (platform: string) => Injector.create({ providers: [{ provide: PLATFORM_ID, useValue: platform }] }) as Injector & { destroy(): void };
  const host = inj("browser");
  const h = runInInjectionContext(host, () => injectToaster({ position: "bottom" }));
  expect(root()?.dataset.y).toBe("bottom");
  h.set({ position: "top" });
  expect(root()?.dataset.y).toBe("top");
  host.destroy(); // fires DestroyRef.onDestroy
  expect(root()).toBeNull();
  const ssr = inj("server");
  runInInjectionContext(ssr, () => injectToaster().set({ position: "top" })); // no-op handle
  expect(root()).toBeNull();
  ssr.destroy();
});
