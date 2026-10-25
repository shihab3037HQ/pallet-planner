'use strict';
/* ---------------- layer pattern ---------------- */
function layerPattern(a, b, P, Q){
  // box footprint a x b (either way round), pallet P (x) by Q (y). No overhang.
  const grid = (x0, y0, W, H, w, h) => {
    const nx = Math.floor((W + E) / w), ny = Math.floor((H + E) / h), r = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) r.push({ x: x0 + i * w, y: y0 + j * h, w, h });
    return r;
  };
  let best = [];
  const consider = r => { if (r.length > best.length) best = r; };
  for (const [w, h] of [[a, b], [b, a]]) consider(grid(0, 0, P, Q, w, h));
  for (const [w, h] of [[a, b], [b, a]]) {
    const kx = Math.floor((P + E) / w);
    for (let k = 1; k < kx; k++) consider(grid(0, 0, k * w, Q, w, h).concat(grid(k * w, 0, P - k * w, Q, h, w)));
    const ky = Math.floor((Q + E) / h);
    for (let k = 1; k < ky; k++) consider(grid(0, 0, P, k * h, w, h).concat(grid(0, k * h, P, Q - k * h, h, w)));
  }
  if (best.length) {
    const mx = Math.max(...best.map(r => r.x + r.w)), my = Math.max(...best.map(r => r.y + r.h));
    const ox = (P - mx) / 2, oy = (Q - my) / 2;
    best = best.map(r => ({ x: r.x + ox, y: r.y + oy, w: r.w, h: r.h }));
    // order: row by row, left to right (for readable numbering)
    best.sort((p, q) => (Math.abs(p.y - q.y) > 1 ? p.y - q.y : p.x - q.x));
  }
  return best;
}

/* ---------------- planner ---------------- */
function sizeKey(l){ const a = Math.max(l.L, l.W), b = Math.min(l.L, l.W); return `${a.toFixed(1)}x${b.toFixed(1)}x${l.H.toFixed(1)}`; }

