// ===== Option A — Departures =====
// Projects come from ../shared/content.js. This maps each one onto a flight.
// status: 'shipped' | 'progress' | 'concept'. Gate and flight code are decorative.
const toFlight = (p, i) => ({
  id: p.slug, code: `AA10${i + 1}`, year: p.year, name: p.name, via: p.stack.join(', '), gate: `A${i + 1}`, status: p.status,
  summary: p.summary, highlight: p.stat, problem: [p.problem], did: p.built, outcome: p.outcome, link: p.link
});
const PROJECTS = window.PORTFOLIO.projects.map(toFlight);

const STATUS_LABELS = { shipped: 'Departed', progress: 'Boarding', concept: 'On hold' };
const FILTERS = [
  { id: 'all', label: 'All flights' },
  { id: 'shipped', label: 'Departed' },
  { id: 'progress', label: 'Boarding' },
  { id: 'concept', label: 'On hold' }
];
// ?status= values in the URL
const STATUS_PARAMS = { shipped: 'departed', progress: 'boarding', concept: 'on-hold' };

// open: a flight was opened by the visitor or by a #slug link (Esc and Back close it)
// boardSeen / passSeen: the board and the printer have scrolled into view
// shown: the flight whose pass is printed. busy: a pass is being swapped.
const state = { filter: 'all', picked: PROJECTS[0]?.id, open: false, boardSeen: false, passSeen: false, shown: null, busy: false };

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lines = (list) => list.map((s) => `<span>${esc(s)}</span>`).join('');
const rowFor = (id) => document.querySelector(`#rows .row[data-id="${id}"]`);

// ----- Motion: the footer switch wins, otherwise the device setting -----
// boot.js applies the same choice to <html> before the page is drawn.
let motionChoice = null;
try { motionChoice = localStorage.getItem('aa-motion'); } catch (e) { /* storage blocked */ }
function isCalm() { return motionChoice ? motionChoice === 'calm' : SITE.reduceMotion.matches; }
function setMotion(v) {
  motionChoice = v;
  try { localStorage.setItem('aa-motion', v); } catch (e) { /* ignore */ }
  document.documentElement.classList.toggle('calm', isCalm());
}

