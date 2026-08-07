(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERVAL = 4000;

  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const track = gallery.querySelector('[data-gallery-track]');
    const prev = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');
    const dotsWrap = gallery.querySelector('[data-gallery-dots]');
    const slides = track ? track.children : [];
    const total = slides.length;
    if (!track || total === 0) return;

    let idx = 0;
    let timer = null;

    const go = (i) => {
      idx = (i + total) % total;
      track.style.transform = `translateX(-${idx * 100}%)`;
      [...dotsWrap.children].forEach((d, j) => d.classList.toggle('is-active', j === idx));
    };

    if (total < 2) {
      prev.style.display = 'none';
      next.style.display = 'none';
      dotsWrap.style.display = 'none';
      go(0);
      return;
    }

    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'gallery__dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => { go(i); restart(); });
      dotsWrap.appendChild(dot);
    }

    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => {
      if (reduce) return;
      stop();
      timer = setInterval(() => go(idx + 1), INTERVAL);
    };
    const restart = () => { stop(); start(); };

    go(0);
    prev.addEventListener('click', () => { go(idx - 1); restart(); });
    next.addEventListener('click', () => { go(idx + 1); restart(); });

    gallery.addEventListener('pointerenter', stop);
    gallery.addEventListener('pointerleave', start);
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

    start();
  });
})();
