import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test } from "vitest";
import { Toaster, dynaura } from "../src/index";

afterEach(() => dynaura.clear());

test("React nodes render into the island via portals", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(<Toaster theme="light" />); });
  expect(document.querySelector(".dynaura-root")).toBeTruthy();
  await act(async () => { dynaura.success({ title: "Hi", description: <b data-x>bold</b>, trailing: <i>1:00</i> }); });
  expect(document.querySelector(".dynaura-desc b[data-x]")?.textContent).toBe("bold");
  expect(document.querySelector(".dynaura-trailing i")?.textContent).toBe("1:00");
  await act(async () => { dynaura.success({ title: "Next", description: <u>two</u> }); });
  expect(document.querySelector(".dynaura-desc b")).toBeNull();
  expect(document.querySelector(".dynaura-desc u")?.textContent).toBe("two");
  await act(async () => { root.unmount(); });
  expect(document.querySelector(".dynaura-root")).toBeNull();
});

test("SSR renders nothing and does not touch the DOM", () => {
  expect(renderToString(<Toaster />)).toBe("");
});
