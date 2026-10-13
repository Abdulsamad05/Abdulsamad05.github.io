// ===== Departures — extra effects =====
// Loaded after script.js (shares PROJECTS, STATUS_LABELS, scramble, $, $$, esc, wait, isCalm, setMotion, GLYPHS, state, rollInRows, showPass).
// Each effect is self-contained; delete a block to remove that effect.

const EMAIL = window.PORTFOLIO.contact.email; // used by the "Copy email" button
// Ticker lines either side of the flights. The first comes from content.js.
const EXTRA_ANNOUNCEMENTS = [
  `Next stop: ${window.PORTFOLIO.identity.seeking.replace(/\.$/, '')}`,
  'Please keep your portfolio with you at all times'
];
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* =========================================================
   1. SOUND — soft flap clatter + "final call" chime (off by default)
   Synthesised with Web Audio, so there are no audio files to load.
   ========================================================= */
const Sound = (() => {
  let on = false, ctx = null, noise = null, lastClack = 0;
  try { on = localStorage.getItem('aa-sound') === 'on'; } catch (e) { /* storage blocked */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const len = Math.floor(ctx.sampleRate * 0.03);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function clack() {
    if (!on) return;
    const now = performance.now();
    if (now - lastClack < 38) return; // never more than ~26 clicks a second
    lastClack = now;
    const c = ensure(); if (!c) return;
    const src = c.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.5;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 1200; f.Q.value = 1.2;
    const g = c.createGain(); g.gain.value = 0.05;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  }
  function chime() {
    if (!on) return;
    const c = ensure(); if (!c) return;
    // classic three-note terminal "ding-dong-dong"
    [[659.25, 0], [523.25, 0.3], [392.0, 0.6]].forEach(([freq, t]) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
      const g = c.createGain(); const s = c.currentTime + t;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.07, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 1.2);
      o.connect(g).connect(c.destination); o.start(s); o.stop(s + 1.3);
    });
  }
  function set(v) {
    on = v;
    try { localStorage.setItem('aa-sound', v ? 'on' : 'off'); } catch (e) { /* ignore */ }
    if (v) ensure();
  }
  return { clack, chime, set, get on() { return on; } };
})();

window.onFlapTick = Sound.clack;
window.onFinalCall = Sound.chime;

(function soundToggle() {
  const btn = $('#soundToggle');
  const sync = () => {
    btn.setAttribute('aria-pressed', String(Sound.on));
    btn.querySelector('.sound-label').textContent = Sound.on ? 'Sound on' : 'Sound off';
  };
  btn.addEventListener('click', () => {
    Sound.set(!Sound.on);
    sync();
    if (Sound.on) Sound.chime();
  });
  sync();
})();

/* =========================================================
   2. GATE-CHANGE TICKER — scrolling announcements, pauses on hover/focus
   ========================================================= */
(function ticker() {
  const msgs = [EXTRA_ANNOUNCEMENTS[0]];
  PROJECTS.forEach((p) => {
    if (p.status === 'progress') msgs.push(`Now boarding: ${p.name} · Gate ${p.gate}`);
    else if (p.status === 'shipped') msgs.push(`${p.name} has departed`);
    else msgs.push(`${p.name} is on hold`);
  });
  msgs.push(...EXTRA_ANNOUNCEMENTS.slice(1));

  const item = (m) => `<li><span class="ticker-dot" aria-hidden="true"></span>${esc(m)}</li>`;
  const list = msgs.map(item).join('');
  // Content twice so the loop is seamless; the copy is hidden from screen readers.
  $('#ticker').innerHTML = `<ul>${list}</ul><ul aria-hidden="true">${list}</ul>`;
  const chars = msgs.join('').length;
  $('#ticker').style.setProperty('--ticker-duration', `${Math.max(30, chars * 0.32)}s`);

  const bar = $('#tickerBar');
  const btn = $('#tickerPause');
  btn.addEventListener('click', () => {
    const paused = bar.classList.toggle('paused');
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? 'Play announcements' : 'Pause announcements');
  });
})();

/* =========================================================
   3. FLIP-CLOCK — each digit is a split-flap tile; the top leaf falls
   when the minute changes. 24-hour time.
   ========================================================= */
