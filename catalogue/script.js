// ===== Option B — Card catalogue =====
// Projects come from ../shared/content.js. Each one becomes a tab and an index card.
// The tab letter and card code are decorative. A field with no value is left off the card.
const toCard = (p, i) => ({
  slug: p.slug, letter: String.fromCharCode(65 + i), short: p.short, code: `AA–00${i + 1}`, year: p.year, name: p.name,
  fields: [
    ['Summary', p.summary],
    ['Subject', p.stack.join(', ')],
    ['For', p.client],
    ['My role', p.role],
    ['Problem', p.problem],
    ['Built', p.built.join(' ')],
    ['Outcome', p.outcome.join(' ')],
    ['Notes', p.stat]
  ].filter(([, value]) => value),
  link: p.link
});
const CARDS = window.PORTFOLIO.projects.map(toCard);

// Slight hand-placed tilt per card. Set TILT = false for straight cards.
const TILT = true;
const TILTS = ['-0.6deg', '0.5deg', '-0.3deg', '0.7deg', '-0.5deg'];

let idx = 0;
const tilt = () => (TILT ? TILTS[idx % TILTS.length] : '0deg');
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const indexOfSlug = (slug) => CARDS.findIndex((c) => c.slug === slug);

function renderTabs() {
  $('#tabs').innerHTML = CARDS.map((c, i) => `
    <button type="button" role="tab" class="tab" id="tab-${i}" data-i="${i}" aria-selected="${i === idx}" aria-controls="card" tabindex="${i === idx ? 0 : -1}" aria-keyshortcuts="${esc(c.letter)}" title="${esc(c.name)} (press ${esc(c.letter)})">
      <span class="tab-letter">${esc(c.letter)}</span>
      <span class="tab-short">${esc(c.short)}</span>
    </button>`).join('');
}

function renderCard(animate) {
  const c = CARDS[idx];
  const card = $('#card');
  card.setAttribute('aria-labelledby', `tab-${idx}`);
  card.style.transform = `rotate(${tilt()})`;
  card.innerHTML = `
    <div class="card-rule" aria-hidden="true"></div>
    <div class="card-meta"><strong>${esc(c.code)}</strong><span>${esc(c.year)}</span></div>
    <h3 class="display card-title">${esc(c.name)}</h3>
    <dl class="card-fields">
      ${c.fields.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('\n      ')}
    </dl>
    ${c.link ? `<div class="card-link"><a href="${esc(c.link)}">See full entry →</a></div>` : ''}
    <div class="card-hole" aria-hidden="true"></div>`;
  SITE.externalLinks(card);
  SITE.copyable(card.querySelector('.card-meta strong'), () => c.slug);
  if (animate) { card.classList.remove('pulled'); void card.offsetWidth; card.classList.add('pulled'); }
  $('#pos').textContent = `Card ${idx + 1} of ${CARDS.length}`;
}

// record: add the card to browser history (false when Back/Forward brought us here)
function go(i, focusTab, record = true) {
  idx = (i + CARDS.length) % CARDS.length;
  if (record) SITE.setSlug(CARDS[idx].slug);
  SITE.remember({ slug: CARDS[idx].slug });
  renderTabs();
  showTab();
  if (focusTab) document.getElementById(`tab-${idx}`).focus();
  SITE.transition($('#card'), () => renderCard(true));
  SITE.announce(`Card ${idx + 1} of ${CARDS.length}: ${CARDS[idx].name}`);
}

// On narrow screens the tab strip scrolls sideways: keep the selected tab in it
function showTab() {
  const strip = $('#tabs').getBoundingClientRect();
  const tab = document.getElementById(`tab-${idx}`).getBoundingClientRect();
  const by = tab.left < strip.left + 20 ? tab.left - strip.left - 20 : tab.right > strip.right - 20 ? tab.right - strip.right + 20 : 0;
  if (by) $('#tabs').scrollBy({ left: by, behavior: SITE.reduceMotion.matches ? 'instant' : 'smooth' });
}

// While a finger drags sideways the card follows it, then settles or flips
function dragCard(dx) {
  const card = $('#card');
  card.style.transition = dx === null ? '' : 'none';
  card.style.transform = dx === null ? `rotate(${tilt()})` : `translateX(${dx}px) rotate(calc(${tilt()} + ${dx * 0.02}deg))`;
}

// The stamp always carries the current month, e.g. OCT 2026
function renderStamp() {
  const now = new Date();
  const short = now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const long = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  $('.stamp textPath').textContent = `AVAILABLE FOR WORK · ${short.toUpperCase()} ·`;
  $('.stamp').setAttribute('aria-label', `Available for work from ${long}`);
}

$('#tabs').addEventListener('click', (e) => {
  const t = e.target.closest('[data-i]');
  if (t) go(Number(t.dataset.i));
});
// Arrow keys move between tabs (standard tablist behaviour)
$('#tabs').addEventListener('keydown', (e) => {
  if (SITE.typing(e)) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1, true); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1, true); }
});
// Anywhere else on the page: Left and Right flip cards, A–E jump to a tab
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || SITE.typing(e)) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); return; }
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); return; }
  const i = e.key.length === 1 ? CARDS.findIndex((c) => c.letter === e.key.toUpperCase()) : -1;
  if (i >= 0) go(i);
});
$('#prev').addEventListener('click', () => go(idx - 1));
$('#next').addEventListener('click', () => go(idx + 1));
SITE.swipe($('.card-stack'), () => go(idx - 1), () => go(idx + 1), dragCard);
// The cards peeking out behind are the next two in the drawer
[['.card-shadow.s1', 1], ['.card-shadow.s2', 2]].forEach(([sel, step]) => {
  $(sel).style.cursor = 'pointer';
  $(sel).addEventListener('click', () => go(idx + step));
});

// Back and Forward
window.addEventListener('popstate', () => {
  const slug = SITE.slug();
  const i = slug ? indexOfSlug(slug) : 0;
  if (i >= 0 && i !== idx) go(i, false, false);
});

$('#year').textContent = new Date().getFullYear();
const linked = SITE.initRoute(CARDS.map((c) => c.slug));
if (linked) idx = indexOfSlug(linked);
else idx = Math.max(0, indexOfSlug(SITE.recall().slug));
renderStamp();
renderTabs();
renderCard(false);
showTab();
if (linked) $('.drawer').scrollIntoView({ behavior: 'instant', block: 'start' });
