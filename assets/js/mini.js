// Small moving scenes for the guide, learn and 404 pages: <div class="mini" data-mini="pallet"></div>.
// The look and the animations live in site.css (.ms-*). Also the chargeable weight calculator
// (<div data-calc="chargeable">) on learn/air-freight-chargeable-weight.
(function () {
  var R = function (n, f) { var s = ''; for (var i = 0; i < n; i++) s += f(i); return s; };
  var T = function (x, y, t, c) { return '<text x="' + x + '" y="' + y + '" class="ms-t' + (c ? ' ' + c : '') + '">' + t + '</text>'; };
  var SCENES = {
    pallet: function () {
      return '<line x1="58" y1="22" x2="182" y2="22" class="ms-limit"/>' + T(186, 25, '52 IN') +
        R(12, function (n) { var r = Math.floor(n / 4), c = n % 4; return '<rect class="ms-box ms-b' + n + '" x="' + (70 + c * 25) + '" y="' + (80 - r * 19) + '" width="23" height="17" rx="2"/>'; }) +
        '<rect class="ms-box ms-b12" x="70" y="23" width="23" height="17" rx="2"/><rect class="ms-box ms-b13" x="95" y="23" width="23" height="17" rx="2"/>' +
        '<rect x="64" y="98" width="112" height="8" rx="2" class="ms-wood"/>' + T(20, 116, 'FULL LAYERS · NO OVERHANG');
    },
    sea: function () {
      return '<rect x="16" y="28" width="208" height="70" rx="4" class="ms-shell"/><path d="M206 28v70M214 28v70" class="ms-door"/>' +
        R(6, function (i) { return '<g class="ms-slide ms-s' + i + '"><rect x="' + (22 + i * 30) + '" y="48" width="27" height="44" rx="2" class="ms-load"/><rect x="' + (22 + i * 30) + '" y="92" width="27" height="5" class="ms-wood"/></g>'; }) +
        T(16, 116, 'FRONT WALL → DOORS');
    },
    air: function () {
      return '<path d="M40 100V52L70 26H170L200 52V100Z" class="ms-contour"/>' +
        '<rect x="52" y="62" width="30" height="36" rx="2" class="ms-load"/><rect x="86" y="36" width="34" height="62" rx="2" class="ms-load ms-alt"/>' +
        '<rect x="124" y="36" width="34" height="62" rx="2" class="ms-load"/><rect x="162" y="62" width="28" height="36" rx="2" class="ms-load ms-alt"/>' +
        '<rect x="162" y="38" width="28" height="22" rx="2" class="ms-over"/><rect x="34" y="98" width="172" height="6" class="ms-wood"/>' + T(20, 116, 'OUTSIDE THE CONTOUR SHOWS RED');
    },
    loose: function () {
      return '<rect x="16" y="28" width="208" height="70" rx="4" class="ms-shell"/>' +
        R(8, function (c) { return '<g class="ms-wall ms-w' + c + '">' + R(4, function (r) { return '<rect x="' + (22 + c * 24) + '" y="' + (80 - r * 16) + '" width="22" height="14" rx="2" class="ms-box2"/>'; }) + '</g>'; }) +
        T(16, 116, 'WALL BY WALL, WITH BOX NUMBERS');
    },
    compare: function () {
      return T(18, 38, 'SEA') + '<rect x="54" y="28" width="150" height="14" rx="7" class="ms-track"/><rect x="54" y="28" width="150" height="14" rx="7" class="ms-bar ms-sea"/>' +
        T(18, 74, 'AIR') + '<rect x="54" y="64" width="150" height="14" rx="7" class="ms-track"/><rect x="54" y="64" width="150" height="14" rx="7" class="ms-bar ms-air"/>' +
        T(20, 104, 'SAME BOXES · BOTH WAYS · YOUR RATES');
    },
    print: function () {
      return '<rect x="78" y="40" width="84" height="34" rx="6" class="ms-printer"/><g class="ms-sheet"><rect x="92" y="60" width="56" height="44" rx="2" class="ms-paper"/><path d="M100 72h40M100 80h32M100 88h36" class="ms-lines"/></g>' +
        '<rect x="78" y="40" width="84" height="22" rx="6" class="ms-printer"/><rect x="172" y="22" width="52" height="18" rx="9" class="ms-link"/>' + T(181, 34, 'LINK', 'ms-tw') + T(20, 116, 'PDF · EXCEL · SHARE LINK');
    },
    import: function () {
      return '<rect x="18" y="22" width="86" height="76" rx="6" class="ms-paper"/>' +
        R(5, function (i) { return '<rect x="26" y="' + (32 + i * 13) + '" width="' + (70 - (i % 2) * 14) + '" height="6" rx="3" class="ms-row ms-b' + i + '"/>'; }) +
        '<path d="M112 60h20m-6-6 6 6-6 6" class="ms-arrow"/>' +
        R(6, function (n) { var c = n % 3, r = Math.floor(n / 3); return '<g class="ms-box ms-b' + (n + 5) + '"><rect x="' + (142 + c * 28) + '" y="' + (44 + r * 26) + '" width="25" height="23" rx="2" class="ms-num"/>' + T(148 + c * 28, 59 + r * 26, String(n + 1), 'ms-tw') + '</g>'; }) +
        T(18, 116, 'YOUR BOX FILE → NUMBERED BOXES');
    }
  };
  document.querySelectorAll('[data-mini]').forEach(function (el) {
    var f = SCENES[el.dataset.mini]; if (!f) return;
    el.innerHTML = '<svg viewBox="0 0 240 120" aria-hidden="true">' + f() + '</svg>';
  });

  // Air freight chargeable weight: the higher of the real weight and the volume weight.
  document.querySelectorAll('[data-calc="chargeable"]').forEach(function (box) {
    var q = function (n) { return box.querySelector('[name="' + n + '"]'); };
    function run() {
      var l = +q('l').value, w = +q('w').value, h = +q('h').value, kg = +q('kg').value, n = Math.max(1, +q('n').value || 1), d = +q('d').value;
      var vol = l * w * h * n / d, real = kg * n, charge = Math.max(vol, real);
      box.querySelector('[data-out="vol"]').textContent = vol.toFixed(1) + ' kg';
      box.querySelector('[data-out="real"]').textContent = real.toFixed(1) + ' kg';
      box.querySelector('[data-out="charge"]').textContent = charge.toFixed(1) + ' kg';
      box.querySelector('[data-out="why"]').textContent = vol > real ? 'Volume weight is higher, so you pay for space.' : 'Real weight is higher, so you pay for weight.';
      var t = Math.max(vol, real) || 1;
      box.querySelector('[data-bar="vol"]').style.width = (vol / t * 100).toFixed(1) + '%';
      box.querySelector('[data-bar="real"]').style.width = (real / t * 100).toFixed(1) + '%';
    }
    box.addEventListener('input', run); run();
  });
})();