(function flipClockSetup() {
  const el = $('#clock');
  let shown = '';
  const timeNow = () => {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  const halves = (ch) => `<span class="cd-half top"><span>${ch}</span></span><span class="cd-half bot"><span>${ch}</span></span>`;

  function build(s) {
    el.innerHTML = `<span class="sr-only" id="clockText">${s}</span>` + [...s].map((ch) =>
      ch === ':' ? '<span class="cd-sep" aria-hidden="true">:</span>'
                 : `<span class="cd" aria-hidden="true" data-d="${ch}">${halves(ch)}</span>`).join('');
  }

  function flipTile(tile, from, to) {
    tile.dataset.d = to;
    const top = tile.querySelector('.cd-half.top span');
    const bot = tile.querySelector('.cd-half.bot span');
    if (isCalm()) { top.textContent = to; bot.textContent = to; return; }
    top.textContent = to; // new digit waits behind the falling leaf
    bot.textContent = from;
    const leaf = document.createElement('span');
    leaf.className = 'cd-leaf';
    leaf.innerHTML = `<span class="cd-half top front"><span>${from}</span></span><span class="cd-half bot back"><span>${to}</span></span>`;
    tile.appendChild(leaf);
    Sound.clack();
    leaf.addEventListener('animationend', () => { bot.textContent = to; leaf.remove(); Sound.clack(); }, { once: true });
  }

  window.flipClock = function () {
    const s = timeNow();
    if (!el.querySelector('.cd')) { build(s); shown = s; return; }
    if (s === shown) return;
    const tiles = $$('#clock .cd');
    const digits = s.replace(':', '');
    const old = shown.replace(':', '');
    tiles.forEach((t, i) => { if (digits[i] !== old[i]) setTimeout(() => flipTile(t, old[i], digits[i]), i * 90); });
    $('#clockText').textContent = s;
    shown = s;
  };
  window.flipClock(); // script.js calls it again on each minute
})();

/* =========================================================
   4. TILES THAT REACT TO THE MOUSE — sweep across DEPARTURES
   ========================================================= */
(function hoverTiles() {
  if (!finePointer) return;
  $('.tiles').addEventListener('pointerover', (e) => {
    if (isCalm()) return;
    const t = e.target.closest('.tile');
    if (!t || t.classList.contains('flipping')) return;
    const letter = t.dataset.letter || (t.dataset.letter = t.textContent);
    t.style.animationDelay = '0s';
    t.classList.add('flipping');
    let n = 0;
    const iv = setInterval(() => {
      t.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      Sound.clack();
      if (++n > 3) { clearInterval(iv); t.textContent = letter; }
    }, 60);
    setTimeout(() => t.classList.remove('flipping'), 420);
  });
})();

/* =========================================================
   5. GHOST BOARDING PASS — preview follows the cursor over a flight
   ========================================================= */
(function ghostPreview() {
  if (!finePointer) return;
  const ghost = $('#ghost');
  let currentId = null;
  const fill = (p) => {
    ghost.innerHTML = `
      <div class="ghost-top"><span>Flight ${esc(p.code)}</span><span>${esc(p.year)}</span></div>
      <div class="ghost-name">${esc(p.name)}</div>
      <div class="ghost-bottom"><span>${esc(STATUS_LABELS[p.status])}</span><span>Click to print →</span></div>`;
  };
  $('#rows').addEventListener('pointermove', (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    if (row.dataset.id !== currentId) {
      currentId = row.dataset.id;
      const p = PROJECTS.find((x) => x.id === currentId);
      if (p) fill(p);
    }
    const w = 260, h = 130;
    const x = Math.min(e.clientX + 24, window.innerWidth - w - 12);
    const y = Math.min(e.clientY + 20, window.innerHeight - h - 12);
    ghost.style.transform = `translate(${x}px, ${y}px) rotate(-3deg)`;
    ghost.classList.add('show');
  });
  $('#rows').addEventListener('pointerleave', () => { ghost.classList.remove('show'); currentId = null; });
  $('#rows').addEventListener('click', () => ghost.classList.remove('show'));
})();

/* =========================================================
   6. PASSPORT STAMP — "Copy email" thumps an ink stamp onto the button
   ========================================================= */
(function copyStamp() {
  const btn = $('#copyEmail');
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove(); return ok;
    }
  }
  btn.addEventListener('click', async () => {
    const ok = await copy(EMAIL);
    SITE.announce(ok ? `Email address copied: ${EMAIL}` : `Could not copy. The address is ${EMAIL}`);
    btn.classList.remove('stamped'); void btn.offsetWidth; btn.classList.add('stamped');
    if (isCalm()) setTimeout(() => btn.classList.remove('stamped'), 1600);
    Sound.clack();
  });
  btn.addEventListener('animationend', (e) => { if (e.animationName === 'stamp') btn.classList.remove('stamped'); });
})();

/* =========================================================
   7. LANDING — contact block rises like a runway, headline types out
   ========================================================= */
