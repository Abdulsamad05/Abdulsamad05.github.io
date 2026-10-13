// ===== Option C — Mixtape =====
// Projects come from ../shared/content.js. This maps each one onto a track.
// Track numbers are decorative.
const toTrack = (p) => ({
  slug: p.slug, name: p.name, year: p.year, credits: p.stack.join(', '), stat: p.stat,
  summary: p.summary, brief: p.problem, part: p.built.join(' '), result: p.outcome.join(' '), link: p.link
});
const TRACKS = window.PORTFOLIO.projects.map(toTrack);

let idx = 0;
let playing = false;

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (i) => String(i + 1).padStart(2, '0');
const indexOfSlug = (slug) => TRACKS.findIndex((t) => t.slug === slug);

function renderTracklist() {
  $('#tracklist').innerHTML = TRACKS.map((t, i) => `
    <button type="button" class="track" data-i="${i}" aria-pressed="${i === idx}" aria-keyshortcuts="${i + 1}" title="Press ${i + 1} to play">
      <span class="t-num">${pad(i)}</span>
      <span class="t-name">${esc(t.name)}</span>
      <span class="t-meta hide-sm">${esc(t.credits)}</span>
      <span class="t-meta hide-sm">${esc(t.year)}</span>
      <span class="t-eq"><span class="eq" aria-hidden="true"><span></span><span></span><span></span><span></span></span></span>
    </button>`).join('');
}

function renderNow() {
  const t = TRACKS[idx];
  const values = { ...t, num: pad(idx) };
  document.querySelectorAll('[data-now]').forEach((el) => {
    el.textContent = values[el.dataset.now] ?? '';
  });
  const story = $('#story');
  story.hidden = !t.link;
  if (t.link) { story.href = t.link; SITE.externalLinks(story.parentNode); } else story.removeAttribute('href');
  document.querySelectorAll('#tracklist .track').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === idx)));
}

function announce() {
  const t = TRACKS[idx];
  SITE.announce(playing ? `Now playing: ${t.name}` : `Track ${pad(idx)} loaded: ${t.name}`);
}

function setPlaying(p) {
  playing = p;
  document.body.dataset.playing = String(playing);
  $('#toggle').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  clearInterval(reelTimer);
  if (playing) reelTimer = setInterval(drawReels, 120);
}

// ----- Tape position: the progress bar is the clock -----
// The bar is a CSS animation. Reading and setting its time gives the position
// of the tape, so it can be dragged and the reels can show how much is left.
let reelTimer;
const tape = () => ($('.prog').getAnimations ? $('.prog').getAnimations()[0] : null);
const tapeLength = (anim) => anim.effect.getComputedTiming().duration;

function position() {
  const anim = tape();
  return anim ? ((anim.currentTime || 0) % tapeLength(anim)) / tapeLength(anim) : 0;
}

function seek(fraction) {
  const anim = tape();
  if (!anim) return;
  anim.currentTime = Math.max(0, Math.min(0.995, fraction)) * tapeLength(anim);
  drawReels();
}

// Tape moves from the left reel to the right one as the track plays
function drawReels() {
  const [left, right] = document.querySelectorAll('.reel circle:first-child');
  if (!tape() || !right) return;
  const at = position();
  left.setAttribute('r', String(Number((30 - 8 * at).toFixed(2))));
  right.setAttribute('r', String(Number((22 + 8 * at).toFixed(2))));
  $('.progress').setAttribute('aria-valuenow', String(Math.round(at * 100)));
}

