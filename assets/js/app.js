'use strict';
/* ---------------- modal, theme ---------------- */
function openModal(html){ const d = $('#modal'); $('#modalBody').innerHTML = html; if (!d.open) d.showModal(); }
function closeModal(){ const d = $('#modal'); if (d.open) d.close(); }
function applyTheme(){
  const t = lsGet('pp-theme') || 'auto';
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  const b = $('[data-act="theme"]'); if (b) { b.dataset.mode = t; b.title = 'Theme: ' + t; b.setAttribute('aria-label', 'Theme: ' + t); }
  theme3D && T.scene && theme3D();
}
function askUnits(){
  openModal(`<h2>Which units do you work in?</h2>
    <p class="note">You can switch any time in the sidebar. Amazon US files use inches and pounds.</p>
    <div class="unitpick"><button class="btn" data-act="pickUnits" data-v="in">Inches &amp; pounds<small>US</small></button><button class="btn" data-act="pickUnits" data-v="cm">Centimetres &amp; kilograms<small>Metric</small></button></div>`);
}

/* ---------------- events ---------------- */
let saveT = null;
function changed(full){
  R = compute();
  if (full !== false) renderSide();
  render();
  clearTimeout(saveT); saveT = setTimeout(saveLocal, 300);
}
document.addEventListener('click', e => {
  const cmp = e.target.closest('[data-cmp]');
  if (cmp) { const [k, pat] = cmp.dataset.cmp.split('|'); S.sea.type = k; S.sea.pattern = pat; ui.cont3d = null; changed(true); toast('Now using ' + CONTAINERS[k].name + ', Option ' + PATTERNS[pat].no); return; }
  const uldRow = e.target.closest('[data-uld]');
  if (uldRow) { const k = uldRow.dataset.uld; S.air.uld = k; if (ULDS[k].H) S.air.H = ULDS[k].H; ui.uld3d = null; changed(true); toast('Now using ' + ULDS[k].name); return; }
  const t = e.target.closest('button, [data-pallet]'); if (!t) return;
  if (t.dataset.tab) { ui.tab = t.dataset.tab; render(); return; }
  if (t.dataset.pallet) { ui.pallet = t.dataset.pallet; ui.tab = 'pallets'; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  if (t.dataset.view3d) { setView(t.dataset.view3d); return; }
  const useg = t.closest('[data-uiseg]');
  if (useg && t.dataset.v) { ui[useg.dataset.uiseg] = t.dataset.v; ui.cont3d = null; render(); return; }
  const seg = t.closest('[data-seg]');
  if (seg && t.dataset.v) { setPath(S, seg.dataset.seg, t.dataset.v); ui.cont3d = null; changed(true); return; }
  const act = t.dataset.act; if (!act) return;
  const si = t.dataset.si != null ? +t.dataset.si : null;
  switch (act) {
    case 'example': loadExample(); break;
    case 'new': if (confirm('Start a new empty project? Save the current one first if you need it.')) { const u = S.units, w = S.wunits; S = defaultState(); S.units = u; S.wunits = w; ui.tab = 'shipments'; ui.pallet = null; ui.cont3d = null; ui.uld3d = null; changed(true); } break;
    case 'open': $('#fileProject').click(); break;
    case 'save': download(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), (S.name || 'pallet-plan').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') + '.json'); break;
    case 'excel': exportExcel(); break;
    case 'print': printDoc(); break;
    case 'share': shareLink(); break;
    case 'copyShare': { const i = $('#shareUrl'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(() => toast('Link copied'), () => { document.execCommand('copy'); toast('Link copied'); }); break; }
    case 'closeModal': closeModal(); break;
    case 'pickUnits': { const v = t.dataset.v; S.units = v; S.wunits = v === 'in' ? 'lb' : 'kg'; lsSet('pp-units', v); closeModal(); changed(true); break; }
    case 'theme': { const order = ['auto', 'light', 'dark'], cur = lsGet('pp-theme') || 'auto'; lsSet('pp-theme', order[(order.indexOf(cur) + 1) % 3]); applyTheme(); toast('Theme: ' + (lsGet('pp-theme') || 'auto')); break; }
    case 'menu': $('#side').classList.toggle('open'); t.setAttribute('aria-expanded', $('#side').classList.contains('open')); break;
    case 'mode': S.mode = t.dataset.v; changed(true); break;
    case 'png': export3D(); break;
    case 'play3d': togglePlay(); break;
    case 'addShip': S.shipments.push({ uid: uid(), name: 'Shipment ' + shipCode(S.shipments.length), sid: '', labels: '', lines: [{ sku: 'SKU-1', upb: 1, boxes: 1, L: 50, W: 40, H: 30, wt: 10 }] }); changed(true); break;
    case 'importNew': ui.importTarget = null; $('#fileImport').click(); break;
    case 'importInto': ui.importTarget = si; $('#fileImport').click(); break;
    case 'delShip': if (confirm('Delete this shipment?')) { S.shipments.splice(si, 1); changed(true); } break;
    case 'addLine': { const ls = S.shipments[si].lines; const last = ls[ls.length - 1] || { L: 50, W: 40, H: 30, wt: 10, upb: 1 }; ls.push({ sku: '', upb: last.upb, boxes: 1, L: last.L, W: last.W, H: last.H, wt: last.wt }); changed(false); break; }
    case 'delLine': S.shipments[si].lines.splice(+t.dataset.li, 1); changed(false); break;
    case 'show3dCont': { const k3 = t.dataset.k3; ui.cont3d = ui.cont3d === k3 ? null : k3; T.key = null; render(); if (ui.cont3d) $('#v3dCont')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); break; }
    case 'show3dUld': { const k3 = t.dataset.k3; ui.uld3d = ui.uld3d === k3 ? null : k3; T.key = null; render(); if (ui.uld3d) $('#v3dUld')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); break; }
    case 'usePattern': S.sea.pattern = t.dataset.pat; changed(true); break;
  }
});
document.addEventListener('input', e => { if (e.target.id === 'step3d') { stopPlay(); setStep(+e.target.value); } });
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'step3d' || el.id === 'print3d') return;
  if (el.id === 'fileProject') { const f = el.files[0]; el.value = ''; if (!f) return; const fr = new FileReader(); fr.onload = ev => { try { S = normalize(JSON.parse(ev.target.result)); ui.pallet = null; ui.cont3d = null; ui.uld3d = null; ui.tab = 'plan'; changed(true); toast('Project opened'); } catch (err) { toast('That is not a planner project file'); } }; fr.readAsText(f); return; }
  if (el.id === 'fileImport') { const f = el.files[0]; el.value = ''; if (f) importFile(f, ui.importTarget); return; }
  if (el.id === 'projName') { S.name = el.value; saveLocal(); return; }
  if (el.dataset.k) {
    const k = el.dataset.k, t = el.dataset.t;
    let v;
    if (t === 'bool') v = el.checked;
    else if (t === 'len') v = toCm(parseFloat(el.value) || 0);
    else if (t === 'wt') v = toKg(parseFloat(el.value) || 0);
    else if (t === 'num') v = parseFloat(el.value) || 0;
    else v = el.value;
    if (t === 'preset') { S.pallet.preset = v; if (PALLETS[v].L) { S.pallet.L = PALLETS[v].L; S.pallet.W = PALLETS[v].W; } changed(true); return; }
    if (t === 'uld') { S.air.uld = v; if (ULDS[v].H) S.air.H = ULDS[v].H; ui.uld3d = null; changed(true); return; }
    if (t === 'divisor') { if (v === 'custom') { ui.divCustom = true; renderSide(); return; } ui.divCustom = false; S.air.divisor = +v; changed(true); return; }
    if (k === 'sea.type') { ui.cont3d = null; }
    setPath(S, k, v);
    changed(true); return;
  }
  if (el.dataset.sh != null) {
    const sh = S.shipments[+el.dataset.sh], f = el.dataset.f;
    if (el.dataset.li != null) {
      const l = sh.lines[+el.dataset.li];
      if (f === 'sku') l.sku = el.value.trim();
      else if (['L', 'W', 'H'].includes(f)) l[f] = toCm(parseFloat(el.value) || 0);
      else if (f === 'wt') l.wt = toKg(parseFloat(el.value) || 0);
      else l[f] = parseFloat(el.value) || 0;
    } else sh[f] = f === 'labels' ? (el.value === '' ? '' : Math.max(0, Math.round(+el.value))) : el.value;
    changed(false);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { stopPlay(); } });
// three.js arrives as a module after the first render; draw the 3D view once it is ready
window.addEventListener('three-ready', () => { if (['container', 'air', 'pallets'].includes(ui.tab)) render(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme());
window.addEventListener('hashchange', () => readSharedLink());

/* ---------------- boot ---------------- */
(function boot(){
  applyTheme();
  const shared = /^#p=/.test(location.hash);
  const saved = loadLocal();
  if (saved && saved.shipments && saved.shipments.length) { S = saved; ui.tab = 'plan'; changed(true); }
  else {
    const u = lsGet('pp-units');
    if (u) { S.units = u; S.wunits = u === 'in' ? 'lb' : 'kg'; }
    if (EXAMPLE.length) loadExample(); else changed(true);
    if (!u && !shared && !saved) askUnits();
  }
  if (shared) readSharedLink();
})();
