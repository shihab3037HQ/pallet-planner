'use strict';
/* ---------------- persistence ---------------- */
// v2 keeps its own key. On the first visit it picks up a project saved by v1 in this browser.
const LS_KEY = 'pallet-planner-v2', LS_KEY_V1 = 'pallet-planner-v1';
function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
function saveLocal(){ lsSet(LS_KEY, JSON.stringify(S)); }
function loadLocal(){
  for (const k of [LS_KEY, LS_KEY_V1]) {
    const s = lsGet(k);
    if (s) { try { return normalize(JSON.parse(s)); } catch (e) {} }
  }
  return null;
}
function normalize(o){
  const d = defaultState();
  const air = { ...d.air, ...(o.air || {}) };
  // v1 projects pick an aircraft; map it to the matching ULD and keep the height limit
  if (!(o.air && o.air.uld) && o.air && o.air.craft) air.uld = (AIRCRAFT[o.air.craft] || AIRCRAFT.lower).uld;
  delete air.craft;
  if (!ULDS[air.uld]) air.uld = 'PMC_LD';
  const out = { ...d, ...o, v: 2, pallet: { ...d.pallet, ...(o.pallet || {}) }, rules: { ...d.rules, ...(o.rules || {}) }, sea: { ...d.sea, ...(o.sea || {}) }, air, cost: { ...d.cost, ...(o.cost || {}) } };
  out.shipments = (o.shipments || []).map(s => ({ uid: s.uid || uid(), name: s.name || '', sid: s.sid || '', labels: s.labels ?? '', lines: (s.lines || []).map(l => ({ sku: l.sku || '', upb: +l.upb || 0, boxes: +l.boxes || 0, L: +l.L || 0, W: +l.W || 0, H: +l.H || 0, wt: +l.wt || 0 })) }));
  if (!CONTAINERS[out.sea.type]) out.sea.type = '40HC';
  if (!PATTERNS[out.sea.pattern]) out.sea.pattern = 'lanes';
  if (!['pallets', 'loose'].includes(out.sea.load)) out.sea.load = 'pallets';
  if (!PALLETS[out.pallet.preset]) out.pallet.preset = 'CUSTOM';
  if (!['product', 'size', 'shipment', 'pallet'].includes(out.colorBy)) out.colorBy = 'product';
  return out;
}
function loadExample(){
  const units = S.units, wunits = S.wunits;
  S = defaultState();
  S.units = units; S.wunits = wunits;
  S.name = 'Demo project';
  S.shipments = EXAMPLE.map(e => ({ uid: uid(), name: e.name, sid: e.shipmentId, labels: e.labelPallets, lines: e.lines.map(l => ({ sku: l[0], upb: l[1], boxes: l[2], L: l[3] * IN, W: l[4] * IN, H: l[5] * IN, wt: l[6] * LB })) }));
  ui.tab = 'plan'; ui.pallet = null; ui.cont3d = null; ui.uld3d = null;
  changed(true);
}