// ----- Split-flap scramble -----
// Each letter and digit cycles through random glyphs, then locks in, left to
// right. Screen readers get the real text from a hidden copy.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function flapHTML(text) {
  return `<span class="sr-only">${esc(text)}</span><span class="flap" aria-hidden="true">${esc(text)}</span>`;
}
function scramble(flapEl, finalText, { duration = 900, stagger = 45 } = {}) {
  if (!flapEl) return Promise.resolve();
  const sr = flapEl.previousElementSibling;
  const text = finalText ?? sr.textContent;
  sr.textContent = text;
  if (isCalm()) { flapEl.textContent = text; return Promise.resolve(); }
  cancelAnimationFrame(flapEl._raf);
  const chars = [...text];
  const lockAt = chars.map((_, i) => i * stagger + Math.random() * (duration * 0.5));
  const start = performance.now();
  let last = 0;
  return new Promise((resolve) => {
    const frame = (now) => {
      const t = now - start;
      if (now - last > 55) { // about 18 flips a second, like real flaps
        last = now;
        if (window.onFlapTick) window.onFlapTick(); // sound (extras.js)
        flapEl.textContent = chars.map((ch, i) =>
          !/[A-Za-z0-9]/.test(ch) || t >= lockAt[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        ).join('');
      }
      if (t < Math.max(...lockAt) + 60) flapEl._raf = requestAnimationFrame(frame);
      else { flapEl.textContent = text; resolve(); }
    };
    flapEl._raf = requestAnimationFrame(frame);
  });
}

function renderTiles() {
  const word = 'DEPARTURES';
  $('.tiles').innerHTML = [...word].map((ch) => `<span class="tile" aria-hidden="true">${ch}</span>`).join('');
  document.querySelectorAll('.tile').forEach((t, i) => { t.style.animationDelay = `${i * 0.06}s`; });
}

function renderFilters() {
  $('#filters').innerHTML = FILTERS.map((f) =>
    `<button type="button" class="chip" data-filter="${f.id}" aria-pressed="${state.filter === f.id}">${esc(f.label)}</button>`
  ).join('');
}

function visibleFlights() {
  return PROJECTS.filter((p) => state.filter === 'all' || p.status === state.filter);
}

function renderRows() {
  const visible = visibleFlights();
  $('#rows').innerHTML = visible.map((p) => `
    <button type="button" class="row" data-id="${p.id}" data-status="${p.status}" aria-pressed="${state.picked === p.id}">
      <span class="row-year">${esc(p.year)}</span>
      <span class="row-name">${flapHTML(p.name)}</span>
      <span class="soft">${esc(p.via)}</span>
      <span class="soft">${esc(p.gate)}</span>
      <span class="status"><span class="status-dot ${p.status === 'progress' ? 'blink' : ''}" aria-hidden="true"></span><span class="status-label">${flapHTML(STATUS_LABELS[p.status])}</span></span>
    </button>`).join('');
  $('#empty').hidden = visible.length > 0;
  if (state.boardSeen) rollInRows();
}

// Rows wait folded until the board is on screen, then roll in one at a time.
function rollInRows() {
  $$('#rows .row').forEach((row, i) => {
    const delay = isCalm() ? 0 : i * 140;
    row.style.animationDelay = `${delay}ms`;
    row.classList.add('in');
    setTimeout(() => scramble(row.querySelector('.row-name .flap')), delay + 120);
  });
}

function markPicked() {
  // update selection in place so the flip-in animation doesn't replay
  document.querySelectorAll('#rows .row').forEach((r) => r.setAttribute('aria-pressed', String(r.dataset.id === state.picked)));
}

function passHTML(p) {
  return `
    <div class="pass-main">
      <div class="pass-meta"><span>Boarding pass · ${esc(p.highlight)}</span><span>Flight ${esc(p.code)}</span></div>
      <h3 class="display pass-title">${flapHTML(p.name)}</h3>
      <p class="pass-summary">${esc(p.summary)}</p>
      <div class="pass-grid">
        <div><span class="label">The problem</span>${lines(p.problem)}</div>
        <div><span class="label">What I did</span>${lines(p.did)}</div>
        <div><span class="label">Outcome</span>${lines(p.outcome)}</div>
      </div>
    </div>
    <div class="pass-stub">
      <div class="stub-grid">
        <div><span class="label">Year</span><strong>${esc(p.year)}</strong></div>
        <div><span class="label">Status</span><strong class="pass-status">${STATUS_LABELS[p.status]}</strong></div>
        <div><span class="label">Gate</span><strong>${esc(p.gate)}</strong></div>
        <div><span class="label">Via</span><strong>${esc(p.via)}</strong></div>
      </div>
      <div class="barcode" aria-hidden="true"></div>
      ${p.link ? `<a href="${esc(p.link)}" class="btn btn-pass">Read case study
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>` : ''}
    </div>`;
}

// ----- Boarding-pass printer -----
// The pass feeds out of the slot under the board.
function printPass() {
  const p = PROJECTS.find((x) => x.id === state.picked);
  const el = $('#pass');
  if (!p) { el.hidden = true; return; }
  el.hidden = false;
  el.className = 'pass';
  el.innerHTML = passHTML(p);
  SITE.externalLinks(el);
  SITE.copyable(el.querySelector('.pass-meta span:last-child'), () => p.id);
  state.shown = p.id;
  if (isCalm()) return;
  void el.offsetWidth;
  el.classList.add('printing');
  setTimeout(() => scramble(el.querySelector('.pass-title .flap'), null, { duration: 1100, stagger: 55 }), 250);
}

// Show the picked flight's pass. If another pass is out, its stub tears off
// and the rest feeds back into the slot first.
async function showPass() {
  if (state.passSeen && state.shown === state.picked) return;
  if (state.busy) return; // the swap under way prints whichever flight is picked when it ends
  const el = $('#pass');
  if (isCalm() || !state.passSeen || el.hidden) { state.passSeen = true; printPass(); return; }
  state.busy = true;
  el.classList.remove('printing');
  el.classList.add('tearing');
  await wait(380);
  el.classList.add('retracting');
  await wait(380);
  state.busy = false;
  printPass();
}

// ----- Filter change: the fixed-width cells spin before they settle -----
function spin(node, ms) {
  const final = node.nodeValue;
  const until = performance.now() + ms;
  const pick = (set) => set[Math.floor(Math.random() * set.length)];
  const mix = () => final.replace(/[A-Za-z0-9]/g, (ch) => (/\d/.test(ch) ? pick('0123456789') : ch === ch.toLowerCase() ? pick('abcdefghijklmnopqrstuvwxyz') : pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ')));
  node.nodeValue = mix();
  const timer = setInterval(() => {
    const done = performance.now() >= until;
    if (done || !node.isConnected) clearInterval(timer);
    node.nodeValue = done ? final : mix();
  }, 45);
}

function flap() {
  if (isCalm() || document.hidden) return;
  $$('.tile').forEach((t, i) => {
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    t.style.animationDelay = `${i * 0.06}s`;
    spin(t.firstChild, 320 + i * 60);
  });
  $$('#rows .row').forEach((r, i) => {
    r.querySelectorAll('.row-year, .soft').forEach((cell) => spin(cell.firstChild, 380 + i * 140));
    setTimeout(() => scramble(r.querySelector('.status-label .flap'), null, { duration: 500, stagger: 30 }), i * 140 + 120);
  });
}

// ----- Now and then a boarding flight flips to "Final call" for a few seconds -----
function scheduleLiveUpdate() {
  setTimeout(async () => {
    const rows = $$('#rows .row.in[data-status="progress"]');
    if (rows.length && !document.hidden && !isCalm()) {
      const row = rows[(Math.random() * rows.length) | 0];
      const label = row.querySelector('.status-label .flap');
      const passStatus = row.dataset.id === state.shown ? $('#pass .pass-status') : null;
      row.classList.add('final-call');
      if (window.onFinalCall) window.onFinalCall(); // chime (extras.js)
      await scramble(label, 'Final call', { duration: 600, stagger: 40 });
      if (passStatus) passStatus.textContent = 'Final call';
      await wait(6500);
      if (row.isConnected) {
        await scramble(label, STATUS_LABELS.progress, { duration: 600, stagger: 40 });
        row.classList.remove('final-call');
        if (passStatus && passStatus.isConnected) passStatus.textContent = STATUS_LABELS.progress;
      }
    }
    scheduleLiveUpdate();
  }, 9000 + Math.random() * 8000);
}

// ----- Remembered until the tab is closed: the open flight and the filter -----
function save() {
  SITE.remember({ slug: state.open ? state.picked : null, filter: state.filter });
}

function restore() {
  const was = SITE.recall();
  if (!state.open && PROJECTS.some((p) => p.id === was.slug)) state.picked = was.slug;
  if (!new URLSearchParams(location.search).has('status') && STATUS_PARAMS[was.filter]) {
    state.filter = was.filter;
    const url = new URL(location.href);
    url.searchParams.set('status', STATUS_PARAMS[was.filter]);
    try { history.replaceState(null, '', url); } catch (e) { /* ignore */ }
  }
}

// ----- URL state: ?status=departed and #project-slug -----
function readUrl() {
  const param = new URLSearchParams(location.search).get('status');
  state.filter = Object.keys(STATUS_PARAMS).find((k) => STATUS_PARAMS[k] === param) || 'all';
  const slug = SITE.slug();
  if (PROJECTS.some((p) => p.id === slug)) { state.picked = slug; state.open = true; }
  else if (!slug) { state.picked = PROJECTS[0]?.id; state.open = false; }
}

function setFilter(id) {
  state.filter = id;
  const url = new URL(location.href);
  if (id === 'all') url.searchParams.delete('status'); else url.searchParams.set('status', STATUS_PARAMS[id]);
  try { history.replaceState(null, '', url); } catch (e) { /* ignore */ }
  renderFilters();
  renderRows();
  flap();
  save();
  const n = visibleFlights().length;
  const kind = id === 'all' ? '' : `${STATUS_LABELS[id].toLowerCase()} `;
  SITE.announce(`Showing ${n} ${kind}${n === 1 ? 'flight' : 'flights'}`);
}

function openFlight(id, moveFocus) {
  if (!(state.open && state.picked === id)) {
    SITE.setSlug(id);
    state.picked = id;
    state.open = true;
    markPicked();
    save();
  }
  showPass();
  SITE.announce(`Boarding pass: ${PROJECTS.find((p) => p.id === id).name}`);
  if (moveFocus) { $('#pass').focus(); return; }
  // when the printer is below the screen, bring it into view
  if ($('#printer').getBoundingClientRect().top > window.innerHeight - 160) {
    $('.pass-wrap').scrollIntoView({ behavior: isCalm() ? 'instant' : 'smooth', block: 'start' });
  }
}

// Back to the board as it first loads, with focus on the flight that was open.
function closeFlight() {
  const id = state.picked;
  SITE.setSlug('');
  readUrl();
  markPicked();
  save();
  showPass();
  SITE.announce('Boarding pass closed');
  rowFor(id)?.focus();
}

// ----- Clock: ticks on the minute, and not at all while the tab is hidden -----
const clockFormat = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' });
let clockTimer;
function tickClock() {
  if (window.flipClock) window.flipClock(); // split-flap digits (extras.js)
  else $('#clock').textContent = clockFormat.format(new Date());
  clockTimer = setTimeout(tickClock, 60000 - (Date.now() % 60000) + 50);
}
document.addEventListener('visibilitychange', () => {
  clearTimeout(clockTimer);
  if (!document.hidden) tickClock();
});

// ----- Events -----
$('#filters').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (btn) setFilter(btn.dataset.filter);
});

$('#rows').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  // detail is 0 when the click came from Enter or Space
  openFlight(btn.dataset.id, e.detail === 0);
});

