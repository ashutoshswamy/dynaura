import { DestroyRef, PLATFORM_ID, inject } from "@angular/core";
import { createToaster } from "./core";
import type { ToasterHandle, ToasterOptions } from "./core";

export { dynaura } from "./store";
export type { CustomTheme, Position, ToasterOptions } from "./core";
export type { AvatarItem, Content, DismissReason, Presence, ToastOptions, ToastType } from "./store";

/**
 * Call once in an injection context (root component constructor / field initializer).
 * Destroyed with the host; a no-op on the server.
 *   toaster = injectToaster({ position: "top" });
 */
export function injectToaster(options?: ToasterOptions): ToasterHandle {
  if (inject(PLATFORM_ID) === "server") return { set() {}, destroy() {} };
  const c = createToaster(options);
  inject(DestroyRef).onDestroy(() => c.destroy());
  return c;
}