(function landing() {
  const section = $('#contact');
  const title = $('#landTitle');
  const text = title.textContent;
  if (isCalm() || !('IntersectionObserver' in window)) return;

  // Split into words → letters so lines never break mid-word while typing.
  title.innerHTML = `<span class="sr-only">${esc(text)}</span><span aria-hidden="true" class="typed">` +
    text.split(' ').map((w) => `<span class="w">${[...w].map((c) => `<span class="ch">${esc(c)}</span>`).join('')}</span>`).join(' ') +
    `<span class="caret"></span></span>`;
  section.classList.add('pre');

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    section.classList.remove('pre');
    const chars = $$('#landTitle .ch');
    const caret = $('#landTitle .caret');
    if (isCalm()) { chars.forEach((c) => c.classList.add('on')); caret.classList.add('done'); return; }
    section.classList.add('landing');
    chars.forEach((c, i) => setTimeout(() => {
      c.classList.add('on');
      c.after(caret);
      if (i % 2 === 0) Sound.clack();
      if (i === chars.length - 1) setTimeout(() => caret.classList.add('done'), 1600);
    }, 600 + i * 45));
  }, { threshold: 0.2 });
  io.observe(section);
})();

/* =========================================================
   8. PLANE ON A DOTTED ROUTE — follows scroll down the right edge,
   then turns and taxis in to "Lost & found".
   Desktop only (needs a side gutter); hidden on phones and with reduced motion.
   ========================================================= */