// Arrow keys move through the board
$('#rows').addEventListener('keydown', (e) => {
  const rows = [...document.querySelectorAll('#rows .row')];
  const i = rows.indexOf(document.activeElement);
  if (i < 0 || SITE.typing(e)) return;
  const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: rows.length - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  rows[Math.max(0, Math.min(rows.length - 1, next))].focus();
});

// Keep Tab inside the boarding pass while it has focus
$('#pass').addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !state.open) return;
  const stops = [...$('#pass').querySelectorAll('a[href], button, [tabindex="0"]')];
  const edge = e.shiftKey ? stops[0] : stops[stops.length - 1];
  if (!stops.length || document.activeElement === edge || document.activeElement === $('#pass')) {
    e.preventDefault();
    (stops.length ? stops[e.shiftKey ? stops.length - 1 : 0] : $('#pass')).focus();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.open && !SITE.typing(e)) closeFlight();
});

// Back and Forward
window.addEventListener('popstate', () => {
  const was = state.open ? state.picked : null;
  readUrl();
  save();
  renderFilters();
  renderRows();
  showPass();
  if (was && !state.open && $('#pass').contains(document.activeElement)) rowFor(was)?.focus();
});

$('#year').textContent = new Date().getFullYear();
$('#pass').tabIndex = -1;
const linked = SITE.initRoute(PROJECTS.map((p) => p.id));
readUrl();
if (!linked) restore();
renderTiles();
renderFilters();
renderRows();
tickClock();

// The rows roll in when the board scrolls into view, and the pass prints when
// the printer does. A #project link prints its pass straight away.
const seen = !isCalm() && 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    seen.unobserve(entry.target);
    if (entry.target.id === 'board' && !state.boardSeen) { state.boardSeen = true; rollInRows(); }
    if (entry.target.id === 'printer') setTimeout(showPass, state.boardSeen ? 500 : 0);
  });
}, { threshold: 0.25 }) : null;
if (seen) {
  seen.observe($('#board'));
  if (!linked) seen.observe($('#printer'));
} else {
  state.boardSeen = true;
  rollInRows();
}
if (linked || !seen) showPass();
if (linked) $('.pass-wrap').scrollIntoView({ behavior: 'instant', block: 'start' });
scheduleLiveUpdate();
