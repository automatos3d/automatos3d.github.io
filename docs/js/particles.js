(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#CC785C', '#B88E5F', '#D9C6B3', '#A85B41'];

  let W = 0, H = 0, dpr = 1;
  let mx = -1, my = -1;
  const tris = [];
  let target = 0;

  window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    target = Math.min(70, Math.round((W * H) / 18000));
  }
  window.addEventListener('resize', resize);
  resize();

  function spawn() {
    const vsp = [], vph = [], vamp = [];
    for (let i = 0; i < 3; i++) {
      vsp.push(0.25 + Math.random() * 0.4);
      vph.push(Math.random() * Math.PI * 2);
      vamp.push(2 + Math.random() * 5);
    }
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 3 + Math.random() * 30,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.3,
      vx: (Math.random() - 0.5) * 8,
      vy: -(2 + Math.random() * 5),
      swayPh: Math.random() * Math.PI * 2,
      swaySpd: 0.3 + Math.random() * 0.6,
      swayAmp: 3 + Math.random() * 6,
      depth: 0.05 + Math.random() * 0.18,
      life: 1,
      decay: 0.03 + Math.random() * 0.07,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vsp, vph, vamp,
    };
  }

  // alpha ramps in on spawn and out on death
  function alphaScale(p) {
    if (p.life > 0.8) return Math.max(0, (1 - p.life) / 0.2);
    if (p.life < 0.25) return Math.max(0, p.life / 0.25);
    return 1;
  }

  function drawTri(p, t, sy) {
    const xx = ((p.x) % W + W) % W;
    const yy = ((p.y + sy * p.depth) % H + H) % H;

    const da = (Math.PI * 2) / 3;
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const base = p.rot + i * da;
      let vx = xx + p.r * Math.cos(base) + Math.sin(t * p.vsp[i] + p.vph[i]) * p.vamp[i];
      let vy = yy + p.r * Math.sin(base) + Math.cos(t * p.vsp[i] * 1.3 + p.vph[i]) * p.vamp[i];
      if (mx >= 0) {
        const dx = vx - mx, dy = vy - my;
        const d2 = dx * dx + dy * dy;
        const R = 110;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = 1 - d / R;
          const push = f * 22;
          vx += (dx / d) * push;
          vy += (dy / d) * push;
        }
      }
      pts.push([vx, vy]);
    }
    const a = alphaScale(p);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, a) * 0.04;
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = Math.max(0, a) * 0.15;
    ctx.stroke();
  }

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
    const t = now / 1000;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, W, H);
    const sy = window.scrollY;

    if (reduce) {
      if (tris.length === 0) {
        while (tris.length < target) tris.push(spawn());
      }
      for (const p of tris) { p.life = 0.5; drawTri(p, 0, sy); }
      return;
    }

    // steady lifecycle: dead triangles are replaced by fresh spawns
    while (tris.length < target) tris.push(spawn());

    for (let i = tris.length - 1; i >= 0; i--) {
      const p = tris[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) { tris.splice(i, 1); continue; }
      p.rot += p.rotSpd * dt;
      p.x += (p.vx + Math.sin(t * p.swaySpd + p.swayPh) * p.swayAmp) * dt;
      p.y += p.vy * dt;
      if (p.y < -40) { p.y = H + 30; p.x = Math.random() * W; }
      if (p.x < -40) p.x = W + 30;
      else if (p.x > W + 40) p.x = -30;
      drawTri(p, t, sy);
    }

    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i];
      p.life -= p.decay;
      if (p.life <= 0) { pings.splice(i, 1); continue; }
      const r = (1 - p.life) * p.maxR;
      ctx.globalAlpha = Math.max(0, p.life) * 0.85;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life) * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
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