function compute(){
  const res = { msgs: [], sizes: [], ships: [], pallets: [], units: [], containers: [], air: null, spots: null, maxH: 0, Hcap: 0 };
  const msg = (level, text) => res.msgs.push({ level, text });
  const pal = S.pallet;
  const P = Math.max(pal.L, pal.W), Q = Math.min(pal.L, pal.W);
  res.P = P; res.Q = Q;
  const cont = CONTAINERS[S.sea.type];
  res.cont = cont;
  let maxH;
  const loose = S.mode === 'sea' && S.sea.load === 'loose';
  res.loose = loose;
  if (S.mode === 'air') { const U = ULDS[S.air.uld]; maxH = Math.min(S.air.H, S.rules.singleMax, U && U.H ? U.H : Infinity); }
  else maxH = S.rules.stackable ? S.rules.perPalletMax : S.rules.singleMax;
  // open tops and flat racks are loaded from above, so only the inside height limits them
  if (S.mode === 'sea') maxH = Math.min(maxH, cont.topLoad ? Infinity : cont.dH - 2, cont.H - 5);
  res.maxH = maxH;
  const Hcap = maxH - pal.H, Wcap = S.rules.palletWtMax - pal.wt;
  res.Hcap = Hcap;

  if (pal.preset !== 'US' && !loose) msg('warn', `Pallet is ${fDims(pal.L, pal.W, pal.H).replace(/ x [^x]*$/, '')}. Amazon US needs 40 x 48 in (101.6 x 121.9 cm) pallets. A different pallet changes how many boxes fit per layer.`);
  if (pal.H >= 18 && !loose) msg('warn', `The empty pallet is ${fL(pal.H)} high. A tall pallet wastes height on every pallet and stack. Standard 40 x 48 in pallets are about 12 to 15 cm (4.75 to 6 in).`);
  if (Hcap <= 0 && !loose) { msg('error', 'The empty pallet is taller than the height limit. Check the pallet height and limits.'); }

  // ---- expand boxes and sizes ----
  const sizeMap = new Map();
  S.shipments.forEach((sh, si) => {
    const lines = sh.lines.filter(l => l.sku && l.boxes > 0 && l.L > 0 && l.W > 0 && l.H > 0)
      .map((l, i) => ({ l, i })).sort((p, q) => byAscii(String(p.l.sku), String(q.l.sku)) || p.i - q.i).map(x => x.l);
    const boxes = []; let n = 0;
    for (const l of lines) {
      const key = sizeKey(l);
      if (!sizeMap.has(key)) sizeMap.set(key, { key, a: Math.max(l.L, l.W), b: Math.min(l.L, l.W), h: l.H, count: 0, maxWt: 0, ships: new Set() });
      const sz = sizeMap.get(key);
      for (let k = 0; k < Math.round(l.boxes); k++) {
        n++; boxes.push({ si, n, sku: String(l.sku), upb: +l.upb || 0, L: sz.a, W: sz.b, H: l.H, wt: +l.wt || 0, size: sz });
        sz.count++; sz.maxWt = Math.max(sz.maxWt, +l.wt || 0); sz.ships.add(si);
      }
      if ((+l.wt || 0) > AMZ_BOX_KG + 0.01) msg('warn', `${esc(l.sku)}: box weighs ${fW(l.wt)}. Amazon's standard box limit is 50 lb (22.7 kg); heavier boxes need Team Lift labels. Check the AWD rules.`);
    }
    res.ships.push({ si, sh, boxes, N: n, units: boxes.reduce((a, b) => a + b.upb, 0), pallets: [] });
  });
  res.sizes = [...sizeMap.values()].sort((a, b) => b.count - a.count);
  res.sizes.forEach((s, i) => { s.idx = i; s.color = SIZE_COLORS[i % SIZE_COLORS.length]; });
  // floor-loaded cartons: no pallets, boxes are stacked in walls straight on the container floor
  if (loose) {
    if (S.shipments.length) loosePlan(res, msg);
    else msg('info', 'Add a shipment (Shipments tab) or click <b>Load example</b> to see how it works.');
    return res;
  }

  // ---- orientation / layer per size ----
  for (const s of res.sizes) {
    const opts = [{ fa: s.a, fb: s.b, h: s.h, upright: true }];
    if (S.rules.onEnd) opts.push({ fa: s.a, fb: s.h, h: s.b, upright: false }, { fa: s.b, fb: s.h, h: s.a, upright: false });
    let best = null;
    for (const o of opts) {
      if (o.h > Hcap + E) continue;
      const rects = layerPattern(o.fa, o.fb, P, Q);
      if (!rects.length) continue;
      let layers = Math.floor((Hcap + E) / o.h);
      const lw = rects.length * s.maxWt;
      if (lw > 0) layers = Math.min(layers, Math.floor((Wcap + E) / lw));
      if (layers < 1) continue;
      const cap = rects.length * layers;
      if (!best || cap > best.cap + E) best = { ...o, rects, TI: rects.length, layers, cap, fp: `${Math.max(o.fa, o.fb).toFixed(1)}x${Math.min(o.fa, o.fb).toFixed(1)}` };
    }
    s.o = best;
    if (!best) msg('error', `Boxes of ${fDims(s.a, s.b, s.h)} don't fit on this pallet within the height and weight limits.`);
    else if (!best.upright) msg('warn', `Boxes of ${fDims(s.a, s.b, s.h)} are placed on their side (${fL(best.h)} up) to fit more. Check the cartons have no "This side up" marking and that labels stay visible.`);
  }

  // ---- pack each shipment ----
  for (const shp of res.ships) {
    const groups = res.sizes.filter(s => s.o).map(s => ({ size: s, boxes: shp.boxes.filter(b => b.size === s) })).filter(g => g.boxes.length);
    const unplaced = shp.boxes.filter(b => !b.size.o).length;
    if (unplaced) msg('error', `${shipLabel(shp.si)}: ${unplaced} boxes can't be placed (size doesn't fit).`);
    const bins = packGroups(groups, S.rules.mixSizes, Hcap, Wcap);
    shp.pallets = binsToPallets(bins, groups, shp.si, pal);
  }

  // ---- cross-shipment merge (only when a shipment has more pallets than labels) ----
  if (S.rules.mixShipments && res.ships.length > 1) {
    for (let guard = 0; guard < 50; guard++) {
      let changed = false;
      for (const shp of res.ships) {
        const lab = +shp.sh.labels || 0;
        if (!lab || shp.pallets.length <= lab) continue;
        const cands = shp.pallets.slice().sort((a, b) => a.height - b.height);
        for (const X of cands) {
          let bestY = null, bestLeft = Infinity;
          for (const o of res.ships) {
            if (o === shp) continue;
            const olab = +o.sh.labels || 0;
            if (olab && o.pallets.length > olab) continue;
            for (const Y of o.pallets) {
              if (!Y.flat) continue;
              const h = Y.height + (X.height - pal.H), w = Y.weight + X.weight - pal.wt;
              if (h > maxH + E || w > S.rules.palletWtMax + E) continue;
              if (maxH - h < bestLeft) { bestLeft = maxH - h; bestY = Y; }
            }
          }
          if (bestY) {
            bestY.layers.push(...X.layers); refreshPallet(bestY, pal); bestY.mixedShip = true;
            shp.pallets.splice(shp.pallets.indexOf(X), 1); changed = true; break;
          }
        }
      }
      if (!changed) break;
    }
  }
  // number pallets
  for (const shp of res.ships) {
    shp.pallets.forEach((p, i) => { p.n = i + 1; p.id = `${shipCode(shp.si)}-${pad(i + 1)}`; p.si = shp.si; p.labelOf = shp.pallets.length; });
    shp.pallets.forEach(p => (p.gi = res.pallets.length + p.n - 1));
    res.pallets.push(...shp.pallets);
    const lab = +shp.sh.labels || 0;
    if (lab && lab !== shp.pallets.length) msg(shp.pallets.length > lab ? 'error' : 'warn', `${shipLabel(shp.si)} needs <b>${shp.pallets.length}</b> pallets but has <b>${lab}</b> pallet labels. Update the pallet count in Seller Central and reprint labels, or change the rules.`);
    else if (lab) msg('ok', `${shipLabel(shp.si)}: ${shp.pallets.length} pallets, matches the ${lab} pallet labels.`);
  }
  const mixedShip = res.pallets.filter(p => p.mixedShip);
  if (mixedShip.length) msg('info', `Mixed pallet${mixedShip.length > 1 ? 's' : ''} ${mixedShip.map(p => p.id).join(', ')} carr${mixedShip.length > 1 ? 'y' : 'ies'} boxes from two shipments. Every box keeps its own label.`);
  const mixedSize = res.pallets.filter(p => p.sizes.length > 1 && !p.mixedShip);
  if (mixedSize.length) msg('info', `${mixedSize.length} pallet${mixedSize.length > 1 ? 's carry' : ' carries'} more than one box size. Each layer is one full size; only the top layer can be partly filled.`);

  // ---- sea: stacks and containers ----
  if (S.mode === 'sea' && res.pallets.length) seaPlan(res, msg);
  if (S.mode === 'air' && res.pallets.length) airPlan(res, msg);
  if (!S.shipments.length) msg('info', 'Add a shipment (Shipments tab) or click <b>Load example</b> to see how it works.');
  return res;
}
function shipLabel(si){ const sh = S.shipments[si], c = shipCode(si); const nm = sh && sh.name && sh.name.trim() !== 'Shipment ' + c ? ' (' + esc(sh.name) + ')' : ''; return `Shipment ${c}${nm}`; }

