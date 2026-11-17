import { createEffect, onCleanup, onMount } from "solid-js";
import { createToaster } from "./core";
import type { ToasterHandle, ToasterOptions } from "./core";

export { dynaura } from "./store";
export type { CustomTheme, Position, ToasterOptions } from "./core";
export type { AvatarItem, Content, DismissReason, Presence, ToastOptions, ToastType } from "./store";

/** <Toaster position="top" theme="system" /> — mount once. Content is string or DOM Node. */
export function Toaster(props: ToasterOptions) {
  let c: ToasterHandle | undefined;
  onMount(() => { c = createToaster({ ...props }); });
  createEffect(() => c?.set({ ...props }));
  onCleanup(() => c?.destroy());
  return null;
}
