/* =========================================================
   Generative visuals — hero signal field + one live canvas per project.
   Every canvas only animates while it is on screen.
   ========================================================= */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const TAU = Math.PI * 2;

  const BONE = (a) => `rgba(237,234,227,${a})`;
  const LITE = (a) => `rgba(138,138,255,${a})`;
  const SIGNAL = '#2B2BF5';

  // Small deterministic PRNG so layouts are stable between frames and reloads
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);

  /* ---------- A canvas that sizes itself and only runs when visible ---------- */
  function Surface(canvas, draw, opts = {}) {
    const ctx = canvas.getContext('2d');
    const s = { canvas, ctx, w: 0, h: 0, visible: false, draw, t0: performance.now(), opts };

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      s.w = r.width; s.h = r.height;
      canvas.width = Math.round(r.width * DPR);
      canvas.height = Math.round(r.height * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (opts.onResize) opts.onResize(s);
      if (REDUCED || !s.visible) frame(performance.now());
    }
    function frame(now) {
      if (!s.w) return;
      const t = (now - s.t0) / 1000;
      ctx.clearRect(0, 0, s.w, s.h);
      draw(ctx, s.w, s.h, REDUCED ? (opts.still || 2.2) : t, s);
    }
    s.frame = frame;
    s.resize = resize;

    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { s.visible = e.isIntersecting; });
    }, { rootMargin: '120px' }).observe(canvas);

    surfaces.push(s);
    return s;
  }

  const surfaces = [];
  function loop(now) {
    for (const s of surfaces) if (s.visible) s.frame(now);
    requestAnimationFrame(loop);
  }

  /* =========================================================
     HERO — a dot-matrix signal field that reacts to the pointer
     ========================================================= */
  function initField(canvas) {
    if (!canvas) return;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
    const ripples = [];
    let dots = [];

    function build(s) {
      const gap = s.w < 600 ? 22 : 26;
      dots = [];
      const cols = Math.ceil(s.w / gap) + 1, rows = Math.ceil(s.h / gap) + 1;
      const ox = (s.w - (cols - 1) * gap) / 2, oy = (s.h - (rows - 1) * gap) / 2;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) dots.push(ox + i * gap, oy + j * gap);
    }

    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - r.left; pointer.ty = e.clientY - r.top;
      if (!pointer.active) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
      pointer.active = true;
    });
    hero.addEventListener('pointerleave', () => { pointer.active = false; });
    hero.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, born: performance.now() });
    });

    let lastAuto = 0;
    function draw(ctx, w, h, t) {
      const now = performance.now();
      // Ambient ripples keep the field alive on touch screens / idle
      if (!REDUCED && now - lastAuto > 3800 && !pointer.active) {
        lastAuto = now;
        ripples.push({ x: w * (0.55 + Math.random() * 0.4), y: h * (0.15 + Math.random() * 0.45), born: now });
      }
      pointer.x = lerp(pointer.x, pointer.tx, 0.12);
      pointer.y = lerp(pointer.y, pointer.ty, 0.12);
      const pr = Math.max(140, Math.min(w, h) * 0.22);
      const pr2 = 2 * pr * pr;

      for (let k = ripples.length - 1; k >= 0; k--) if (now - ripples[k].born > 2600) ripples.splice(k, 1);

      for (let n = 0; n < dots.length; n += 2) {
        let x = dots[n], y = dots[n + 1];
        // travelling interference pattern
        const v = Math.sin(x * 0.011 + t * 0.8) * Math.cos(y * 0.016 - t * 0.55) + 0.6 * Math.sin((x + y) * 0.006 - t * 1.1);
        let f = 0;
        if (pointer.active) {
          const dx = x - pointer.x, dy = y - pointer.y;
          f = Math.exp(-(dx * dx + dy * dy) / pr2);
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          x += (dx / d) * f * 16; y += (dy / d) * f * 16;
        }
        let rf = 0;
        for (const r of ripples) {
          const age = (now - r.born) / 1000;
          const rad = age * 420;
          const dx = dots[n] - r.x, dy = dots[n + 1] - r.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = Math.exp(-Math.pow((d - rad) / 34, 2)) * (1 - age / 2.6);
          if (band > 0.01) { x += (dx / d) * band * 10; y += (dy / d) * band * 10; rf = Math.max(rf, band); }
        }
        const hot = Math.max(f, rf);
        const r = 0.7 + (v + 1.6) * 0.42 + hot * 2.2;
        ctx.globalAlpha = clamp(0.1 + (v + 1.6) * 0.06 + hot * 0.7, 0, 1);
        ctx.fillStyle = hot > 0.28 ? SIGNAL : '#0E0E10';
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    Surface(canvas, draw, { onResize: build, still: 1.4 });
  }

  /* =========================================================
     P-01 IWI — hand landmark graph cycling through gestures,
     with per-finger bend signals on the side
     ========================================================= */
  const HAND = {
    // base offsets from wrist, base angle (0 = straight up), segment lengths
    fingers: [
      { base: [-62, -52], ang: -0.95, seg: [44, 36, 30] },   // thumb
      { base: [-44, -150], ang: -0.14, seg: [56, 36, 28] },  // index
      { base: [-12, -160], ang: -0.02, seg: [62, 40, 30] },  // middle
      { base: [20, -152], ang: 0.1, seg: [56, 36, 28] },     // ring
      { base: [48, -134], ang: 0.24, seg: [42, 28, 24] },    // pinky
    ],
    poses: [
      [0, 0, 0, 0, 0],
      [1.1, 1.7, 1.7, 1.7, 1.7],
      [1.1, 0, 1.7, 1.7, 1.7],
      [1.1, 0, 0, 1.7, 1.7],
      [0, 0, 0, 1.7, 1.7],
      [0, 1.7, 1.7, 1.7, 0],
    ],
  };
  function drawHand(ctx, w, h, t) {
    const hold = 1.9;
    const k = Math.floor(t / hold), local = (t % hold) / hold;
    const A = HAND.poses[k % HAND.poses.length], B = HAND.poses[(k + 1) % HAND.poses.length];
    const mix = smooth(clamp((local - 0.55) / 0.45, 0, 1));
    const curls = A.map((a, i) => lerp(a, B[i], mix));

    const s = Math.min(w / 540, h / 350);
    const wx = w * 0.4, wy = h * 0.5 + 105 * s;
    const P = (x, y) => [wx + x * s, wy + y * s];

    const tips = [], bases = [];
    const lines = [];
    HAND.fingers.forEach((f, i) => {
      let [x, y] = P(f.base[0], f.base[1]);
      bases.push([x, y]);
      const pts = [[x, y]];
      let bend = 0;
      const weights = [0.8, 1.0, 0.75];
      const lateral = i === 0 ? 0.35 : 0.08;
      f.seg.forEach((len, j) => {
        bend += curls[i] * weights[j];
        const L = len * s * Math.cos(bend);              // foreshortening as the finger folds toward the palm
        const a = f.ang + (i === 0 ? curls[i] * 0.55 : 0) + Math.sin(bend) * lateral * (i < 2 ? 1 : -1);
        x += Math.sin(a) * L; y -= Math.cos(a) * L;
        pts.push([x, y]);
      });
      lines.push(pts);
      tips.push(pts[pts.length - 1]);
    });

    const wrist = P(0, 0);
    // palm web
    ctx.strokeStyle = BONE(0.18); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wrist[0], wrist[1]);
    bases.forEach((b) => ctx.lineTo(b[0], b[1]));
    ctx.closePath(); ctx.stroke();
    bases.forEach((b) => { ctx.beginPath(); ctx.moveTo(wrist[0], wrist[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });

    // bones
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    lines.forEach((pts) => {
      ctx.strokeStyle = BONE(0.75);
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      pts.forEach((p, i) => {
        ctx.fillStyle = i === pts.length - 1 ? LITE(1) : '#1A1A1D';
        ctx.strokeStyle = i === pts.length - 1 ? LITE(1) : BONE(0.8);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p[0], p[1], i === pts.length - 1 ? 4.5 : 3.2, 0, TAU); ctx.fill(); ctx.stroke();
      });
    });
    ctx.fillStyle = BONE(0.9); ctx.beginPath(); ctx.arc(wrist[0], wrist[1], 4, 0, TAU); ctx.fill();

    // fingertip glow
    tips.forEach((p) => {
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 22 * s + 6);
      g.addColorStop(0, LITE(0.35)); g.addColorStop(1, LITE(0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], 22 * s + 6, 0, TAU); ctx.fill();
    });

    // per-finger bend signals
    const bw = Math.min(26, (w * 0.2) / 7.8), gap = bw * 0.7, bh = h * 0.46, by = h * 0.3;
    const bx = w * 0.94 - 5 * bw - 4 * gap;
    curls.forEach((c, i) => {
      const x = bx + i * (bw + gap);
      ctx.strokeStyle = BONE(0.16); ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, by + 0.5, bw, bh);
      const v = c / 1.7;
      const hh = bh * (0.06 + 0.94 * v);
      ctx.fillStyle = v > 0.5 ? LITE(0.85) : BONE(0.55);
      ctx.fillRect(x + 3, by + bh - hh + 3, bw - 6, Math.max(0, hh - 6));
    });
    ctx.strokeStyle = LITE(0.25); ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
    tips.forEach((p, i) => {
      const x = bx + i * (bw + gap) + bw / 2;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]);
      ctx.bezierCurveTo(p[0] + 60, p[1], x, by - 30, x, by);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  /* =========================================================
     P-02 Thozhan — radial voice waveform around a locked, offline core
     ========================================================= */
  function drawVoice(ctx, w, h, t) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.2;
    const N = 128;
    // speech arrives in bursts
    const burst = Math.pow(Math.max(0, Math.sin(t * 1.25)), 1.4) * 0.8 + Math.pow(Math.max(0, Math.sin(t * 2.9 + 1)), 3) * 0.35;

    // rotating verification rings
    const rings = [[R * 1.95, 0.25, [2, 7]], [R * 2.2, -0.15, [18, 10]], [R * 0.72, 0.6, [4, 6]]];
    rings.forEach(([r, sp, dash]) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * sp);
      ctx.setLineDash(dash); ctx.strokeStyle = BONE(0.18); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); ctx.restore();
    });
    ctx.setLineDash([]);

    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU - Math.PI / 2;
      const n = 0.5 * Math.sin(i * 0.37 + t * 7) + 0.3 * Math.sin(i * 0.91 - t * 4.6) + 0.2 * Math.sin(i * 0.13 + t * 2.3);
      const len = 3 + burst * R * 0.62 * (0.55 + 0.45 * n);
      const x1 = cx + Math.cos(a) * R, y1 = cy + Math.sin(a) * R;
      const x2 = cx + Math.cos(a) * (R + len), y2 = cy + Math.sin(a) * (R + len);
      ctx.strokeStyle = len > R * 0.35 ? LITE(0.95) : BONE(0.55);
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // core
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
    g.addColorStop(0, `rgba(43,43,245,${0.35 + burst * 0.3})`); g.addColorStop(1, 'rgba(43,43,245,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, TAU); ctx.fill();

    // padlock glyph — private, on-device
    const u = R * 0.2;
    ctx.strokeStyle = BONE(0.9); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy - u * 0.35, u * 0.62, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - u * 0.62, cy - u * 0.35); ctx.lineTo(cx - u * 0.62, cy - u * 0.1);
    ctx.moveTo(cx + u * 0.62, cy - u * 0.35); ctx.lineTo(cx + u * 0.62, cy - u * 0.1); ctx.stroke();
    ctx.fillStyle = BONE(0.9);
    ctx.fillRect(cx - u, cy - u * 0.1, u * 2, u * 1.4);
    ctx.fillStyle = '#1A1A1D'; ctx.beginPath(); ctx.arc(cx, cy + u * 0.5, u * 0.22, 0, TAU); ctx.fill();
  }

  /* =========================================================
     P-03 Prescription parser — a scan line turns handwriting
     into structured record fields
     ========================================================= */
  const parserLines = (() => {
    const r = rng(7), out = [];
    for (let i = 0; i < 8; i++) {
      const len = 0.45 + r() * 0.5, pts = [];
      for (let k = 0; k <= 40; k++) pts.push([k / 40 * len, (r() - 0.5) * 0.5 + Math.sin(k * 1.3 + i) * 0.35]);
      out.push({ pts, field: 0.35 + r() * 0.6 });
    }
    return out;
  })();
  function drawParser(ctx, w, h, t) {
    const period = 5.2, p = (t % period) / period;
    const scan = clamp(p / 0.78, 0, 1);
    const fade = p > 0.9 ? 1 - (p - 0.9) / 0.1 : 1;

    const dx = w * 0.08, dy = h * 0.16, dw = w * 0.36, dh = h * 0.7;
    const rx = w * 0.56, rw = w * 0.36;

    // document
    ctx.fillStyle = BONE(0.06); ctx.strokeStyle = BONE(0.22); ctx.lineWidth = 1;
    ctx.fillRect(dx, dy, dw, dh); ctx.strokeRect(dx + 0.5, dy + 0.5, dw, dh);
    ctx.fillStyle = BONE(0.5); ctx.font = `500 ${Math.max(10, w * 0.022)}px "Instrument Serif", serif`;
    ctx.fillText('Rx', dx + 14, dy + 26);

    const rowH = (dh - 48) / parserLines.length;
    const sy = dy + 36 + scan * (dh - 44);

    parserLines.forEach((ln, i) => {
      const y = dy + 48 + i * rowH;
      const read = clamp((sy - y) / 18, 0, 1) * fade;
      // handwriting
      ctx.strokeStyle = read > 0 ? LITE(0.35 + read * 0.5) : BONE(0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ln.pts.forEach(([u, v], k) => {
        const x = dx + 14 + u * (dw - 28), yy = y + v * rowH * 0.45;
        k ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      });
      ctx.stroke();

      // structured field
      const ry = dy + 12 + i * (dh / parserLines.length);
      const fh = Math.min(18, dh / parserLines.length - 10);
      ctx.fillStyle = BONE(0.12); ctx.fillRect(rx, ry, rw * 0.22, fh);
      ctx.strokeStyle = BONE(0.16); ctx.strokeRect(rx + rw * 0.26 + 0.5, ry + 0.5, rw * 0.74, fh);
      if (read > 0) {
        ctx.fillStyle = LITE(0.75 * read);
        ctx.fillRect(rx + rw * 0.26 + 3, ry + 3, (rw * 0.74 - 6) * ln.field * smooth(read), fh - 6);
      }
      // link when a line is being read
      const flash = read > 0 && read < 1 ? 1 - Math.abs(read - 0.5) * 2 : 0;
      if (flash > 0.02) {
        ctx.strokeStyle = LITE(flash * 0.8); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(dx + dw, y);
        ctx.bezierCurveTo(dx + dw + (rx - dx - dw) * 0.5, y, dx + dw + (rx - dx - dw) * 0.5, ry + fh / 2, rx, ry + fh / 2);
        ctx.stroke();
      }
    });

    // scan beam
    if (scan < 1) {
      const g = ctx.createLinearGradient(0, sy - 40, 0, sy);
      g.addColorStop(0, LITE(0)); g.addColorStop(1, LITE(0.28));
      ctx.fillStyle = g; ctx.fillRect(dx, Math.max(dy, sy - 40), dw, Math.min(40, sy - dy));
      ctx.strokeStyle = LITE(1); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(dx - 8, sy); ctx.lineTo(dx + dw + 8, sy); ctx.stroke();
    }
  }

  /* =========================================================
     P-04 Medical assistant — sweep monitor with three channels
     ========================================================= */
  function ecg(p) {
    const g = (c, wd, a) => a * Math.exp(-Math.pow((p - c) / wd, 2));
    return g(0.16, 0.035, 0.12) + g(0.33, 0.012, -0.12) + g(0.36, 0.014, 1) + g(0.39, 0.014, -0.28) + g(0.62, 0.06, 0.28);
  }
  function drawMonitor(ctx, w, h, t) {
    const left = w * 0.06, right = w * 0.74, W = right - left;
    const speed = W / 3.2;
    const sweep = (t * speed) % W;
    const chans = [
      { y: h * 0.36, amp: h * 0.15, fn: (tt) => ecg((tt / 0.95) % 1), color: LITE(1), lw: 1.8 },
      { y: h * 0.62, amp: h * 0.06, fn: (tt) => Math.sin(tt * 1.6) * 0.8 + Math.sin(tt * 0.4) * 0.2, color: BONE(0.7), lw: 1.3 },
      { y: h * 0.82, amp: h * 0.05, fn: (tt) => Math.round(Math.sin(tt * 0.9) * 2 + Math.sin(tt * 3.1)) / 3, color: BONE(0.45), lw: 1.3 },
    ];
    // grid
    ctx.strokeStyle = BONE(0.05); ctx.lineWidth = 1;
    for (let x = left; x <= right; x += 22) { ctx.beginPath(); ctx.moveTo(x, h * 0.2); ctx.lineTo(x, h * 0.92); ctx.stroke(); }
    for (let y = h * 0.2; y <= h * 0.92; y += 22) { ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); }

    chans.forEach((c) => {
      ctx.strokeStyle = c.color; ctx.lineWidth = c.lw; ctx.lineJoin = 'round';
      ctx.beginPath();
      let pen = false;
      for (let x = 0; x <= W; x += 1.5) {
        const ahead = x > sweep ? x - sweep : x - sweep + W;
        if (ahead > 0 && ahead < 26) { pen = false; continue; }
        const tt = x <= sweep ? t - (sweep - x) / speed : t - (sweep + W - x) / speed;
        const y = c.y - c.fn(tt) * c.amp;
        pen ? ctx.lineTo(left + x, y) : ctx.moveTo(left + x, y);
        pen = true;
      }
      ctx.stroke();
      // sweep head
      const tt = t, y = c.y - c.fn(tt) * c.amp;
      ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(left + sweep, y, 2.6, 0, TAU); ctx.fill();
    });

    // agent column — observe → reason → act loop
    const ax = w * 0.85, steps = 3, span = h * 0.5, top = h * 0.3;
    const active = Math.floor(t * 0.9) % steps;
    ctx.strokeStyle = BONE(0.2); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, top); ctx.lineTo(ax, top + span); ctx.stroke();
    for (let i = 0; i < steps; i++) {
      const y = top + (span / (steps - 1)) * i;
      const on = i === active;
      if (on) {
        const pr = (t * 0.9) % 1;
        ctx.strokeStyle = LITE(1 - pr); ctx.beginPath(); ctx.arc(ax, y, 8 + pr * 18, 0, TAU); ctx.stroke();
      }
      ctx.fillStyle = on ? LITE(1) : '#1A1A1D'; ctx.strokeStyle = on ? LITE(1) : BONE(0.5); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ax, y, 7, 0, TAU); ctx.fill(); ctx.stroke();
    }
    // loop-back arc
    ctx.strokeStyle = LITE(0.35); ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.ellipse(ax, top + span / 2, Math.min(w * 0.08, span / 2), span / 2, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  /* =========================================================
     P-05 Agentic analyzer — pipeline graph with packets, a
     congested stage, and a waterfall of stage spans
     ========================================================= */
  const PIPE = {
    nodes: [
      { id: 'input', x: 0.08, y: 0.4 }, { id: 'prompt', x: 0.3, y: 0.22 }, { id: 'retrieve', x: 0.3, y: 0.58 },
      { id: 'model', x: 0.55, y: 0.4 }, { id: 'tools', x: 0.76, y: 0.22 }, { id: 'output', x: 0.92, y: 0.4 },
    ],
    edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5], [3, 5]],
  };
  function drawPipeline(ctx, w, h, t) {
    const N = PIPE.nodes.map((n) => [n.x * w, n.y * h]);
    const hot = 3;
    const fs = Math.max(9, Math.min(12, w * 0.016));
    ctx.font = `500 ${fs}px "Geist Mono", monospace`;

    PIPE.edges.forEach(([a, b], i) => {
      const [x1, y1] = N[a], [x2, y2] = N[b];
      const mx = (x1 + x2) / 2;
      ctx.strokeStyle = BONE(0.2); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2); ctx.stroke();
      // packets — slower when heading into the congested stage
      const slow = b === hot ? 0.35 : 0.7;
      for (let k = 0; k < 3; k++) {
        const u = ((t * slow + k / 3 + i * 0.13) % 1);
        const q = 1 - u;
        const x = q * q * q * x1 + 3 * q * q * u * mx + 3 * q * u * u * mx + u * u * u * x2;
        const y = q * q * q * y1 + 3 * q * q * u * y1 + 3 * q * u * u * y2 + u * u * u * y2;
        ctx.fillStyle = b === hot ? LITE(0.95) : BONE(0.8);
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill();
      }
    });

    N.forEach(([x, y], i) => {
      const isHot = i === hot;
      if (isHot) {
        const pr = (t * 0.8) % 1;
        ctx.strokeStyle = LITE(0.8 * (1 - pr)); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 14 + pr * 30, 0, TAU); ctx.stroke();
      }
      ctx.fillStyle = isHot ? SIGNAL : '#1A1A1D';
      ctx.strokeStyle = isHot ? LITE(1) : BONE(0.6); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, isHot ? 11 : 8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = isHot ? LITE(1) : BONE(0.55);
      ctx.textAlign = 'center';
      ctx.fillText(PIPE.nodes[i].id, x, y + (i === 1 || i === 4 ? -20 : 28));
    });
    ctx.textAlign = 'left';

    // waterfall of stage spans (relative only)
    const wx = w * 0.08, ww = w * 0.84, wy = h * 0.76, rh = Math.max(5, h * 0.025), gap = rh * 0.7;
    const spans = [[0, 0.06], [0.06, 0.2], [0.06, 0.3], [0.3, 0.78], [0.78, 0.9], [0.9, 1]];
    ctx.strokeStyle = BONE(0.12); ctx.beginPath(); ctx.moveTo(wx, wy - 8); ctx.lineTo(wx + ww, wy - 8); ctx.stroke();
    spans.forEach(([s0, s1], i) => {
      const wob = i === hot ? Math.sin(t * 1.3) * 0.04 : 0;
      const x = wx + s0 * ww, len = (s1 - s0 + wob) * ww;
      ctx.fillStyle = i === hot ? LITE(0.9) : BONE(0.25);
      ctx.fillRect(x, wy + i * (rh + gap) * 0.55, len, rh * 0.55);
    });
    // playhead
    const ph = wx + ((t * 0.25) % 1) * ww;
    ctx.strokeStyle = BONE(0.5); ctx.beginPath(); ctx.moveTo(ph, wy - 12); ctx.lineTo(ph, wy + spans.length * (rh + gap) * 0.55); ctx.stroke();
  }

  /* =========================================================
     P-06 Social radar — rotating sweep lighting up signals
     ========================================================= */
  const blips = (() => {
    const r = rng(42), out = [];
    for (let i = 0; i < 34; i++) out.push({ a: r() * TAU, d: 0.15 + r() * 0.8, s: 1 + r() * 2, hot: r() > 0.8 });
    return out;
  })();
  function drawRadar(ctx, w, h, t) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
    const sweep = (t * 1.1) % TAU;

    ctx.strokeStyle = BONE(0.14); ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, (R * i) / 4, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.strokeStyle = BONE(i % 3 === 0 ? 0.14 : 0.05);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    }

    // sweep trail
    const slices = 36, trail = 1.1;
    for (let i = 0; i < slices; i++) {
      const a0 = sweep - (trail * (i + 1)) / slices, a1 = sweep - (trail * i) / slices;
      ctx.fillStyle = `rgba(43,43,245,${0.42 * (1 - i / slices)})`;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1 + 0.01); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = LITE(1); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R); ctx.stroke();

    // blips light up after the sweep passes, then decay
    const lit = [];
    blips.forEach((b) => {
      let d = sweep - b.a; d = ((d % TAU) + TAU) % TAU;
      const glow = Math.exp(-d * 1.1);
      const x = cx + Math.cos(b.a) * b.d * R, y = cy + Math.sin(b.a) * b.d * R;
      if (b.hot) lit.push([x, y, glow]);
      ctx.fillStyle = b.hot ? LITE(0.25 + glow * 0.75) : BONE(0.12 + glow * 0.7);
      ctx.beginPath(); ctx.arc(x, y, b.s + glow * (b.hot ? 3 : 1.5), 0, TAU); ctx.fill();
      if (b.hot && glow > 0.2) {
        ctx.strokeStyle = LITE(glow * 0.6); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, 6 + (1 - glow) * 16, 0, TAU); ctx.stroke();
      }
    });
    // emerging cluster links
    ctx.strokeStyle = LITE(0.18); ctx.lineWidth = 1;
    for (let i = 0; i < lit.length; i++) for (let j = i + 1; j < lit.length; j++) {
      const [x1, y1, g1] = lit[i], [x2, y2, g2] = lit[j];
      if (Math.hypot(x1 - x2, y1 - y2) < R * 0.7) {
        ctx.globalAlpha = Math.max(g1, g2) * 0.9 + 0.1;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = LITE(1); ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TAU); ctx.fill();
  }

  const PROJECT_VIS = { hand: drawHand, voice: drawVoice, parser: drawParser, monitor: drawMonitor, pipeline: drawPipeline, radar: drawRadar };

  function initProjects() {
    document.querySelectorAll('canvas[data-vis]').forEach((c) => {
      const fn = PROJECT_VIS[c.dataset.vis];
      if (fn) Surface(c, fn, { still: 3.1 });
    });
  }

  function start() {
    if (!REDUCED) requestAnimationFrame(loop);
  }

  window.Visuals = { initField, initProjects, start };
})();
