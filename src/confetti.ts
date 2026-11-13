/** Tiny canvas confetti burst from (x, y) in viewport px. Removes itself after ~1s. */
export function burst(x: number, y: number, color: string) {
  const c = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  const W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr;
  c.style.cssText = `position:fixed;top:0;left:0;width:${W}px;height:${H}px;pointer-events:none;z-index:2147483647`;
  document.body.append(c);
  const ctx = c.getContext("2d");
  if (!ctx) return c.remove();
  ctx.scale(dpr, dpr);
  const colors = [color, "#fff", color, "#ffd60a", "#0a84ff"];
  const ps = Array.from({ length: 36 }, () => {
    const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 6;
    return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, r: 2 + Math.random() * 3, rot: Math.random() * 6, c: colors[(Math.random() * colors.length) | 0] };
  });
  const t0 = performance.now();
  const frame = (t: number) => {
    const k = (t - t0) / 1000;
    if (k >= 1) return c.remove();
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.vx *= 0.985; p.rot += 0.2;
      ctx.globalAlpha = 1 - k * k;
      ctx.fillStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
