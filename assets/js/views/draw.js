'use strict';
/* ---------------- 2D drawings (SVG) ---------------- */
function stripeDefs(list){
  const seen = new Set(); let d = '';
  for (const s of list) {
    if (!s) continue; const id = 'st' + s.join('').replace(/[^a-z0-9]/gi, '');
    if (seen.has(id)) continue; seen.add(id);
    d += `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${s[0]}"/><rect width="3" height="6" fill="${s[1]}"/></pattern>`;
  }
  return d ? `<defs>${d}</defs>` : '';
}
function fillRef(f){ return f.stripe ? `url(#st${f.stripe.join('').replace(/[^a-z0-9]/gi, '')})` : f.fill; }
function layerSVG(p, li, opts = {}){
  const P = R.P, Q = R.Q, L = p.layers[li];
  const m = 3;
  const fills = L.boxes.map(b => boxFill(b, p));
  let s = `<svg viewBox="${-m} ${-m} ${P + 2 * m} ${Q + 2 * m + 7}" width="100%" style="display:block" role="img" aria-label="Layer ${li + 1} of pallet ${esc(p.id)}">${stripeDefs(fills.map(f => f.stripe))}`;
  s += `<rect x="${-m}" y="${-m}" width="${P + 2 * m}" height="${Q + 2 * m}" rx="2" fill="#c9a36a" stroke="#8a6a3a" stroke-width=".6"/>`;
  L.rects.forEach((r, k) => {
    const b = L.boxes[k];
    if (!b) { s += `<rect x="${r.x + .8}" y="${r.y + .8}" width="${r.w - 1.6}" height="${r.h - 1.6}" rx="1" fill="none" stroke="#6b5230" stroke-width=".5" stroke-dasharray="2 1.5"/><text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 1.5}" font-size="${Math.min(r.w, r.h) * .13}" text-anchor="middle" fill="#6b5230">empty</text>`; return; }
    const f = fills[k], info = skuInfo(b.sku);
    s += `<rect x="${r.x + .5}" y="${r.y + .5}" width="${r.w - 1}" height="${r.h - 1}" rx="1.2" fill="${fillRef(f)}" stroke="#1b2330" stroke-width=".45"/>`;
    const mn = Math.min(r.w, r.h), ins = mn * .1;
    s += `<rect x="${r.x + ins}" y="${r.y + ins}" width="${r.w - 2 * ins}" height="${r.h - 2 * ins}" rx="1.5" fill="#fff" fill-opacity=".93"/>`;
    const cx = r.x + r.w / 2, iw = r.w - 2 * ins, ih = r.h - 2 * ins, top = r.y + ins;
    const lines = [];
    if (info.size) lines.push({ t: info.size, f: Math.min(ih * .24, iw * .82 / (info.size.length * .68 + .1)), w: 800, c: '#1b2330' });
    if (info.colour) lines.push({ t: info.colour, f: .1, w: 700, c: '#3a4250' });
    lines.push({ t: info.style, f: .09, w: 400, c: '#56606e' });
    lines.push({ t: fDimsCm(b.L, b.W, b.H), f: .09, w: 700, c: '#1b2330' });
    lines.push({ t: '#' + b.n + (p.ships.length > 1 ? ' ' + shipCode(b.si) : ''), f: .15, w: 800, c: shipColor(b.si) });
    const base = Math.min(ih, iw * 1.4);
    lines.forEach(l => { if (l.f < 1) l.f = Math.min(base * l.f, iw / (Math.max(3, String(l.t).length) * .56)); });
    const tot = lines.reduce((a, l) => a + l.f * 1.18, 0);
    let y = top + (ih - tot) / 2;
    for (const l of lines) { y += l.f * 1.0; s += `<text x="${cx}" y="${y}" font-size="${l.f.toFixed(2)}" font-weight="${l.w}" text-anchor="middle" fill="${l.c}">${esc(l.t)}</text>`; y += l.f * .18; }
    if (Math.abs(b.H - L.h) > 1 && L.orient.upright) s += `<rect x="${r.x + r.w - 15}" y="${r.y + 1}" width="14" height="4.4" rx="1" fill="#1a8a4a"/><text x="${r.x + r.w - 8}" y="${r.y + 4.3}" font-size="3" font-weight="700" fill="#fff" text-anchor="middle">${trimNum(b.H.toFixed(0))} cm</text>`;
  });
  s += `<text x="${P / 2}" y="${Q + m + 5.5}" font-size="4" text-anchor="middle" fill="#5d6878">${esc(fL(P))} side</text></svg>`;
  return s;
}
function containerSVG(C, lay, opts = {}){
  const cont = R.cont, L = cont.L, W = cont.W, fs = lay.fs;
  const mx = 50, my = 34;
  let s = `<svg viewBox="${-mx} ${-my} ${L + 2 * mx} ${W + 2 * my}" width="100%" style="display:block" role="img" aria-label="Option ${fs.no} container ${C.idx + 1} floor plan">`;
  s += `<defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#f5f7fa"/><line x1="0" y1="0" x2="0" y2="10" stroke="#d3d9e1" stroke-width="4"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="${L}" height="${W}" fill="#f5f7fa" stroke="#1b2330" stroke-width="3"/>`;
  s += `<rect x="${L}" y="-6" width="7" height="${W + 12}" fill="#1b2330"/>`;
  s += `<text x="${-mx / 2}" y="${W / 2}" font-size="15" font-weight="800" text-anchor="middle" transform="rotate(-90 ${-mx / 2} ${W / 2})" fill="#1b2330">FRONT</text>`;
  s += `<text x="${L + mx / 2 + 4}" y="${W / 2}" font-size="15" font-weight="800" text-anchor="middle" transform="rotate(90 ${L + mx / 2 + 4} ${W / 2})" fill="#1b2330">DOORS</text>`;
  // lane labels and spare space at the doors
  fs.lanes.forEach(ln => {
    const top = ln.y + ln.across / 2 < W / 2;
    const ly = top ? -10 : W + 22;
    s += `<text x="4" y="${ly}" font-size="13" font-weight="700" fill="#1b2330">Lane ${ln.lane}: ${ln.n} pallets · ${esc(fL(ln.across, 0))} side across · ${esc(fL(ln.along, 0))} along</text>`;
    if (ln.spare > 8) {
      const x0 = ln.n * ln.along;
      s += `<rect x="${x0 + 2}" y="${ln.y + 2}" width="${ln.spare - 4}" height="${ln.across - 4}" fill="url(#hatch)" stroke="#c9d0d9" stroke-dasharray="4 3"/>`;
      s += `<text x="${x0 + ln.spare / 2}" y="${ln.y + ln.across / 2 - 2}" font-size="${Math.min(13, ln.spare / 5)}" text-anchor="middle" fill="#5d6878" font-weight="700">spare</text><text x="${x0 + ln.spare / 2}" y="${ln.y + ln.across / 2 + 13}" font-size="${Math.min(12, ln.spare / 5.5)}" text-anchor="middle" fill="#5d6878">${esc(fL(ln.spare, 0))}</text>`;
    }
  });
  const bySpot = new Map(C.place.map(pl => [pl.spot, pl]));
  fs.spots.forEach(sp => {
    const pl = bySpot.get(sp);
    const lab = `<text x="${sp.x + 9}" y="${sp.y + 17}" font-size="12" font-weight="800" fill="#5d6878">${sp.no}</text>`;
    if (!pl) { s += `<rect x="${sp.x + 3}" y="${sp.y + 3}" width="${sp.w - 6}" height="${sp.d - 6}" rx="6" fill="#fff" stroke="#b9c2cf" stroke-width="1.5" stroke-dasharray="6 4"/>${lab}<text x="${sp.x + sp.w / 2}" y="${sp.y + sp.d / 2 + 5}" font-size="14" text-anchor="middle" fill="#8a94a3">free</text>`; return; }
    const u = pl.u, b = u.bottom, t = u.top;
    s += `<rect x="${sp.x + 3}" y="${sp.y + 3}" width="${sp.w - 6}" height="${sp.d - 6}" rx="6" fill="${shipLight(b.si)}" stroke="${shipColor(b.si)}" stroke-width="2.5"/>${lab}`;
    const cx = sp.x + sp.w / 2, f = Math.min(sp.w * .19, sp.d * .17);
    if (t) {
      s += `<text x="${cx}" y="${sp.y + sp.d * .25}" font-size="${f * .5}" text-anchor="middle" fill="#5d6878">TOP</text>`;
      s += `<text x="${cx}" y="${sp.y + sp.d * .25 + f * 1.05}" font-size="${f}" font-weight="800" text-anchor="middle" fill="${shipColor(t.si)}">${esc(t.id)}</text>`;
      s += `<line x1="${sp.x + 12}" y1="${sp.y + sp.d / 2 + 6}" x2="${sp.x + sp.w - 12}" y2="${sp.y + sp.d / 2 + 6}" stroke="${shipColor(b.si)}" stroke-dasharray="5 4"/>`;
      s += `<text x="${cx}" y="${sp.y + sp.d / 2 + 6 + f * 1.15}" font-size="${f}" font-weight="800" text-anchor="middle" fill="${shipColor(b.si)}">${esc(b.id)}</text>`;
      s += `<text x="${cx}" y="${sp.y + sp.d / 2 + 6 + f * 1.75}" font-size="${f * .5}" text-anchor="middle" fill="#5d6878">BOTTOM · ${esc(fL(u.h, 0))}</text>`;
    } else {
      s += `<text x="${cx}" y="${sp.y + sp.d / 2 + f * .35}" font-size="${f}" font-weight="800" text-anchor="middle" fill="${shipColor(b.si)}">${esc(b.id)}</text>`;
      s += `<text x="${cx}" y="${sp.y + sp.d / 2 + f * .95}" font-size="${f * .5}" text-anchor="middle" fill="#c0262d" font-weight="700">SINGLE · ${esc(fL(u.h, 0))}</text>`;
    }
  });
  return s + '</svg>';
}
function sideSVG(C, lay, lane){
  const cont = R.cont, L = cont.L, H = cont.H;
  const mx = 50, my = 22;
  const places = C.place.filter(pl => pl.spot.lane === lane).sort((a, b) => a.spot.x - b.spot.x);
  let s = `<svg viewBox="${-mx} ${-my} ${L + 2 * mx} ${H + 2 * my + 8}" width="100%" style="display:block" role="img" aria-label="Lane ${lane} side view">`;
  s += `<rect x="0" y="0" width="${L}" height="${H}" fill="#fbfcfd" stroke="#1b2330" stroke-width="3"/>`;
  if (!cont.topLoad) s += `<line x1="${L - 70}" y1="${H - cont.dH}" x2="${L}" y2="${H - cont.dH}" stroke="#c0262d" stroke-width="2" stroke-dasharray="6 4"/><text x="${L - 74}" y="${H - cont.dH + 4}" font-size="13" text-anchor="end" fill="#c0262d">door ${esc(fL(cont.dH, 0))}</text>`;
  s += `<text x="${-8}" y="${14}" font-size="13" text-anchor="end" fill="#5d6878">${esc(fL(H, 0))}</text>`;
  s += `<text x="6" y="${-7}" font-size="14" font-weight="800" fill="#1b2330">Lane ${lane} side view</text>`;
  for (const pl of places) {
    const u = pl.u, x = pl.spot.x, w = pl.spot.w; let y = H;
    for (const p of [u.bottom, u.top]) {
      if (!p) continue;
      const ph = p.height;
      s += `<rect x="${x + 3}" y="${y - S.pallet.H}" width="${w - 6}" height="${S.pallet.H}" fill="#b58a52"/>`;
      s += `<rect x="${x + 3}" y="${y - ph}" width="${w - 6}" height="${ph - S.pallet.H}" fill="${shipLight(p.si)}" stroke="${shipColor(p.si)}" stroke-width="2"/>`;
      s += `<text x="${x + w / 2}" y="${y - ph / 2 + 6}" font-size="${Math.min(17, w / 5.5)}" font-weight="800" text-anchor="middle" fill="${shipColor(p.si)}">${esc(p.id)}</text>`;
      y -= ph;
    }
    s += `<text x="${x + w / 2}" y="${y - 5}" font-size="12" text-anchor="middle" fill="#1b2330">${esc(fL(u.h, 0))}</text>`;
  }
  return s + '</svg>';
}

