// jsdom gaps
(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
(globalThis as any).matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
if (typeof HTMLElement !== "undefined") HTMLElement.prototype.setPointerCapture ??= () => {};
