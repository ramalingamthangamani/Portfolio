/* =========================================================
   Ramalingam T — Portfolio interactions
   ========================================================= */
(function () {
  'use strict';

  const html = document.documentElement;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  if (!HAS_GSAP || REDUCED) html.classList.add('no-pin');

  /* ---------- Local time in Erode (IST) ---------- */
  const clockFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  function tick() { const v = clockFmt.format(new Date()); $$('[data-clock]').forEach((el) => { el.textContent = v; }); }
  tick(); setInterval(tick, 15000);

  /* ---------- Visuals ---------- */
  if (window.Visuals) {
    Visuals.initField($('#heroField'));
    Visuals.initProjects();
    Visuals.start();
  }

  /* ---------- Text splitting ---------- */
  // Wrap every word in a mask so it can slide up from below, preserving inline elements like <span class="serif">.
  function splitWords(el) {
    const out = [];
    (function walk(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = tok;
            w.appendChild(wi); frag.appendChild(w); out.push(wi);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(el);
    return out;
  }

  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    return Array.from(text).map((c) => {
      const m = document.createElement('span'); m.className = 'chm';
      const ch = document.createElement('span'); ch.className = 'ch'; ch.textContent = c;
      m.appendChild(ch); el.appendChild(m);
      return ch;
    });
  }

  /* ---------- Fit the hero name to the viewport width ---------- */
  const hero = $('.hero');
  const heroName = $('#heroName'), heroGhost = $('#heroGhost');
  const heroChars = heroName ? splitChars(heroName) : [];
  const heroMasks = heroChars.map((c) => c.parentElement);
  if (heroGhost) splitChars(heroGhost);
  const lensMap = { centers: [], h: 0 };
  let heroSize = 0;
  function fitHero() {
    if (!heroName) return;
    // measure at the resting weight so the lens can only ever make letters narrower
    heroChars.forEach((c) => c.style.removeProperty('--w'));
    const box = heroName.parentElement.getBoundingClientRect().width;
    heroName.style.fontSize = '100px';
    heroName.style.display = 'inline-block';
    const natural = heroName.getBoundingClientRect().width;
    heroName.style.display = '';
    heroSize = Math.min((100 * box) / natural, window.innerHeight * 0.6);
    heroName.style.fontSize = heroSize.toFixed(2) + 'px';
    if (heroGhost) heroGhost.style.fontSize = heroName.style.fontSize;
    lensMap.centers = heroMasks.map((m) => m.offsetLeft + m.offsetWidth / 2);
    lensMap.h = heroName.offsetHeight;
  }
  fitHero();

  /* ---------- Hero: weight lens, depth parallax, pointer light, timecode ---------- */
  // Letters near the pointer thin out and glow blue; with no pointer, a slow scan sweeps the name.
  const lens = { x: -9999, y: 0, tx: 0, ty: 0, amp: 0, on: false, gx: 0.7, gy: 0.4, px: 0.7, py: 0.4, idleSince: performance.now() + 4200 };
  const heroTC = $('#heroTC');
  if (hero && heroName && !REDUCED) {
    const title = heroName.parentElement;
    const par = { x: 0, y: 0 };
    const weights = heroChars.map(() => 900);
    const t0 = performance.now();
    let visible = true, lastF = -1;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const r = title.getBoundingClientRect(), hr = hero.getBoundingClientRect();
      lens.tx = e.clientX - r.left; lens.ty = e.clientY - r.top;
      if (!lens.on) { lens.x = lens.tx; lens.y = lens.ty; }
      lens.px = (e.clientX - hr.left) / hr.width; lens.py = (e.clientY - hr.top) / hr.height;
      lens.on = true;
    });
    hero.addEventListener('pointerleave', () => { lens.on = false; lens.idleSince = performance.now(); });

    const pad = (n) => String(n).padStart(2, '0');
    (function run(now) {
      requestAnimationFrame(run);
      if (!visible) return;
      const t = (now - t0) / 1000;

      // 24 fps timecode
      const f = Math.floor(t * 24);
      if (heroTC && f !== lastF) {
        lastF = f;
        const s = Math.floor(f / 24);
        heroTC.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % 24)}`;
      }

      // where the lens should be
      let amp = 0, px = 0.5 + Math.sin(t * 0.21) * 0.28, py = 0.42 + Math.cos(t * 0.17) * 0.12;
      if (lens.on) {
        amp = 1; px = lens.px; py = lens.py;
        lens.x += (lens.tx - lens.x) * 0.16; lens.y += (lens.ty - lens.y) * 0.16;
      } else {
        const idle = (now - lens.idleSince) / 1000 - 1.2;
        const p = idle > 0 ? (idle % 7) / 7 : 1;
        if (p < 0.55) {
          const u = p / 0.55, e = u * u * (3 - 2 * u);
          const w = title.offsetWidth;
          lens.x = -0.2 * w + e * 1.4 * w; lens.y = lensMap.h / 2;
          amp = 0.8 * Math.sin(Math.PI * u);
        }
      }
      lens.amp += (amp - lens.amp) * 0.1;

      const sigma = heroSize * 0.36;
      const fy = Math.exp(-Math.pow((lens.y - lensMap.h / 2) / (heroSize * 0.95), 2));
      heroChars.forEach((c, i) => {
        const dx = lensMap.centers[i] - lens.x;
        const k = lens.amp * fy * Math.exp(-(dx * dx) / (2 * sigma * sigma));
        const w = 900 - 760 * k;
        if (Math.abs(w - weights[i]) > 0.5) {
          weights[i] = w;
          c.style.setProperty('--w', w.toFixed(0));
          c.style.setProperty('--h', k.toFixed(3));
        }
      });

      // pointer light + depth parallax (the hollow echo drifts against the pointer)
      lens.gx += (px - lens.gx) * 0.06; lens.gy += (py - lens.gy) * 0.06;
      hero.style.setProperty('--glow-x', (lens.gx * 100).toFixed(2) + '%');
      hero.style.setProperty('--glow-y', (lens.gy * 100).toFixed(2) + '%');
      par.x += ((lens.gx - 0.5) - par.x) * 0.08; par.y += ((lens.gy - 0.5) - par.y) * 0.08;
      if (heroGhost) heroGhost.style.translate = `${(-par.x * heroSize * 0.15).toFixed(2)}px ${(-par.y * heroSize * 0.1).toFixed(2)}px`;
      heroName.style.translate = `${(par.x * 12).toFixed(2)}px ${(par.y * 8).toFixed(2)}px`;
    })(performance.now());
  }

  /* ---------- Toast + copy email ---------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2400);
  }
  const copyBtn = $('#copyBtn');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const v = copyBtn.dataset.copy;
    try {
      await navigator.clipboard.writeText(v);
      $('#copyText').textContent = 'Copied ✓';
      showToast('Email copied to clipboard');
    } catch (e) {
      showToast(v);
    }
    setTimeout(() => { $('#copyText').textContent = 'Copy email'; }, 2200);
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn'), menu = $('#menu');
  let lenis = null;
  function setMenu(open) {
    html.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    $('.nav__menu-text').textContent = open ? 'Close' : 'Menu';
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('menu-open')) setMenu(false); });

  /* ---------- Anchor navigation ---------- */
  function goTo(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (html.classList.contains('menu-open')) { setMenu(false); setTimeout(() => goTo(target), 350); }
    else goTo(target);
  }));

  /* ---------- Custom cursor ---------- */
  if (FINE && !REDUCED) {
    html.classList.add('has-cursor');
    const cur = $('#cursor'), dot = $('#cursorDot'), label = $('#cursorLabel');
    const p = { x: innerWidth / 2, y: innerHeight / 2 }, c = { x: p.x, y: p.y };
    addEventListener('pointermove', (e) => {
      p.x = e.clientX; p.y = e.clientY;
      dot.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      cur.classList.remove('is-hidden'); dot.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('pointerleave', () => { cur.classList.add('is-hidden'); dot.classList.add('is-hidden'); });
    (function follow() {
      c.x += (p.x - c.x) * 0.18; c.y += (p.y - c.y) * 0.18;
      cur.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
      requestAnimationFrame(follow);
    })();
    document.addEventListener('pointerover', (e) => {
      const withLabel = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, .chips li, .frow');
      if (withLabel) { label.textContent = withLabel.dataset.cursor; cur.classList.add('is-label'); cur.classList.remove('is-hover'); }
      else if (hov) { cur.classList.add('is-hover'); cur.classList.remove('is-label'); }
      else { cur.classList.remove('is-hover', 'is-label'); }
    });
  }

  /* ---------- Magnetic elements ---------- */
  if (FINE && !REDUCED) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.28, y = (e.clientY - r.top - r.height / 2) * 0.38;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 600);
      });
    });
  }

  /* ---------- Moments: floating image preview ---------- */
  const peek = $('#peek'), peekImg = $('#peekImg');
  if (FINE && peek) {
    const pos = { x: 0, y: 0, tx: 0, ty: 0, vx: 0 };
    let on = false;
    $$('.moment').forEach((m) => {
      m.addEventListener('pointerenter', () => { peekImg.src = m.dataset.img; peek.classList.add('is-on'); on = true; });
      m.addEventListener('pointerleave', () => { peek.classList.remove('is-on'); on = false; });
    });
    addEventListener('pointermove', (e) => {
      pos.tx = e.clientX; pos.ty = e.clientY;
      if (!on) { pos.x = pos.tx; pos.y = pos.ty; }
    }, { passive: true });
    (function run() {
      const px = pos.x;
      pos.x += (pos.tx - pos.x) * 0.14; pos.y += (pos.ty - pos.y) * 0.14;
      pos.vx += ((pos.x - px) - pos.vx) * 0.2;
      const rot = REDUCED ? 0 : Math.max(-10, Math.min(10, pos.vx * 0.6));
      const w = peek.offsetWidth, h = peek.offsetHeight;
      peek.style.left = (pos.x - w / 2) + 'px';
      peek.style.top = (pos.y - h - 24) + 'px';
      peek.firstElementChild.style.transform = `rotate(${rot}deg)`;
      requestAnimationFrame(run);
    })();
  }

  /* ---------- Education card tilt ---------- */
  if (FINE && !REDUCED) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Section indicator + nav state (works without GSAP) ---------- */
  const navIdx = $('#navIdx'), navLabel = $('#navLabel'), nav = $('#nav');
  const navLinks = $$('.nav__links a');
  function setSection(sec) {
    if (!sec || navLabel.textContent === sec.dataset.section) return;
    navIdx.textContent = sec.dataset.idx;
    navLabel.textContent = sec.dataset.section;
    if (HAS_GSAP && !REDUCED) gsap.fromTo([navIdx, navLabel], { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + sec.id));
  }
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setSection(e.target); });
  }, { rootMargin: '-45% 0px -54% 0px' });
  $$('[data-section]').forEach((s) => secObs.observe(s));

  let lastY = scrollY;
  const bar = $('#progress');
  function onScroll() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (!html.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY && y > 300);
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* =========================================================
     Without GSAP (CDN blocked) or with reduced motion: just reveal.
     ========================================================= */
  const loader = $('#loader');
  if (!HAS_GSAP || REDUCED) {
    if (heroName) heroName.classList.add('is-landed');
    const done = () => { loader && loader.remove(); document.body.classList.remove('is-loading'); };
    if (REDUCED) done(); else setTimeout(done, 300);
    return;
  }

  /* =========================================================
     Motion (GSAP + ScrollTrigger + Lenis)
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('is-loading');
  // Always start at the top so the intro plays; honour deep links once it finishes.
  const deepLink = location.hash && document.querySelector(location.hash);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- Hero intro: a title card (built once the fonts are in, hidden behind the loader) ---------- */
  const heroFades = $$('[data-hero-fade]');
  const mid = (heroMasks.length - 1) / 2;
  function buildIntro() {
    return gsap.timeline({ paused: true, defaults: { ease: 'expo.out' }, onComplete: landHero })
      // letterbox is closed while the name rises out of blur, its tracking collapsing from wide to tight
      .fromTo('.hero__bars i', { scaleY: 1 }, { scaleY: 0, duration: 1.6, ease: 'expo.inOut' }, 1.05)
      .from(heroChars, { yPercent: 120, filter: 'blur(16px)', duration: 1.7, stagger: { each: 0.055, from: 'center' }, clearProps: 'filter' }, 0)
      .from(heroMasks, { x: (i) => (i - mid) * heroSize * 0.14, duration: 2.3, ease: 'expo.inOut' }, 0)
      .fromTo('.hero__flare', { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 1, ease: 'expo.out' }, 0.95)
      .to('.hero__flare', { opacity: 0, duration: 1.3, ease: 'power2.out' }, 1.45)
      .from(heroGhost, { opacity: 0, scale: 1.12, duration: 2.6, ease: 'power3.out' }, 0.9)
      .from('#heroField', { opacity: 0, duration: 2.4, ease: 'power2.out' }, 0.4)
      .from('.hero__glow', { opacity: 0, duration: 2.4, ease: 'power2.out' }, 0.8)
      .from(heroFades, { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, 1.3)
      .from('.hero__frame i', { opacity: 0, scale: 0.3, duration: 1, stagger: 0.07 }, 1.5)
      .from('.nav', { yPercent: -100, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, 1.4);
  }

  /* ---------- Hero scroll-out: the name breaks apart and the scene fades to black ---------- */
  function landHero() {
    heroName.classList.add('is-landed');
    lens.idleSince = Math.min(lens.idleSince, performance.now());
    gsap.timeline({
      defaults: { ease: 'power1.in' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
    })
      .to(heroMasks, { x: (i) => (i - mid) * heroSize * 0.32, yPercent: (i) => -Math.abs(i - mid) * 9, opacity: 0, filter: 'blur(10px)' }, 0)
      .to(heroGhost, { scale: 1.3, opacity: 0 }, 0)
      .to('.hero__meta, .hero__row, .hero__frame', { y: -90, opacity: 0 }, 0)
      .to('.hero__shade', { opacity: 0.9, ease: 'none' }, 0);
  }

  /* ---------- Preloader ---------- */
  const count = $('#loaderCount'), lbar = $('#loaderBar');
  const counter = { v: 0 };
  const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  const minTime = new Promise((r) => setTimeout(r, 1300));
  const maxTime = new Promise((r) => setTimeout(r, 3200));
  gsap.to(counter, {
    v: 86, duration: 1.3, ease: 'power2.inOut',
    onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); lbar.style.transform = `scaleX(${counter.v / 100})`; },
  });
  Promise.race([Promise.all([fontsReady, minTime]), maxTime]).then(() => {
    fitHero();
    ScrollTrigger.refresh();
    const intro = buildIntro();
    gsap.timeline()
      .to(counter, {
        v: 100, duration: 0.45, ease: 'power2.out',
        onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); lbar.style.transform = `scaleX(${counter.v / 100})`; },
      })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '+=0.1')
      .add(() => intro.play(), '-=0.55')
      .add(() => {
        loader.remove();
        document.body.classList.remove('is-loading');
        if (lenis) lenis.start();
        if (deepLink) goTo(deepLink);
      });
  });

  /* ---------- Heading word reveals ---------- */
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  /* ---------- Manifesto: words ink in as you read ---------- */
  $$('[data-scrub-words]').forEach((el) => {
    const words = splitWords(el);
    words.forEach((w) => w.classList.add('sw'));
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true },
    });
  });

  /* ---------- Generic reveals ---------- */
  gsap.set('[data-reveal]', { y: 40, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });
  $$('[data-reveal-group]').forEach((g) => {
    gsap.from(g.children, {
      y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: g, start: 'top 85%' },
    });
  });
  $$('.shead__rule').forEach((r) => {
    gsap.from(r, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 90%' } });
  });

  /* ---------- About portrait: curtain reveal + parallax ---------- */
  const frame = $('.about__frame');
  if (frame) {
    gsap.fromTo(frame, { clipPath: 'inset(100% 0 0 0)' }, {
      clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: { trigger: frame, start: 'top 80%' },
    });
    gsap.fromTo(frame.querySelector('img'), { yPercent: -14 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  /* ---------- Experience progress line ---------- */
  gsap.to('#expLine', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.exp__list', start: 'top 70%', end: 'bottom 60%', scrub: true },
  });

  /* ---------- Horizontal work gallery (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('#workTrack');
    const projs = $$('.proj', track);
    const now = $('#workNow');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.work__pin', pin: true, scrub: 0.8, start: 'top top',
        end: () => '+=' + dist(), invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: () => {
          const mid = innerWidth / 2;
          let best = 0, bestD = Infinity;
          projs.forEach((p, i) => { const r = p.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
          now.textContent = String(best + 1).padStart(2, '0');
        },
      },
    });
    // each project eases in as it travels toward centre
    projs.forEach((p) => {
      gsap.from(p.querySelector('.proj__body'), {
        y: 40, opacity: 0, ease: 'expo.out', duration: 1,
        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 85%' },
      });
    });
    return () => gsap.set(track, { clearProps: 'transform' });
  });
  mm.add('(max-width: 900px)', () => {
    $$('.proj').forEach((p) => {
      gsap.from(p, { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 88%' } });
    });
  });

  /* ---------- Marquee leans with scroll velocity ---------- */
  const mq = $('.marquee__track');
  if (mq && lenis) {
    const skew = gsap.quickTo(mq.parentElement, 'skewX', { duration: 0.5, ease: 'power3' });
    lenis.on('scroll', ({ velocity }) => skew(Math.max(-12, Math.min(12, -velocity * 0.35))));
  }

  /* ---------- Contact: giant footer word rises ---------- */
  gsap.from('.foot__giant', {
    yPercent: 45, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'bottom bottom+=40%', end: 'bottom bottom', scrub: true },
  });

  /* ---------- Recalculate on resize ---------- */
  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { fitHero(); ScrollTrigger.refresh(); }, 180);
  });
  addEventListener('load', () => ScrollTrigger.refresh());
})();