/* ---------------- floor-loaded cartons ---------------- */
function looseTopSVG(C){
  const cont = R.cont, L = cont.L, W = cont.W, mx = 50, my = 30;
  let s = `<svg viewBox="${-mx} ${-my} ${L + 2 * mx} ${W + 2 * my}" width="100%" style="display:block" role="img" aria-label="Container ${C.idx + 1} floor plan, floor-loaded">`;
  s += `<rect x="0" y="0" width="${L}" height="${W}" fill="#f5f7fa" stroke="#1b2330" stroke-width="3"/><rect x="${L}" y="-6" width="7" height="${W + 12}" fill="#1b2330"/>`;
  s += `<text x="${-mx / 2}" y="${W / 2}" font-size="15" font-weight="800" text-anchor="middle" transform="rotate(-90 ${-mx / 2} ${W / 2})" fill="#1b2330">FRONT</text>`;
  s += `<text x="${L + mx / 2 + 4}" y="${W / 2}" font-size="15" font-weight="800" text-anchor="middle" transform="rotate(90 ${L + mx / 2 + 4} ${W / 2})" fill="#1b2330">DOORS</text>`;
  for (const w of C.walls) {
    const off = (W - w.nx * w.w) / 2;
    s += `<rect x="${w.x + 1}" y="${off}" width="${w.d - 2}" height="${w.nx * w.w}" fill="${shipLight(w.si)}" stroke="${shipColor(w.si)}" stroke-width="1.5"/>`;
    for (let i = 1; i < w.nx; i++) s += `<line x1="${w.x + 1}" x2="${w.x + w.d - 1}" y1="${off + i * w.w}" y2="${off + i * w.w}" stroke="${shipColor(w.si)}" stroke-opacity=".35"/>`;
    const f = Math.min(13, w.d * .36);
    s += `<text x="${w.x + w.d / 2}" y="${W / 2 - 2}" font-size="${f}" font-weight="800" text-anchor="middle" fill="${shipColor(w.si)}">${w.no}</text>`;
    s += `<text x="${w.x + w.d / 2}" y="${W / 2 + f}" font-size="${f * .75}" text-anchor="middle" fill="#5d6878">${w.boxes.length}</text>`;
  }
  if (C.len < L - 8) s += `<text x="${(C.len + L) / 2}" y="${W / 2 + 5}" font-size="15" text-anchor="middle" fill="#8a94a3">free ${esc(fL(L - C.len, 0))}</text>`;
  return s + '</svg>';
}
function looseSideSVG(C){
  const cont = R.cont, L = cont.L, H = cont.H, mx = 50, my = 22;
  let s = `<svg viewBox="${-mx} ${-my} ${L + 2 * mx} ${H + 2 * my}" width="100%" style="display:block" role="img" aria-label="Container ${C.idx + 1} side view, floor-loaded">`;
  s += `<rect x="0" y="0" width="${L}" height="${H}" fill="#fbfcfd" stroke="#1b2330" stroke-width="3"/>`;
  s += `<text x="6" y="-7" font-size="14" font-weight="800" fill="#1b2330">Side view (walls of cartons, front to doors)</text>`;
  const Hl = R.looseP.Hl;
  s += `<line x1="0" x2="${L}" y1="${H - Hl}" y2="${H - Hl}" stroke="#c0262d" stroke-dasharray="6 4"/>`;
  for (const w of C.walls) {
    const rows = Math.ceil(w.boxes.length / w.nx);
    for (let r = 0; r < rows; r++) {
      const full = r < rows - 1 || w.boxes.length % w.nx === 0;
      s += `<rect x="${w.x + 1}" y="${H - (r + 1) * w.h}" width="${w.d - 2}" height="${w.h}" fill="${full ? shipLight(w.si) : '#fff'}" stroke="${shipColor(w.si)}" stroke-width="1.2"/>`;
    }
  }
  return s + '</svg>';
}

