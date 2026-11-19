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
  document.querySelectorAll('.we-sell .phrase').forEach(function (el) { roll(el); });
  function roll(el) {
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
  }
})();

// Lead forms: send to /api/lead and show a thank-you in place.
(function () {
  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('[type="submit"]');
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (btn) btn.disabled = true;
      if (status) status.textContent = 'Sending…';
      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.j && res.j.error);
          form.classList.add('sent');
          if (status) status.textContent = form.dataset.thanks || 'Thank you.';
          form.dispatchEvent(new CustomEvent('lead:sent', { bubbles: true }));
        })
        .catch(function (e) {
          if (btn) btn.disabled = false;
          if (status) status.textContent = (e && e.message) || 'Something went wrong. Please call or text 612-232-3165.';
        });
    });
  });
})();

// The flip book: swipe, arrow keys and buttons; the master book unlocks after the reader's details.
(function () {
  var track = document.querySelector('.book-track');
  if (!track) return;
  var prev = document.querySelector('.book-nav .prev');
  var next = document.querySelector('.book-nav .next');
  var bar = document.querySelector('.book-progress span');
  var count = document.querySelector('.book-count');
  var KEY = 'qp-book-unlocked';
  var params = new URLSearchParams(location.search);
  function store(get) { try { return get ? localStorage.getItem(KEY) : localStorage.setItem(KEY, '1'); } catch (e) { return null; } }
  function unlock() { track.classList.add('unlocked'); store(false); update(); }
  if (track.dataset.gated !== 'true' || params.has('known') || store(true)) track.classList.add('unlocked');
  function pagesNow() { return Array.prototype.filter.call(track.querySelectorAll('.bpage'), function (p) { return p.offsetParent !== null || getComputedStyle(p).display !== 'none'; }); }
  function index() { return Math.round(track.scrollLeft / track.clientWidth); }
  function update() {
    var ps = pagesNow(), i = index();
    if (count) count.textContent = (i + 1) + ' / ' + ps.length;
    if (bar) bar.style.width = (ps.length > 1 ? (i / (ps.length - 1)) * 100 : 100) + '%';
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i >= ps.length - 1;
  }
  function go(d) { track.scrollTo({ left: (index() + d) * track.clientWidth }); }
  if (prev) prev.addEventListener('click', function () { go(-1); });
  if (next) next.addEventListener('click', function () { go(1); });
  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
  });
  var t;
  track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(update, 60); });
  window.addEventListener('resize', update);
  var gate = track.querySelector('.bpage.gate');
  if (gate) gate.addEventListener('lead:sent', function () {
    var at = index();
    setTimeout(function () { unlock(); track.scrollTo({ left: at * track.clientWidth, behavior: 'auto' }); }, 900);
  });
  var pr = document.querySelector('.book-print');
  if (pr) pr.addEventListener('click', function () { window.print(); });
  update();
})();

// Work with us: choosing a path swaps the copy and sets the form's tags
(function () {
  var tabs = document.querySelectorAll('.path-tab');
  var box = document.querySelector('.path-form');
  if (!tabs.length || !box) return;
  var cfg = {}; try { cfg = JSON.parse(box.getAttribute('data-paths')); } catch (e) {}
  var form = box.querySelector('form');
  var agent = (new URLSearchParams(location.search).get('with') || '').toLowerCase();
  if (agent !== 'becky' && agent !== 'elena') agent = '';
  var agentName = agent ? agent.charAt(0).toUpperCase() + agent.slice(1) : '';
  if (agent) { var note = document.createElement('p'); note.className = 'small'; note.style.margin = '0 0 18px'; note.textContent = 'You’ll hear from ' + agentName + ' directly.'; box.insertBefore(note, box.firstChild); }
  function choose(tab, focus) {
    var id = tab.getAttribute('data-path');
    tabs.forEach(function (t) { var on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    document.querySelectorAll('.path-body').forEach(function (b) { b.hidden = b.getAttribute('data-path') !== id; });
    document.getElementById('path-panel').setAttribute('aria-labelledby', tab.id);
    var c = cfg[id];
    if (c && form) {
      form.querySelector('[name=tags]').value = c.tags + (agent ? ', agent: ' + agent : '');
      form.querySelector('[name=source]').value = c.source + (agent ? ' (asked for ' + agentName + ')' : '');
      var msg = form.querySelector('[name=message]'); if (msg) msg.placeholder = c.ph;
      var when = form.querySelector('[name=timeline]'); if (when && id === 'exploring' && !when.value) when.value = 'Just exploring';
    }
    if (focus) tab.focus();
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = i ? -1 : 0;
    t.addEventListener('click', function () { choose(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = tabs.length;
      if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); choose(tabs[(i + (k === 'ArrowRight' ? 1 : n - 1)) % n], true); }
    });
  });
  var start = document.querySelector('.path-tab[data-path="' + location.hash.slice(1) + '"]');
  if (start) choose(start); else if (agent) choose(tabs[0]); else { var m = form && form.querySelector('[name=message]'); if (m && cfg.selling) m.placeholder = cfg.selling.ph; }
})();

// Footer pop-ups (Doing Better)
(function () {
  function open(d) { if (d && d.showModal && !d.open) d.showModal(); }
  document.querySelectorAll('[data-dialog]').forEach(function (a) {
    a.addEventListener('click', function (e) { var d = document.getElementById(a.getAttribute('data-dialog')); if (d && d.showModal) { e.preventDefault(); open(d); } });
  });
  document.querySelectorAll('dialog').forEach(function (d) {
    var x = d.querySelector('.dialog-close'); if (x) x.addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });
  if (location.hash === '#doing-better') open(document.getElementById('db-dialog'));
})();