(function flightPath() {
  const wrap = $('#flight');
  const svg = $('#flightSvg');
  const route = $('#route'), flown = $('#routeFlown'), maskPath = $('#flownMaskPath'), plane = $('#plane');
  let samples = [], total = 0, turnLen = 0, turnY = 0, enabled = false;

  const docTop = (el) => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
  const docLeft = (el) => { let x = 0; while (el) { x += el.offsetLeft; el = el.offsetParent; } return x; };

  function build() {
    const vw = document.documentElement.clientWidth;
    enabled = !isCalm() && vw >= 1100;
    wrap.hidden = !enabled;
    if (!enabled) return;

    wrap.style.height = '0'; // so the layer's own height isn't counted when the page gets shorter
    const docH = document.body.scrollHeight;
    wrap.style.height = `${docH}px`;
    svg.setAttribute('width', vw); svg.setAttribute('height', docH);
    svg.setAttribute('viewBox', `0 0 ${vw} ${docH}`);

    const gutter = Math.max(0, (vw - 1280) / 2);
    const x = vw - Math.max(30, gutter / 2);
    const amp = Math.min(22, Math.max(8, gutter / 2 - 22));
    const startY = docTop($('#top')) + 40;
    const contactTop = docTop($('#contact'));
    const label = $('#lostFound');
    const landY = docTop(label) + label.offsetHeight / 2;
    const landX = docLeft(label) + label.offsetWidth + 48;
    const sideEnd = contactTop - 120;

    // gentle S-curves down the side
    let d = `M ${x} ${startY}`;
    let y = startY, dir = 1;
    const step = 520;
    while (y + step < sideEnd) {
      const ny = y + step;
      d += ` C ${x + amp * dir} ${y + step * 0.33}, ${x + amp * dir} ${y + step * 0.66}, ${x} ${ny}`;
      y = ny; dir = -dir;
    }
    d += ` L ${x} ${sideEnd}`;
    // the turn, then the approach along the runway to the label
    d += ` C ${x} ${landY}, ${x - 40} ${landY}, ${x - 160} ${landY}`;
    d += ` L ${landX} ${landY}`;

    [route, flown, maskPath].forEach((p) => p.setAttribute('d', d));
    total = route.getTotalLength();

    // sample once so scroll handling is cheap
    samples = [];
    const N = 600;
    for (let i = 0; i <= N; i++) {
      const len = (total * i) / N;
      const pt = route.getPointAtLength(len);
      samples.push({ len, x: pt.x, y: pt.y });
    }
    turnY = sideEnd;
    turnLen = samples.find((s) => s.y >= sideEnd)?.len ?? total * 0.8;
    update();
  }

  function lengthForScroll() {
    const vh = window.innerHeight;
    const target = window.scrollY + vh * 0.55;   // the plane flies level with the middle of the screen
    if (target < turnY) {
      // binary search the descending part of the route by y
      let lo = 0, hi = samples.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (samples[mid].y < target) lo = mid + 1; else hi = mid; }
      return Math.min(samples[lo].len, turnLen);
    }
    const maxTarget = document.documentElement.scrollHeight - vh + vh * 0.55;
    const k = Math.min(1, (target - turnY) / Math.max(1, maxTarget - turnY));
    return turnLen + k * (total - turnLen);
  }

  function update() {
    if (!enabled) return;
    const len = Math.max(0.01, lengthForScroll());
    const a = route.getPointAtLength(Math.max(0, len - 1));
    const b = route.getPointAtLength(Math.min(total, len + 1));
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const p = route.getPointAtLength(len);
    plane.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang})`);
    maskPath.setAttribute('stroke-dasharray', `${len} ${total}`);
    plane.classList.toggle('landed', len >= total - 2);
  }

  let raf = 0;
  window.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  let rt = 0;
  const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 120); };
  window.addEventListener('resize', rebuild);
  window.addEventListener('aa:motion', build);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.querySelector('main'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  build();
})();

/* =========================================================
   9. MOTION SWITCH — footer "Full / Calm" control.
   Calm turns every animation off and shows everything straight away.
   The choice is remembered; without a choice the device setting decides.
   ========================================================= */
function settleForCalm() {
  if (!state.boardSeen) { state.boardSeen = true; rollInRows(); }
  if (!state.passSeen) showPass();
  const contact = $('#contact');
  if (contact.classList.contains('pre')) {
    contact.classList.remove('pre');
    $$('#landTitle .ch').forEach((c) => c.classList.add('on'));
    const caret = $('#landTitle .caret'); if (caret) caret.classList.add('done');
  }
}
(function motionSwitch() {
  const btns = $$('.motion-switch button');
  const sync = () => {
    const calm = isCalm();
    btns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.motion === 'calm') === calm)));
    document.documentElement.classList.toggle('calm', calm);
  };
  btns.forEach((b) => b.addEventListener('click', () => {
    setMotion(b.dataset.motion);
    sync();
    if (isCalm()) { settleForCalm(); stopIntro(); }
    window.dispatchEvent(new Event('aa:motion'));
  }));
  sync();
  if (isCalm()) settleForCalm();
})();

/* =========================================================
   10. POWER-ON INTRO — the board flickers on and spells the name.
   Plays on the first visit only (~1.8s), never in Calm mode.
   Skip with the button or a click; replay from the footer, or add ?intro to the URL.
   ========================================================= */
const INTRO_NAME = 'ABDULSAMAD ALIYU';
let introRun = 0;
function stopIntro() {
  const root = document.documentElement;
  if (!root.classList.contains('intro-on')) return;
  introRun++;
  try { localStorage.setItem('aa-intro-seen', '1'); } catch (e) { /* ignore */ }
  const intro = $('#intro');
  intro.classList.add('off');
  setTimeout(() => {
    root.classList.remove('intro-on');
    intro.classList.remove('power', 'off');
    window.dispatchEvent(new Event('resize')); // let the plane route re-measure
  }, isCalm() ? 0 : 600);
}
async function runIntro() {
  const root = document.documentElement;
  const run = ++introRun;
  const alive = () => run === introRun;
  const intro = $('#intro');
  const tilesEl = $('#introTiles');
  const status = $('#introStatus');
  tilesEl.innerHTML = INTRO_NAME.split(' ').map((w) =>
    `<span class="intro-word">${[...w].map((c) => `<span class="itile" data-c="${c}"></span>`).join('')}</span>`).join('');
  status.textContent = 'Systems starting';
  intro.classList.remove('power', 'off');
  root.classList.add('intro-on');

  await wait(120); if (!alive()) return;
  intro.classList.add('power');           // flicker + scan line
  Sound.clack();
  await wait(380); if (!alive()) return;

  // tiles switch on in a random order, each flipping through glyphs to its letter
  const tiles = $$('#introTiles .itile');
  const order = tiles.map((_, i) => i).sort(() => Math.random() - 0.5);
  order.forEach((idx, k) => setTimeout(() => {
    if (!alive()) return;
    const t = tiles[idx];
    t.classList.add('lit');
    let n = 0;
    const iv = setInterval(() => {
      if (!alive()) { clearInterval(iv); return; }
      t.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      Sound.clack();
      if (++n > 4) { clearInterval(iv); t.textContent = t.dataset.c; }
    }, 55);
  }, k * 38));
  await wait(order.length * 38 + 320); if (!alive()) return;
  scramble(status, 'Now boarding · Terminal A', { duration: 420, stagger: 18 });
  await wait(620); if (!alive()) return;
  stopIntro();
}
(function introSetup() {
  $('#introSkip').addEventListener('click', stopIntro);
  $('#intro').addEventListener('click', stopIntro);
  $('#replayIntro').addEventListener('click', () => { window.scrollTo(0, 0); runIntro(); });
  if (document.documentElement.classList.contains('intro-on')) runIntro();
})();
