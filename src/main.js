// Quinby Partners — small site behaviors. No libraries.

// Mobile menu
(function () {
  var btn = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

// B-roll: load each clip only when its block is near the screen, skip on reduced motion
// and on small screens (they keep the still image), and keep pages fast.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
  var blocks = document.querySelectorAll('.media[data-video]');
  if (reduce || !blocks.length) return;
  function start(el) {
    var src = small && el.dataset.videoSmall ? el.dataset.videoSmall : el.dataset.video;
    if (!src || (small && !el.dataset.videoSmall)) return;
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('aria-hidden', 'true');
    if (el.dataset.poster) v.poster = el.dataset.poster;
    v.src = src;
    v.addEventListener('canplay', function () { el.classList.add('has-video'); });
    el.insertBefore(v, el.firstChild);
  }
  if (!('IntersectionObserver' in window)) { blocks.forEach(start); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); start(e.target); } });
  }, { rootMargin: '200px' });
  blocks.forEach(function (b) { io.observe(b); });
})();

// "We don't just sell homes. We sell…" — plays once when it scrolls into view, ends on the last phrase.
(function () {
  var el = document.querySelector('.we-sell .phrase');
  if (!el) return;
  var phrases;
  try { phrases = JSON.parse(el.dataset.phrases); } catch (e) { return; }
  var last = phrases[phrases.length - 1];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = last; return; }
  var i = 0;
  el.textContent = phrases[0];
  function run() {
    var timer = setInterval(function () {
      if (i >= phrases.length - 1) { clearInterval(timer); return; }
      el.classList.add('out');
      setTimeout(function () {
        i += 1; el.textContent = phrases[i]; el.classList.remove('out');
        if (i === phrases.length - 1) clearInterval(timer);
      }, 700);
    }, 2600);
  }
  if (!('IntersectionObserver' in window)) { run(); return; }
  var io = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); run(); }
  }, { threshold: 0.6 });
  io.observe(el);
})();
