// Runs before the page is drawn, so nothing flashes: marks that scripts are on,
// applies Calm motion, and decides whether the power-on intro plays.
(function () {
  var root = document.documentElement, choice = null, seen = null;
  root.classList.add('js');
  try { choice = localStorage.getItem('aa-motion'); seen = localStorage.getItem('aa-intro-seen'); } catch (e) { /* storage blocked */ }
  var calm = choice ? choice === 'calm' : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) root.classList.add('calm');
  if (!calm && (!seen || /[?&]intro\b/.test(location.search))) root.classList.add('intro-on');
})();
