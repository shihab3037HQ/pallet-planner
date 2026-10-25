'use strict';
/* ---------------- helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const byAscii = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const trimNum = s => s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
function lenVal(cm, d){ const v = S.units === 'in' ? cm / IN : cm; return trimNum(v.toFixed(d ?? (S.units === 'in' ? 2 : 1))); }
function fL(cm, d = 1){ return lenVal(cm, d) + (S.units === 'in' ? ' in' : ' cm'); }
function fDims(a, b, c){ return [a, b, c].map(x => lenVal(x, 1)).join(' x ') + (S.units === 'in' ? ' in' : ' cm'); }
function fDimsCm(a, b, c){ return [a, b, c].map(x => trimNum(x.toFixed(0))).join(' x ') + ' cm'; }
function wtVal(kg, d){ const v = S.wunits === 'lb' ? kg / LB : kg; return trimNum(v.toFixed(d ?? 1)); }
function fW(kg){ const v = S.wunits === 'lb' ? kg / LB : kg; return Math.round(v).toLocaleString('en-US') + (S.wunits === 'lb' ? ' lb' : ' kg'); }
const Lu = () => (S.units === 'in' ? 'in' : 'cm');
const Wu = () => (S.wunits === 'lb' ? 'lb' : 'kg');
function toCm(v){ return S.units === 'in' ? v * IN : v; }
function toKg(v){ return S.wunits === 'lb' ? v * LB : v; }
function getPath(o, p){ return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v){ const ks = p.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) a = a[ks[i]]; a[ks[ks.length - 1]] = v; }
function runs(ns){
  if (!ns.length) return '';
  ns = ns.slice().sort((a, b) => a - b); const out = []; let s = ns[0], p = s;
  for (const n of ns.slice(1)) { if (n === p + 1) { p = n; continue; } out.push(s === p ? `${s}` : `${s}-${p}`); s = p = n; }
  out.push(s === p ? `${s}` : `${s}-${p}`); return out.join(', ');
}
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }
function shipCode(i){ return String.fromCharCode(65 + (i % 26)); }
function shipColor(i){ return SHIP_COLORS[i % SHIP_COLORS.length]; }
function shipLight(i){ return SHIP_LIGHT[i % SHIP_LIGHT.length]; }

/* ---------------- SKU parsing ---------------- */
const SIZE_RE = /^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|XXXXL|[2-6]XL|OS|OSFA|ONESIZE|\d{1,3}(\.\d)?|\d{1,2}[-/]\d{1,2}[A-Z]?|\d{1,2}(M|Y|T))$/i;
const skuCache = new Map();
function skuInfo(sku){
  if (skuCache.has(sku)) return skuCache.get(sku);
  const toks = String(sku).split(/[_\-\s\/]+/).filter(Boolean);
  let size = '';
  if (toks.length > 1 && SIZE_RE.test(toks[toks.length - 1])) size = toks[toks.length - 1].toUpperCase();
  const style = toks[0] || String(sku);
  let colour = '', fill = null, stripe = null;
  const cand = toks.slice(1, size ? -1 : undefined);
  for (let i = cand.length - 1; i >= 0 && !fill; i--) {
    const raw = cand[i];
    const norm = raw.toLowerCase().replace(/[^a-z&]/g, '');
    if (norm.includes('&') || norm.includes('stripe')) {
      const parts = norm.replace(/stripes?/g, '').split('&').filter(Boolean).map(p => COLORS[p]).filter(Boolean);
      if (parts.length) { fill = parts[0]; stripe = parts.length > 1 ? parts.slice(0, 2) : [parts[0], '#ffffff']; colour = raw; }
    } else if (COLORS[norm]) { fill = COLORS[norm]; colour = raw; }
  }
  if (!fill) {
    let h = 0; const base = cand.join('_') || style; for (const c of base) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    fill = `hsl(${h % 360}, 45%, 62%)`; colour = cand.join(' ') || '';
  }
  const info = { size, style, colour: colour.replace(/&/g, ' & '), fill, stripe };
  skuCache.set(sku, info); return info;
}
function boxFill(b, p){
  if (S.colorBy === 'size') return { fill: SIZE_COLORS[b.size.idx % SIZE_COLORS.length], stripe: null };
  if (S.colorBy === 'pallet' && p) return { fill: PALLET_COLORS[(p.gi || 0) % PALLET_COLORS.length], stripe: null };
  if (S.colorBy === 'shipment') return { fill: shipColor(b.si), stripe: null };
  const i = skuInfo(b.sku); return { fill: i.fill, stripe: i.stripe };
}
function hexLum(c){
  if (!c || c[0] !== '#') return 0.6;
  const n = parseInt(c.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
