// HexaEcom feedback button, shared by hexaecom.com, pallet.hexaecom.com and images.hexaecom.com.
// Source of truth: hexaecom-wordpress/site/tools/feedback.js (copy it to the other sites when it changes).
// A "Feedback" button opens a small form: pick a part of the page (or tap it), rate it, say what to improve.
// Messages go to hexaecom.com (snippet hexaecom-feedback), which saves them in WP admin and emails the team.
// Tools can call window.hxFeedback.ask('Tool name') after a successful use to ask "How was it?" once.
(function () {
  if (window.hxFeedback) return;
  var d = document;
  var API = 'https://hexaecom.com/wp-json/hexaecom/v1/feedback';
  var SECTIONS = '[data-feedback-section], .hx-hero, .hx-section, section, footer';
  var me = d.currentScript;
  var bottom = (me && me.getAttribute('data-bottom')) || '';

  var css = [
    '.hxfb-btn{position:fixed;left:18px;bottom:var(--hxfb-bottom,18px);z-index:2147482000;display:inline-flex;align-items:center;gap:8px;',
    'padding:11px 16px;border:0;border-radius:999px;background:#0c1530;color:#fff;font:600 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;',
    'box-shadow:0 8px 24px rgba(12,21,48,.3);cursor:pointer}',
    '.hxfb-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.hxfb-btn:hover{background:#3d6bff}',
    '.hxfb-panel{position:fixed;left:18px;bottom:calc(var(--hxfb-bottom,18px) + 58px);z-index:2147482001;width:360px;max-width:calc(100vw - 36px);',
    'max-height:calc(100vh - 110px);overflow:auto;background:#fff;color:#0d1324;border:1px solid #dfe5f2;border-radius:18px;',
    'box-shadow:0 24px 60px rgba(12,21,48,.25);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:18px;box-sizing:border-box}',
    '.hxfb-panel *{box-sizing:border-box}',
    '.hxfb-panel h2{font:700 18px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;margin:0 0 4px;color:#0d1324}',
    '.hxfb-panel p{margin:0 0 12px;color:#5b6782;font-size:14px}',
    '.hxfb-x{position:absolute;right:10px;top:10px;width:34px;height:34px;border:0;border-radius:50%;background:#f4f7fd;color:#0d1324;font-size:20px;line-height:1;cursor:pointer}',
    '.hxfb-panel label{display:block;font-weight:600;font-size:14px;margin:12px 0 6px}',
    '.hxfb-panel label small{font-weight:400;color:#5b6782}',
    '.hxfb-row{display:flex;gap:8px;align-items:center}',
    '.hxfb-panel select,.hxfb-panel textarea,.hxfb-panel input[type=email]{width:100%;font:inherit;color:#0d1324;background:#fff;border:1px solid #dfe5f2;border-radius:10px;padding:9px 11px;margin:0}',
    '.hxfb-panel textarea{min-height:92px;resize:vertical}',
    '.hxfb-pick{flex:none;border:1px solid #dfe5f2;background:#f4f7fd;color:#3d6bff;font-family:inherit;font-weight:600;font-size:13px;line-height:1;padding:10px 12px;border-radius:10px;cursor:pointer;white-space:nowrap}',
    '.hxfb-rate{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.hxfb-rate button{border:1px solid #dfe5f2;background:#fff;border-radius:12px;padding:10px;font-family:inherit;font-weight:600;font-size:14px;line-height:1.2;color:#0d1324;cursor:pointer}',
    '.hxfb-rate button[aria-pressed=true]{background:#e6edff;border-color:#3d6bff;color:#1d3a99}',
    '.hxfb-send{margin-top:14px;width:100%;border:0;border-radius:999px;background:#3d6bff;color:#fff;font-family:inherit;font-weight:600;font-size:15px;line-height:1;padding:13px;cursor:pointer}',
    '.hxfb-send[disabled]{opacity:.6;cursor:wait}',
    '.hxfb-msg{margin-top:10px;font-size:14px;font-weight:600}',
    '.hxfb-msg.ok{color:#14875f}.hxfb-msg.err{color:#d93a3a}',
    '.hxfb-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}',
    '.hxfb-panel :focus-visible,.hxfb-btn:focus-visible{outline:2px solid #3d6bff;outline-offset:2px}',
    '.hxfb-hl{position:absolute;z-index:2147481999;pointer-events:none;border:3px solid #3d6bff;border-radius:14px;background:rgba(61,107,255,.08);transition:all .12s}',
    '.hxfb-bar{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147482002;background:#0c1530;color:#fff;border-radius:999px;',
    'padding:10px 10px 10px 18px;font:600 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;gap:12px;align-items:center;',
    'box-shadow:0 10px 30px rgba(12,21,48,.35);max-width:calc(100vw - 24px)}',
    '.hxfb-bar button{border:0;border-radius:999px;background:#fff;color:#0c1530;font-family:inherit;font-weight:600;font-size:13px;line-height:1;padding:8px 12px;cursor:pointer}',
    'body.hxfb-picking,body.hxfb-picking *{cursor:crosshair!important}',
    '.hxfb-ask{position:fixed;left:18px;bottom:calc(var(--hxfb-bottom,18px) + 58px);z-index:2147482000;background:#fff;color:#0d1324;border:1px solid #dfe5f2;',
    'border-radius:16px;box-shadow:0 16px 40px rgba(12,21,48,.2);padding:12px 12px 12px 16px;display:flex;align-items:center;gap:10px;',
    'font:600 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;max-width:calc(100vw - 36px)}',
    '.hxfb-ask button{border:1px solid #dfe5f2;background:#f4f7fd;border-radius:10px;padding:7px 10px;font-family:inherit;font-weight:600;font-size:14px;line-height:1;cursor:pointer;color:#0d1324}',
    '.hxfb-ask .hxfb-close{background:none;border:0;color:#5b6782;font-size:18px;padding:4px 6px}',
    '@media (max-width:600px){.hxfb-btn{left:12px;padding:10px 14px}.hxfb-btn span{display:none}',
    '.hxfb-panel{left:8px;right:8px;width:auto;max-width:none;bottom:calc(var(--hxfb-bottom,12px) + 56px)}.hxfb-ask{left:12px}}',
    '@media print{.hxfb-btn,.hxfb-panel,.hxfb-ask,.hxfb-bar,.hxfb-hl{display:none!important}}'
  ].join('');
  var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
  if (bottom) d.documentElement.style.setProperty('--hxfb-bottom', bottom);

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/></svg>';
  var btn = d.createElement('button');
  btn.type = 'button'; btn.className = 'hxfb-btn'; btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = ICON + '<span>Feedback</span>';
  btn.setAttribute('aria-label', 'Give feedback on this page');

  function label(el, i) {
    var a = el.getAttribute('data-feedback-label') || el.getAttribute('aria-label');
    if (!a) {
      var h = el.querySelector('h1,h2,h3');
      if (h) { // read the heading as people hear it: without moving words hidden from screen readers
        var c = h.cloneNode(true);
        c.querySelectorAll('[aria-hidden=true]').forEach(function (x) { x.remove(); });
        a = c.textContent;
      }
    }
    a = (a || '').replace(/\s+/g, ' ').trim();
    if (!a && el.tagName === 'FOOTER') a = 'Footer';
    return a ? a.slice(0, 70) : '';
  }
  function sections() {
    var seen = [], out = [];
    d.querySelectorAll(SECTIONS).forEach(function (el, i) {
      if (el.closest('.hxfb-panel') || el.offsetHeight < 40) return;
      var parent = el.parentElement && el.parentElement.closest(SECTIONS);
      if (parent && label(parent) && label(parent) === label(el)) return;
      var l = label(el, i);
      if (!l || seen.indexOf(l) >= 0) return;
      seen.push(l); out.push({ el: el, label: l });
    });
    // Article pages have few blocks: use each heading (with the text under it) as a part of the page.
    if (out.length < 4) {
      var hs = [].slice.call(d.querySelectorAll('main h2, article h2, .entry-content h2, .wp-block-post-content h2'));
      hs.forEach(function (h, i) {
        if (h.closest('.hxfb-panel')) return;
        var l = label({ getAttribute: function () { return null; }, querySelector: function () { return h; }, tagName: 'H2' });
        if (!l || seen.indexOf(l) >= 0) return;
        seen.push(l); out.push({ el: h, label: l, region: true, next: hs[i + 1] || null });
      });
    }
    return out;
  }
  // page-coordinate box of a part: a heading's part runs down to the next heading
  function box(s) {
    var r = s.el.getBoundingClientRect(), top = r.top + window.scrollY, left = r.left + window.scrollX, w = r.width, bottom = r.bottom + window.scrollY;
    if (s.region) {
      var host = s.el.parentElement.getBoundingClientRect();
      left = host.left + window.scrollX; w = host.width;
      bottom = s.next && s.next.parentElement === s.el.parentElement ? s.next.getBoundingClientRect().top + window.scrollY : host.bottom + window.scrollY;
    }
    return { left: left, top: top, width: w, height: Math.max(0, bottom - top) };
  }

  var panel = null, list = [], opened = 0, kind = 'general';
  function build() {
    panel = d.createElement('div');
    panel.className = 'hxfb-panel wp-exclude-emoji'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'hxfb-t');
    panel.innerHTML =
      '<button type="button" class="hxfb-x" aria-label="Close">×</button>' +
      '<h2 id="hxfb-t">Help us improve</h2><p>Tell us what works and what doesn’t. We read every message.</p>' +
      '<form novalidate>' +
      '<label for="hxfb-s">Which part?</label><div class="hxfb-row"><select id="hxfb-s"></select>' +
      '<button type="button" class="hxfb-pick">Tap it</button></div>' +
      '<label>How is it?</label><div class="hxfb-rate" role="group" aria-label="Rating">' +
      '<button type="button" data-r="up" aria-pressed="false">👍 Good</button>' +
      '<button type="button" data-r="down" aria-pressed="false">👎 Needs work</button></div>' +
      '<label for="hxfb-c">What should we improve?</label>' +
      '<textarea id="hxfb-c" maxlength="2000" placeholder="For example: this part is hard to read on my phone"></textarea>' +
      '<label for="hxfb-e">Email <small>(optional, if you’d like a reply)</small></label>' +
      '<input id="hxfb-e" type="email" maxlength="120" autocomplete="email" placeholder="you@example.com">' +
      '<div class="hxfb-hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<button type="submit" class="hxfb-send">Send feedback</button><div class="hxfb-msg" role="status" aria-live="polite"></div>' +
      '</form>';
    d.body.appendChild(panel);
    panel.querySelector('.hxfb-x').addEventListener('click', close);
    panel.querySelector('.hxfb-pick').addEventListener('click', pick);
    panel.querySelectorAll('[data-r]').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        panel.querySelectorAll('[data-r]').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
    panel.querySelector('select').addEventListener('change', function () { highlight(selected()); });
    panel.querySelector('form').addEventListener('submit', send);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  function fill(preset) {
    list = sections();
    var sel = panel.querySelector('select');
    sel.innerHTML = '<option value="">The whole page</option>' + list.map(function (s, i) {
      return '<option value="' + i + '">' + s.label.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }) + '</option>';
    }).join('') + (preset ? '<option value="tool">' + preset.replace(/[&<>"]/g, '') + '</option>' : '');
    if (preset) sel.value = 'tool';
  }
  function selected() { var v = panel.querySelector('select').value; return v === '' || v === 'tool' ? null : (list[+v] || null); }

  function open(opts) {
    opts = opts || {};
    if (!panel) build();
    fill(opts.tool);
    kind = opts.tool ? 'tool' : 'general';
    panel.hidden = false;
    panel.querySelector('.hxfb-msg').textContent = ''; panel.querySelector('.hxfb-msg').className = 'hxfb-msg';
    panel.querySelector('.hxfb-send').disabled = false;
    panel.querySelectorAll('[data-r]').forEach(function (o) { o.setAttribute('aria-pressed', o.getAttribute('data-r') === opts.rating ? 'true' : 'false'); });
    if (opts.section) {
      for (var i = 0; i < list.length; i++) { if (list[i].el === opts.section.el) { panel.querySelector('select').value = String(i); kind = 'section'; break; } }
    }
    opened = Date.now();
    btn.setAttribute('aria-expanded', 'true');
    (opts.rating ? panel.querySelector('textarea') : panel.querySelector('select')).focus();
  }
  function close() {
    if (panel) panel.hidden = true;
    highlight(null); btn.setAttribute('aria-expanded', 'false'); btn.focus();
  }

  var hl = null;
  function highlight(s) {
    if (!s) { if (hl) hl.style.display = 'none'; return; }
    if (!hl) { hl = d.createElement('div'); hl.className = 'hxfb-hl'; d.body.appendChild(hl); }
    var r = box(s);
    hl.style.display = 'block';
    hl.style.left = (r.left - 6) + 'px'; hl.style.top = (r.top - 6) + 'px';
    hl.style.width = (r.width + 12) + 'px'; hl.style.height = (r.height + 12) + 'px';
  }

  // Pick mode: tap a part of the page to choose it.
  function pick() {
    panel.hidden = true;
    list = sections();
    var bar = d.createElement('div'); bar.className = 'hxfb-bar';
    bar.innerHTML = '<span>Tap the part of the page you want to comment on</span><button type="button">Cancel</button>';
    d.body.appendChild(bar); d.body.classList.add('hxfb-picking');
    function at(e) {
      var t = e.target && e.target.closest ? e.target : null, y = e.pageY, x = e.pageX, i, b;
      for (i = list.length - 1; i >= 0; i--) { // headings' parts first: they are the most precise
        if (!list[i].region) continue;
        b = box(list[i]);
        if (y >= b.top && y <= b.top + b.height && x >= b.left && x <= b.left + b.width) return list[i];
      }
      for (i = list.length - 1; i >= 0; i--) { if (!list[i].region && t && list[i].el.contains(t)) return list[i]; }
      return null;
    }
    function move(e) { if (!bar.contains(e.target)) highlight(at(e)); }
    function click(e) {
      if (bar.contains(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      var s = at(e); done();
      open({ section: s });
      if (s) highlight(s);
    }
    function key(e) { if (e.key === 'Escape') { done(); open(); } }
    function done() {
      d.removeEventListener('mousemove', move, true); d.removeEventListener('click', click, true); d.removeEventListener('keydown', key, true);
      d.body.classList.remove('hxfb-picking'); bar.remove(); highlight(null);
    }
    bar.querySelector('button').addEventListener('click', function () { done(); open(); });
    d.addEventListener('mousemove', move, true); d.addEventListener('click', click, true); d.addEventListener('keydown', key, true);
  }

  function send(e) {
    e.preventDefault();
    var msg = panel.querySelector('.hxfb-msg'), b = panel.querySelector('.hxfb-send');
    var rate = panel.querySelector('[data-r][aria-pressed=true]');
    var comment = panel.querySelector('textarea').value.trim();
    if (!rate && !comment) { msg.className = 'hxfb-msg err'; msg.textContent = 'Please pick Good or Needs work, or write a comment.'; return; }
    var sel = panel.querySelector('select'), s = selected();
    var section = sel.value === 'tool' ? sel.options[sel.selectedIndex].text : (s ? s.label : '');
    var body = new URLSearchParams({
      rating: rate ? rate.getAttribute('data-r') : '', comment: comment,
      email: panel.querySelector('input[type=email]').value.trim(), section: section,
      kind: sel.value === 'tool' ? 'tool' : (s ? 'section' : kind === 'tool' ? 'tool' : 'general'),
      page: location.origin + location.pathname, elapsed: String(Date.now() - opened),
      website: panel.querySelector('input[name=website]').value
    });
    b.disabled = true; msg.className = 'hxfb-msg'; msg.textContent = 'Sending…';
    fetch(API, { method: 'POST', body: body, credentials: 'omit', mode: 'cors' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok !== false, j: j }; });
    }).then(function (res) {
      if (!res.ok) throw new Error((res.j && res.j.message) || 'failed');
      msg.className = 'hxfb-msg ok'; msg.textContent = 'Thank you! Your feedback was sent.';
      panel.querySelector('form').reset();
      panel.querySelectorAll('[data-r]').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      setTimeout(function () { if (!panel.hidden) close(); }, 2200);
    }).catch(function (err) {
      b.disabled = false; msg.className = 'hxfb-msg err';
      msg.textContent = err && err.message && err.message !== 'failed' && err.message !== 'Failed to fetch' ? err.message :
        'Sorry, it didn’t send. Please try again in a moment.';
    });
  }

  // "How was the tool?" once per tool, after a successful use.
  function ask(tool) {
    var key = 'hxfb-asked-' + tool;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) { /* private mode: ask anyway */ }
    if (panel && !panel.hidden) return;
    var box = d.createElement('div'); box.className = 'hxfb-ask wp-exclude-emoji'; box.setAttribute('role', 'status');
    box.innerHTML = '<span>How was the ' + tool.replace(/[&<>"]/g, '') + '?</span>' +
      '<button type="button" data-r="up" aria-label="Good">👍</button><button type="button" data-r="down" aria-label="Needs work">👎</button>' +
      '<button type="button" class="hxfb-close" aria-label="Close">×</button>';
    d.body.appendChild(box);
    var timer = setTimeout(function () { box.remove(); }, 15000);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      clearTimeout(timer); box.remove();
      if (b.getAttribute('data-r')) open({ tool: tool, rating: b.getAttribute('data-r') });
    });
  }

  btn.addEventListener('click', function () { if (panel && !panel.hidden) close(); else open(); });
  function start() { d.body.appendChild(btn); }
  if (d.body) start(); else d.addEventListener('DOMContentLoaded', start);
  window.hxFeedback = { open: open, ask: ask };
})();