function packGroups(groups, mix, Hcap, Wcap){
  const G = groups.map(g => {
    const o = g.size.o, N = g.boxes.length;
    return { size: g.size, TI: o.TI, h: o.h, lw: o.TI * g.size.maxWt, F: Math.floor(N / o.TI), r: N % o.TI, fp: o.fp };
  });
  let partials = G.map((x, gi) => x.r > 0 ? { parts: [{ gi, count: x.r }], h: x.h, fp: x.fp, TI: x.TI, count: x.r, wt: x.r * x.size.maxWt, gs: [gi] } : null).filter(Boolean);
  if (mix) {
    partials.sort((a, b) => b.h - a.h);
    const merged = [];
    for (const p of partials) {
      const c = merged.find(c => c.fp === p.fp && c.TI === p.TI && c.count + p.count <= c.TI);
      if (c) { c.parts.push(...p.parts); c.count += p.count; c.wt += p.wt; c.gs.push(...p.gs); c.h = Math.max(c.h, p.h); }
      else merged.push({ ...p, parts: p.parts.slice(), gs: p.gs.slice() });
    }
    partials = merged;
  }
  const F = G.map(x => x.F);
  const used = partials.map(() => false);
  const bins = [];
  const search = allowed => {
    let best = null, nodes = 0;
    const cnt = new Array(G.length).fill(0);
    const consider = (h, w, pi) => {
      const gset = new Set(allowed.filter(g => cnt[g] > 0));
      if (pi != null) partials[pi].gs.forEach(g => gset.add(g));
      const cand = { cnt: cnt.slice(), pi, h, w, ng: gset.size };
      if (!best) { best = cand; return; }
      if (h > best.h + 1e-4) best = cand;
      else if (Math.abs(h - best.h) <= 1e-4) {
        if (cand.ng < best.ng || (cand.ng === best.ng && pi == null && best.pi != null)) best = cand;
      }
    };
    const rec = (i, h, w) => {
      if (++nodes > 250000) return;
      if (i === allowed.length) {
        if (cnt.some(c => c > 0)) consider(h, w, null);
        partials.forEach((p, pi) => {
          if (used[pi]) return;
          if (!mix && !(p.gs.length === 1 && allowed.includes(p.gs[0]))) return;
          if (!cnt.some(c => c > 0) && allowed.length > 1) return;
          if (h + p.h <= Hcap + E && w + p.wt <= Wcap + E) consider(h + p.h, w + p.wt, pi);
        });
        return;
      }
      const gi = allowed[i], x = G[gi];
      const maxc = Math.min(F[gi], Math.floor((Hcap - h + E) / x.h));
      for (let c = maxc; c >= 0; c--) {
        if (x.lw > 0 && w + c * x.lw > Wcap + E) continue;
        cnt[gi] = c; rec(i + 1, h + c * x.h, w + c * x.lw);
      }
      cnt[gi] = 0;
    };
    rec(0, 0, 0);
    return best;
  };
  const commit = b => {
    b.cnt.forEach((c, gi) => (F[gi] -= c));
    if (b.pi != null) used[b.pi] = true;
    bins.push({ cnt: b.cnt, pi: b.pi, h: b.h, w: b.w });
  };
  if (mix) {
    const all = G.map((_, i) => i);
    while (F.some(f => f > 0)) {
      const b = search(all.filter(i => F[i] > 0));
      if (!b || !b.cnt.some(c => c > 0)) break;
      commit(b);
    }
  } else {
    G.forEach((_, gi) => {
      while (F[gi] > 0) { const b = search([gi]); if (!b || !b.cnt.some(c => c > 0)) break; commit(b); }
    });
  }
  // place leftover partial layers on top of bins with room, else new bins
  partials.map((p, pi) => ({ p, pi })).filter(x => !used[x.pi]).sort((a, b) => b.p.h - a.p.h).forEach(({ p, pi }) => {
    let best = null, left = Infinity;
    for (const b of bins) {
      if (b.pi != null) continue;
      if (!mix) { const gs = b.cnt.map((c, gi) => c > 0 ? gi : -1).filter(g => g >= 0); if (gs.length !== 1 || gs[0] !== p.gs[0] || p.gs.length !== 1) continue; }
      if (b.h + p.h <= Hcap + E && b.w + p.wt <= Wcap + E && Hcap - b.h - p.h < left) { left = Hcap - b.h - p.h; best = b; }
    }
    if (best) { best.pi = pi; best.h += p.h; best.w += p.wt; }
    else bins.push({ cnt: new Array(G.length).fill(0), pi, h: p.h, w: p.wt });
    used[pi] = true;
  });
  return { G, bins, partials };
}

