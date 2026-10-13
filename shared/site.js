// ===== Shared behaviour for all three concepts =====
// Loaded after content.js and before each concept's script.js. Nothing here is
// visible on screen: it fills copy from PORTFOLIO, handles deep links, swipes,
// screen-reader announcements, the print summary and the service worker.
(function () {
  const P = window.PORTFOLIO;
  const here = document.currentScript && document.currentScript.src;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The site folder, so paths in content.js work from any page.
  const siteRoot = here ? new URL('../', here) : new URL('./', location.href);

  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), P);

  function el(tag, text, cls) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }

  // Static copy. The HTML already holds the same text, so this only changes
  // anything when content.js has been edited and the HTML has not.
  function fill() {
    document.querySelectorAll('[data-field]').forEach((node) => {
      let value = get(node.dataset.field);
      if (Array.isArray(value)) value = value.join(', ');
      if (value != null && node.textContent !== value) node.textContent = value;
    });
    document.querySelectorAll('[data-list]').forEach((list) => {
      const items = get(list.dataset.list) || [];
      const current = [...list.children].map((li) => li.textContent);
      if (current.join('\n') !== items.join('\n')) list.replaceChildren(...items.map((item) => el('li', item)));
    });
    document.querySelectorAll('[data-link]').forEach((a) => {
      const value = P.contact[a.dataset.link];
      if (!value) { a.hidden = true; a.removeAttribute('href'); return; }
      a.href = a.dataset.link === 'email' ? `mailto:${value}` : new URL(value, siteRoot).href;
      if (a.dataset.link === 'cv') a.setAttribute('download', ''); // save the file rather than open it
      a.hidden = false;
    });
    externalLinks(document);
  }

  function externalLinks(root) {
    root.querySelectorAll('a[href^="http"]').forEach((a) => {
      if (a.host === location.host) return;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  // Deep links: #project-slug in the URL.
  const slug = () => decodeURIComponent(location.hash.slice(1));
  const urlFor = (s) => location.pathname + location.search + (s ? `#${s}` : '');
  function setSlug(s, replace) {
    try { history[replace ? 'replaceState' : 'pushState'](null, '', urlFor(s)); } catch (e) { /* file:// in some browsers */ }
  }
  // When the page is opened straight onto a project, put the plain page
  // underneath it in history so Back returns there before leaving the site.
  function initRoute(slugs) {
    const s = slug();
    if (!slugs.includes(s)) return null;
    setSlug('', true);
    setSlug(s);
    return s;
  }

  // Cross-fade one region between two states that already exist.
  let transitions = 0;
  function transition(target, update) {
    if (!document.startViewTransition || reduceMotion.matches || document.hidden) { update(); return Promise.resolve(); }
    const root = document.documentElement;
    const run = ++transitions;
    root.style.viewTransitionName = 'none';
    target.style.viewTransitionName = 'swap';
    const vt = document.startViewTransition(update);
    const clean = () => {
      if (run !== transitions) return;
      root.style.viewTransitionName = '';
      target.style.viewTransitionName = '';
    };
    vt.ready.catch(() => {}); // a newer transition took over
    vt.finished.then(clean, clean);
    return vt.updateCallbackDone.catch(() => {});
  }

  function announce(message) {
    const live = document.getElementById('live');
    if (live) live.textContent = message;
  }

  // True when a keyboard shortcut should stand down.
  function typing(e) {
    const t = e.target;
    return e.ctrlKey || e.metaKey || e.altKey || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
  }

  // Horizontal swipe on touch screens. Vertical scrolling is left alone.
  // onDrag, if given, is called with the distance while a finger is dragging
  // sideways, and with null when it lets go.
  function swipe(target, onPrev, onNext, onDrag) {
    if (!window.PointerEvent) return;
    target.style.touchAction = 'pan-y';
    let start = null;
    const drag = (dx) => { if (onDrag && !reduceMotion.matches) onDrag(dx); };
    target.addEventListener('pointerdown', (e) => {
      start = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY, id: e.pointerId, dragging: false };
    });
    target.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!start.dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) start.dragging = true;
      if (start.dragging) drag(dx);
    });
    target.addEventListener('pointerup', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (start.dragging) drag(null);
      start = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      // a short tap on phones that support it
      if (navigator.vibrate && !reduceMotion.matches) navigator.vibrate(10);
      if (dx < 0) onNext(); else onPrev();
    });
    target.addEventListener('pointercancel', () => {
      if (start && start.dragging) drag(null);
      start = null;
    });
  }

  // Remembers where the visitor was on this page until the tab is closed.
  const storeKey = `portfolio:${location.pathname}`;
  function remember(value) {
    try { sessionStorage.setItem(storeKey, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }
  function recall() {
    try { return JSON.parse(sessionStorage.getItem(storeKey)) || {}; } catch (e) { return {}; }
  }

  // Turns an existing label (a flight, card or track code) into a way to copy
  // the project's link. slug is read at click time. restored runs once the
  // label has its own text back.
  function copyable(node, slug, restored) {
    if (!node || !navigator.clipboard || !window.isSecureContext) return;
    node.setAttribute('role', 'button');
    node.tabIndex = 0;
    node.title = 'Copy a link to this project';
    node.style.cursor = 'pointer';
    let busy = false;
    const copy = () => {
      if (busy) return;
      navigator.clipboard.writeText(`${location.origin}${location.pathname}#${slug()}`).then(() => {
        busy = true;
        const own = [...node.childNodes];
        node.replaceChildren('Link copied');
        announce('Link copied');
        setTimeout(() => { node.replaceChildren(...own); busy = false; if (restored) restored(); }, 1400);
      }, () => {});
    };
    node.addEventListener('click', copy);
    node.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      copy();
    });
  }

  // Print-only summary (see print.css). Hidden on screen.
  function buildPrint() {
    const cv = el('section', null, 'print-cv');
    cv.hidden = true;
    const c = P.contact;
    const contact = [P.identity.city, c.email, c.linkedin, c.github].filter(Boolean).join(' · ');
    cv.append(el('p', P.identity.name, 'p-name'), el('p', P.identity.headline, 'p-head'), el('p', contact, 'p-contact'), el('p', P.identity.intro));

    cv.append(el('h2', 'Projects'));
    P.projects.forEach((p) => {
      const block = el('div', null, 'p-item');
      const head = el('h3', p.name);
      head.append(el('span', p.year));
      const points = el('ul');
      [...p.built, ...p.outcome].forEach((line) => points.append(el('li', line)));
      block.append(head, el('p', p.summary), points, el('p', p.stack.join(', '), 'p-meta'));
      cv.append(block);
    });

    cv.append(el('h2', 'Skills'));
    P.skills.groups.forEach((g) => cv.append(el('p', `${g.label}: ${g.items.join(', ')}`)));

    cv.append(el('h2', 'Experience'));
    P.experience.forEach((x) => {
      const block = el('div', null, 'p-item');
      const head = el('h3', `${x.role}, ${x.org}`);
      head.append(el('span', x.dates));
      block.append(head, el('p', x.summary));
      cv.append(block);
    });

    cv.append(el('h2', 'Education'));
    P.education.forEach((x) => {
      const head = el('h3', `${x.title}, ${x.org}`);
      head.append(el('span', x.dates));
      cv.append(head);
    });

    cv.append(el('h2', 'Certifications'));
    P.certifications.forEach((x) => {
      const head = el('h3', x.title);
      head.append(el('span', x.date));
      cv.append(head);
    });

    document.body.append(cv);
  }

  function registerWorker() {
    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    if (!('serviceWorker' in navigator) || !here || !(location.protocol === 'https:' || local)) return;
    navigator.serviceWorker.register(new URL('sw.js', siteRoot)).catch(() => {});
  }

  window.SITE = { fill, externalLinks, slug, setSlug, initRoute, transition, announce, typing, swipe, remember, recall, copyable, reduceMotion };

  fill();
  buildPrint();
  registerWorker();
})();
