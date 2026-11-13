import { defineComponent, onBeforeUnmount, onMounted, watch } from "vue";
import { createToaster } from "./core";
import type { ToasterHandle, ToasterOptions } from "./core";

export { dynaura } from "./store";
export type { CustomTheme, Position, ToasterOptions } from "./core";

const clean = (p: Record<string, unknown>) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) as ToasterOptions;

/** <Toaster position="top" theme="system" /> — mount once. Content is string or DOM Node. */
export const Toaster = defineComponent({
  name: "DynauraToaster",
  props: {
    position: String,
    offset: Number,
    theme: [String, Object],
    timer: { type: Boolean, default: undefined },
    haptics: { type: Boolean, default: undefined },
    queue: { type: Boolean, default: undefined },
  },
  setup(props) {
    let c: ToasterHandle | undefined;
    onMounted(() => { c = createToaster(clean({ ...props })); });
    watch(() => ({ ...props }), (p) => c?.set(clean(p)), { deep: true });
    onBeforeUnmount(() => c?.destroy());
    return () => null;
  },
});
