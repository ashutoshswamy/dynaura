import { createToaster } from "./core";
import type { ToasterOptions } from "./core";

export { dynaura } from "./store";
export type { CustomTheme, Position, ToasterOptions } from "./core";

/** Svelte action: <div use:toaster={{ position: "top", theme: "system" }} /> — mount once. */
export const toaster = (_node: HTMLElement, options?: ToasterOptions) => {
  const c = createToaster(options);
  return { update: (o: ToasterOptions) => c.set(o), destroy: () => c.destroy() };
};