// Drag or click the progress bar to move through the track. The bar is thin,
// so a little space above and below it counts too.
let scrubbing = false;
function setUpScrub() {
  const bar = $('.progress');
  if (!tape()) return; // reduced motion: there is no moving tape
  bar.removeAttribute('aria-hidden');
  bar.setAttribute('role', 'slider');
  bar.setAttribute('aria-label', 'Track position');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.tabIndex = 0;
  bar.style.cursor = 'pointer';
  const at = (e) => { const r = bar.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
  $('.deck').addEventListener('pointerdown', (e) => {
    const r = bar.getBoundingClientRect();
    scrubbing = !e.target.closest('button') && e.clientY > r.top - 14 && e.clientY < r.bottom + 14 && e.clientX > r.left - 6 && e.clientX < r.right + 6;
    if (!scrubbing) return;
    $('.deck').setPointerCapture(e.pointerId);
    seek(at(e));
  });
  $('.deck').addEventListener('pointermove', (e) => { if (scrubbing && e.buttons) seek(at(e)); });
  bar.addEventListener('keydown', (e) => {
    const to = { ArrowRight: position() + 0.05, ArrowLeft: position() - 0.05, Home: 0 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    seek(to);
  });
  drawReels();
}

// record: 'push' adds the track to browser history, 'replace' swaps the URL
// quietly (auto-advance), false leaves the URL alone (Back/Forward).
function load(i, autoplay, record = 'push') {
  idx = (i + TRACKS.length) % TRACKS.length;
  if (record) SITE.setSlug(TRACKS[idx].slug, record === 'replace');
  SITE.remember({ slug: TRACKS[idx].slug });
  if (autoplay) setPlaying(true);
  SITE.transition($('.notes'), renderNow);
  // restart the progress bar for the new track
  const prog = $('.prog');
  prog.style.animation = 'none'; void prog.offsetWidth; prog.style.animation = '';
  drawReels();
  announce();
}

function toggle() {
  setPlaying(!playing);
  SITE.announce(playing ? `Now playing: ${TRACKS[idx].name}` : 'Paused');
}

$('#toggle').addEventListener('click', toggle);
$('#prev').addEventListener('click', () => load(idx - 1));
$('#next').addEventListener('click', () => load(idx + 1));
$('#tracklist').addEventListener('click', (e) => {
  const b = e.target.closest('[data-i]');
  if (b) load(Number(b.dataset.i), true);
});
// When the progress bar finishes a loop, move to the next track
$('.prog').addEventListener('animationiteration', () => { if (playing) load(idx + 1, false, 'replace'); });

// Up and Down move through the tracklist
$('#tracklist').addEventListener('keydown', (e) => {
  const tracks = [...document.querySelectorAll('#tracklist .track')];
  const i = tracks.indexOf(document.activeElement);
  if (i < 0 || SITE.typing(e)) return;
  const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: tracks.length - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  tracks[Math.max(0, Math.min(tracks.length - 1, next))].focus();
});
// Space plays or pauses, J and L skip. Space on a button or link keeps its usual job.
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || SITE.typing(e)) return;
  const key = e.key.toLowerCase();
  if (key === ' ' && !e.target.closest('button, a, summary')) { e.preventDefault(); toggle(); }
  if (key === 'j') load(idx - 1);
  if (key === 'l') load(idx + 1);
  // 1 to 5 play that track, like picking it from the tracklist
  if (/^[1-9]$/.test(key) && Number(key) <= TRACKS.length && !e.target.closest('[role="slider"]')) load(Number(key) - 1, true);
});
setUpScrub();
// a drag along the progress bar is not a skip
SITE.swipe($('.deck'), () => { if (!scrubbing) load(idx - 1); }, () => { if (!scrubbing) load(idx + 1); });
// The "Press play" sticker does what it says
$('.sticker').style.cursor = 'pointer';
$('.sticker').addEventListener('click', () => { if (!playing) toggle(); });
SITE.copyable($('.notes-meta span'), () => TRACKS[idx].slug, renderNow);

// Pause when the tab is hidden, and stay paused until play is pressed again
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) setPlaying(false); });

// Back and Forward
window.addEventListener('popstate', () => {
  const slug = SITE.slug();
  const i = slug ? indexOfSlug(slug) : 0;
  if (i >= 0 && i !== idx) load(i, false, false);
});

$('#year').textContent = new Date().getFullYear();
const linked = SITE.initRoute(TRACKS.map((t) => t.slug));
if (linked) idx = indexOfSlug(linked);
else idx = Math.max(0, indexOfSlug(SITE.recall().slug));
renderTracklist();
renderNow();
if (linked) $('#tracks').scrollIntoView({ behavior: 'instant', block: 'start' });