/* ---------------- ULD drawings ---------------- */
function uldTopSVG(u, plan){
  const U = plan.U, L = U.L, W = U.W, m = 22;
  const wing = Math.max(0, -Math.min(...U.cl.map(p => p[1])), -Math.min(...U.cr.map(p => p[1])));
  let s = `<svg viewBox="${-m} ${-m - wing} ${L + 2 * m} ${W + 2 * m + 2 * wing}" width="100%" style="display:block;margin:0 auto;max-width:${Math.min(100, (L + 2 * m) / 3.4).toFixed(0)}%" role="img" aria-label="${esc(U.code)} ${u.idx + 1} top view">`;
  if (wing) s += `<rect x="0" y="${-wing}" width="${L}" height="${W + 2 * wing}" fill="none" stroke="#7fa7d9" stroke-dasharray="5 4"/>`;
  s += `<rect x="0" y="0" width="${L}" height="${W}" rx="3" fill="#dfe4ea" stroke="#5d6878" stroke-width="2"/>`;
  if (plan.edge) s += `<rect x="${plan.edge}" y="${plan.edge}" width="${L - 2 * plan.edge}" height="${W - 2 * plan.edge}" fill="none" stroke="#9aa6b5" stroke-dasharray="3 3"/>`;
  const by = new Map(u.place.map(pl => [pl.spot, pl]));
  for (const sp of plan.spots) {
    const pl = by.get(sp), f = Math.min(sp.w, sp.h) * .17;
    if (!pl) { s += `<rect x="${sp.x + 2}" y="${sp.y + 2}" width="${sp.w - 4}" height="${sp.h - 4}" rx="4" fill="#fff" stroke="#b9c2cf" stroke-dasharray="5 4"/><text x="${sp.x + sp.w / 2}" y="${sp.y + sp.h / 2}" font-size="${f * .7}" text-anchor="middle" fill="#8a94a3">free</text><text x="${sp.x + sp.w / 2}" y="${sp.y + sp.h / 2 + f * .8}" font-size="${f * .5}" text-anchor="middle" fill="#8a94a3">max ${esc(fL(sp.allow, 0))}</text>`; continue; }
    const p = pl.p, c = pl.over ? '#e5484d' : shipColor(p.si);
    s += `<rect x="${sp.x + 2}" y="${sp.y + 2}" width="${sp.w - 4}" height="${sp.h - 4}" rx="4" fill="${pl.over ? '#fde8e8' : shipLight(p.si)}" stroke="${c}" stroke-width="2.5"/>`;
    s += `<text x="${sp.x + 8}" y="${sp.y + 16}" font-size="11" font-weight="800" fill="#5d6878">${sp.no}</text>`;
    s += `<text x="${sp.x + sp.w / 2}" y="${sp.y + sp.h / 2 + f * .3}" font-size="${f}" font-weight="800" text-anchor="middle" fill="${c}">${esc(p.id)}</text>`;
    s += `<text x="${sp.x + sp.w / 2}" y="${sp.y + sp.h / 2 + f * 1}" font-size="${f * .5}" text-anchor="middle" fill="#5d6878">${esc(fL(p.height, 0))} · max ${esc(fL(sp.allow, 0))}</text>`;
  }
  return s + '</svg>';
}
function uldFrontSVG(u, plan){
  const U = plan.U, W = U.W, H = U.H, m = 26;
  const lo = Math.min(0, ...U.cl.map(p => p[1])), ro = Math.min(0, ...U.cr.map(p => p[1]));
  const x0 = lo - m, x1 = W - ro + m;
  let s = `<svg viewBox="${x0} ${-m} ${x1 - x0} ${H + 2 * m + 6}" width="100%" style="display:block" role="img" aria-label="${esc(U.code)} contour, end view">`;
  const pts = [...U.cl.map(([z, i]) => [i, H - z]), ...U.cr.map(([z, i]) => [W - i, H - z]).reverse()];
  s += `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="#eaf1fb" stroke="#1d4f91" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<line x1="${lo}" x2="${W - ro}" y1="${H}" y2="${H}" stroke="#5d6878" stroke-width="4"/>`;
  for (const pl of u.place) {
    const sp = pl.spot, p = pl.p, c = pl.over ? '#e5484d' : shipColor(p.si);
    s += `<rect x="${sp.y + 1}" y="${H - p.height}" width="${sp.h - 2}" height="${p.height}" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="1.5"/>`;
  }
  s += `<text x="${(x0 + x1) / 2}" y="${H + 20}" font-size="${Math.min(12, (x1 - x0) / 26).toFixed(1)}" text-anchor="middle" fill="#5d6878">${esc(fL(W, 0))} base, ${esc(fL(H, 0))} high</text>`;
  return s + '</svg>';
}

/* ---------------- fill and balance ---------------- */
function statsHTML(st){
  const pct = x => Math.round(x * 100) + '%';
  const cog = Math.round(st.cog * 100), bad = st.floor >= .6 && (st.cog < .38 || st.cog > .62);
  return `<div class="stats">
    <div class="meter"><span>Volume used</span><b>${pct(st.vol)}</b><i style="--v:${Math.min(100, st.vol * 100)}%"></i></div>
    <div class="meter"><span>Floor used</span><b>${pct(st.floor)}</b><i style="--v:${Math.min(100, st.floor * 100)}%"></i></div>
    <div class="meter ${st.wt > 1 ? 'bad' : ''}"><span>Payload used</span><b>${pct(st.wt)}</b><i style="--v:${Math.min(100, st.wt * 100)}%"></i></div>
    <div class="cog ${bad ? 'bad' : ''}" title="Weight centre along the length. Aim for 40 to 60%."><span>Weight centre <b>${cog}%</b> from the front</span><div class="cogbar"><em></em><u style="left:${Math.max(0, Math.min(100, cog))}%"></u></div><small><span>front</span><span>doors</span></small></div>
  </div>`;
}
