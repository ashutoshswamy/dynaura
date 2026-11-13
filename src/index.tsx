import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { createToaster } from "./core";
import type { ToasterHandle, ToasterOptions } from "./core";

export { dynaura } from "./store";
export type { Content, ToastOptions, ToastType } from "./store";
export type { CustomTheme, Position } from "./core";

export type ToasterProps = Omit<ToasterOptions, "render">;
type Slot = { k: number; el: HTMLElement; node: ReactNode };

/** Mount once. Description / icon / trailing may be React nodes (rendered via portals). */
export function Toaster(props: ToasterProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const handle = useRef<ToasterHandle | undefined>(undefined);
  const latest = useRef(props);
  latest.current = props;
  const seq = useRef(0);

  useEffect(() => {
    const render = (el: HTMLElement, node: unknown) =>
      setSlots((s) => {
        const rest = s.filter((x) => x.el !== el);
        return node == null ? rest : [...rest, { k: ++seq.current, el, node: node as ReactNode }];
      });
    handle.current = createToaster({ ...latest.current, render });
    return () => { handle.current?.destroy(); handle.current = undefined; };
  }, []);

  const key = JSON.stringify(props);
  useEffect(() => { handle.current?.set(latest.current); }, [key]);

  return <>{slots.map((s) => createPortal(s.node, s.el, String(s.k)))}</>;
}