function binsToPallets(pack, groups, si, pal){
  const { G, bins, partials } = pack;
  // order: by dominant size, pure before mixed, bins with partial last
  const info = bins.map((b, k) => {
    const boxesBy = G.map((x, gi) => b.cnt[gi] * x.TI + (b.pi != null ? partials[b.pi].parts.filter(p => p.gi === gi).reduce((a, p) => a + p.count, 0) : 0));
    let dom = 0; boxesBy.forEach((c, gi) => { if (c > boxesBy[dom]) dom = gi; });
    const ng = boxesBy.filter(c => c > 0).length;
    return { b, k, dom: G[dom].size.idx, mixed: ng > 1 ? 1 : 0, part: b.pi != null ? 1 : 0 };
  });
  info.sort((p, q) => p.dom - q.dom || p.mixed - q.mixed || p.part - q.part || p.k - q.k);
  const queues = groups.map(g => g.boxes.slice().sort((a, b) => a.n - b.n));
  // reserve the tail of each queue for partial layers
  const tails = G.map((x, gi) => queues[gi].splice(queues[gi].length - x.r, x.r));
  const pallets = [];
  for (const { b } of info) {
    const layers = [];
    const full = [];
    b.cnt.forEach((c, gi) => { for (let k = 0; k < c; k++) full.push(gi); });
    full.sort((p, q) => G[q].h - G[p].h || G[p].size.idx - G[q].size.idx);
    for (const gi of full) {
      const bx = queues[gi].splice(0, G[gi].TI);
      layers.push({ h: G[gi].h, rects: G[gi].size.o.rects, boxes: bx, full: true, orient: G[gi].size.o });
    }
    if (b.pi != null) {
      const p = partials[b.pi]; const bx = [];
      for (const part of p.parts) bx.push(...tails[part.gi].splice(0, part.count));
      bx.sort((x, y) => x.n - y.n);
      const host = G[p.parts[0].gi].size.o;
      layers.push({ h: p.h, rects: host.rects, boxes: bx, full: bx.length >= host.TI, orient: host });
    }
    const pl = { uid: uid(), si, layers, mixedShip: false };
    refreshPallet(pl, pal);
    pallets.push(pl);
  }
  return pallets;
}
function refreshPallet(p, pal){
  p.height = pal.H + p.layers.reduce((a, l) => a + l.h, 0);
  p.boxes = p.layers.flatMap(l => l.boxes);
  p.count = p.boxes.length;
  p.weight = pal.wt + p.boxes.reduce((a, b) => a + b.wt, 0);
  p.flat = p.layers.length > 0 && p.layers[p.layers.length - 1].full;
  p.sizes = [...new Set(p.boxes.map(b => b.size.idx))].sort((a, b) => a - b);
  p.units = p.boxes.reduce((a, b) => a + b.upb, 0);
  p.ships = [...new Set(p.boxes.map(b => b.si))];
}
