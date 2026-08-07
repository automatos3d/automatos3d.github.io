(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#C1CD7D', '#B88E5F', '#49D1D5', '#E0E0E0'];

  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- ambient particles ----
  const ambient = [];
  const count = reduce ? 0 : Math.min(80, Math.round((W * H) / 22000));

  function makeAmbient() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.5 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 5,
      vy: -(3 + Math.random() * 10),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.4 + Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.1 + Math.random() * 0.28,
    };
  }
  for (let i = 0; i < count; i++) ambient.push(makeAmbient());

  // ---- hover holographic pings ----
  const pings = [];

  function ping(x, y) {
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      pings.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        life: 1,
        decay: 0.035 + Math.random() * 0.025,
        maxR: 16 + Math.random() * 22,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    if (pings.length > 80) pings.splice(0, pings.length - 80);
  }

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointerenter', (e) => { if (!reduce) ping(e.clientX, e.clientY); });
    card.addEventListener('pointermove', (e) => {
      if (reduce) return;
      if (Math.random() < 0.2) ping(e.clientX, e.clientY);
    });
  });

  // ---- render loop ----
  let raf = null;
  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < ambient.length; i++) {
      const p = ambient[i];
      p.phase += dt * p.twinkle;
      p.sway += dt * p.swaySpeed;
      p.x += (p.vx + Math.sin(p.sway) * 8) * dt;
      p.y += p.vy * dt;
      if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
      if (p.x < -8) p.x = W + 8;
      else if (p.x > W + 8) p.x = -8;
      ctx.globalAlpha = Math.max(0, p.alpha * (0.55 + 0.45 * Math.sin(p.phase)));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i];
      p.life -= p.decay;
      if (p.life <= 0) { pings.splice(i, 1); continue; }
      const r = (1 - p.life) * p.maxR;
      ctx.globalAlpha = Math.max(0, p.life) * 0.6;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life) * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (reduce) return;
    raf = requestAnimationFrame(frame);
  }

  if (reduce) {
    frame(performance.now());
  } else {
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
  }
})();
