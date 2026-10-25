'use strict';
/* ---------------- air plan ---------------- */
function airPlan(res, msg){
  const d = S.air.divisor || 6000;
  const rows = res.pallets.map(p => {
    const vol = res.P * res.Q * p.height / d;
    return { p, vol, gross: p.weight, charge: Math.max(vol, p.weight) };
  });
  const loose = res.ships.flatMap(s => s.boxes).reduce((a, b) => { a.w += b.wt; a.v += b.L * b.W * b.H / d; return a; }, { w: 0, v: 0 });
  res.air = { rows, gross: rows.reduce((a, r) => a + r.gross, 0), vol: rows.reduce((a, r) => a + r.vol, 0), charge: rows.reduce((a, r) => a + r.charge, 0), loose };
  res.pallets.forEach((p, i) => { p.order = i + 1; p.level = 'floor'; p.partner = null; });
  const U = ULDS[S.air.uld];
  msg('info', `Air freight: pallets are not stacked. Height limit ${fL(res.maxH)} (${esc(U ? U.name : 'custom')}). Chargeable weight uses L x W x H cm / ${d}.`);
  if (!U || !U.L) return;
  const plan = res.uldPlan = uldPlan(res.pallets, U, res.P, res.Q);
  if (!plan.spots.length) { msg('error', `The pallet (${fDims(res.P, res.Q, 0).replace(/ x 0 .*/, '')} ${Lu()}) does not fit on a ${esc(U.code)} base of ${fDims(U.L, U.W, 0).replace(/ x 0 .*/, '')} ${Lu()}.`); return; }
  plan.ulds.forEach(u => u.place.forEach((pl, k) => { pl.p.uld = u.idx; pl.p.uspot = pl.spot; pl.p.over = pl.over; }));
  const n = plan.ulds.length;
  msg(plan.over ? 'warn' : 'ok', `${n} x ${esc(U.code)} needed for ${res.pallets.length} pallets: ${plan.spots.length} pallet spot${plan.spots.length > 1 ? 's' : ''} per ULD (${plan.layout.toLowerCase()}).`);
  if (plan.layout === 'One row in the middle') msg('info', `The pallets are too tall for the sloped edges of the ${esc(U.code)} contour, so they go in one row down the middle. Lower pallets (about ${fL(Math.min(...uldLayouts(U, res.P, res.Q, plan.edge)[0].rects.map(r => spotAllow(U, r.y, r.y + r.h))), 0)} or less) would fit more per ULD.`);
  if (plan.over) msg('error', `${plan.over} pallet${plan.over > 1 ? 's are' : ' is'} too tall or too heavy for the ${esc(U.code)} contour and shown in red. Lower the height limit, or pick a main deck ULD.`);
  const edgeSpots = plan.spots.filter(s => s.allow + E < U.H);
  if (edgeSpots.length && !plan.over) msg('info', `The contour slopes at the top edges: ${edgeSpots.length} of ${plan.spots.length} spots take pallets up to ${fL(Math.min(...edgeSpots.map(s => s.allow)), 0)} only, so the tallest pallets go in the middle.`);
  if (U.closed) msg('info', `${esc(U.code)} is a closed container. Pallets must pass through its door; check the door size with the airline.`);
}

/* ---------------- ULD contour ---------------- */
function interpC(pts, z){
  if (z <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (z <= pts[i][0] + E) { const [z0, a] = pts[i - 1], [z1, b] = pts[i]; return z1 - z0 < E ? b : a + (b - a) * (z - z0) / (z1 - z0); }
  }
  return pts[pts.length - 1][1];
}
// usable width at height z: [left edge, right edge] measured across the base (0 to W)
function uldSpan(U, z){ return [interpC(U.cl, z), U.W - interpC(U.cr, z)]; }
// the tallest cargo that fits in the band y0..y1 under the contour
function spotAllow(U, y0, y1){
  let h = 0;
  for (let z = 0; z <= U.H + E; z += 0.5) { const [a, b] = uldSpan(U, z); if (a > y0 + 0.01 || b < y1 - 0.01) break; h = z; }
  return Math.min(h, U.H);
}
function uldArea(U){ let a = 0; for (let z = 0; z < U.H; z += 1) { const [l, r] = uldSpan(U, z + .5); a += Math.max(0, r - l); } return a; }
// Candidate floor layouts on the ULD base: the most pallets (all spots may touch the sloped edges),
// or one row down the middle, which keeps tall pallets clear of the contour.
function uldLayouts(U, P, Q, edge){
  const Lu = U.L - 2 * edge, Wu = U.W - 2 * edge, out = [];
  const most = layerPattern(P, Q, Lu, Wu).map(r => ({ x: r.x + edge, y: r.y + edge, w: r.w, h: r.h }));
  if (most.length) out.push({ name: 'Most pallets', rects: most });
  for (const [along, across] of [[P, Q], [Q, P]]) {
    const n = Math.floor((Lu + E) / along);
    if (n < 1 || across > Wu + E) continue;
    const x0 = edge + (Lu - n * along) / 2, y0 = (U.W - across) / 2;
    out.push({ name: 'One row in the middle', rects: Array.from({ length: n }, (_, i) => ({ x: x0 + i * along, y: y0, w: along, h: across })) });
  }
  return out;
}
function uldPlan(pallets, U, P, Q){
  const edge = Math.max(0, +S.air.edge || 0), d = S.air.divisor || 6000;
  let best = null;
  for (const lay of uldLayouts(U, P, Q, edge)) {
    const plan = uldAssign(pallets, U, P, Q, lay, edge, d);
    if (!best || plan.over < best.over || (plan.over === best.over && (plan.ulds.length < best.ulds.length || (plan.ulds.length === best.ulds.length && plan.spots.length > best.spots.length)))) best = plan;
  }
  return best || { U, spots: [], ulds: [], edge, over: 0, charge: 0, gross: 0, layout: '' };
}
function uldAssign(pallets, U, P, Q, lay, edge, d){
  const spots = lay.rects.map((r, i) => ({ ...r, i, no: i + 1, allow: spotAllow(U, r.y, r.y + r.h) }));
  const out = { U, spots, ulds: [], edge, over: 0, charge: 0, gross: 0, layout: lay.name };
  const cap = U.mgw - U.tare;
  const newULD = () => { const u = { idx: out.ulds.length, place: [], free: spots.slice(), weight: 0 }; out.ulds.push(u); return u; };
  // tallest pallets first, each into the spot with the least room to spare (best fit), filling ULDs in order
  const order = pallets.slice().sort((a, b) => b.height - a.height || a.si - b.si || a.n - b.n);
  const maxAllow = Math.max(...spots.map(s => s.allow));
  for (const p of order) {
    let best = null, bu = null;
    const tooTall = p.height > maxAllow + E;
    for (const u of out.ulds) {
      if (u.weight + p.weight > cap + E) continue;
      let slack = Infinity;
      for (const s of u.free) {
        const sl = tooTall ? maxAllow - s.allow : s.allow - p.height;
        if ((tooTall || s.allow + E >= p.height) && sl < slack) { slack = sl; best = s; }
      }
      if (best) { bu = u; break; }
    }
    if (!best) {
      bu = newULD();
      best = spots.filter(s => s.allow + E >= p.height).sort((a, b) => a.allow - b.allow)[0] || spots.slice().sort((a, b) => b.allow - a.allow)[0];
    }
    const over = best.allow + E < p.height || p.weight > cap + E;
    bu.free = bu.free.filter(s => s !== best); bu.place.push({ p, spot: best, over }); bu.weight += p.weight;
    if (over) out.over++;
  }
  const area = uldArea(U);
  for (const u of out.ulds) {
    u.place.sort((a, b) => a.spot.i - b.spot.i);
    u.vol = u.place.reduce((a, pl) => a + P * Q * pl.p.height, 0);
    u.gross = u.weight + U.tare;
    u.charge = Math.max(u.weight, u.vol / d);
    u.fillVol = u.vol / (area * U.L);
    u.fillWt = u.weight / cap;
    delete u.free;
  }
  out.charge = out.ulds.reduce((a, u) => a + u.charge, 0);
  out.gross = out.ulds.reduce((a, u) => a + u.gross, 0);
  return out;
}
function uldCompare(res){
  return Object.entries(ULDS).filter(([, U]) => U.L).map(([k, U]) => {
    const pl = uldPlan(res.pallets, U, res.P, res.Q);
    return { k, U, per: pl.spots.length, n: pl.ulds.length, over: pl.over, charge: pl.charge, maxAllow: pl.spots.length ? Math.max(...pl.spots.map(s => s.allow)) : 0 };
  });
}

/* ---------------- sea vs air ---------------- */
function computeWith(patch){
  const keep = S;
  S = JSON.parse(JSON.stringify(S)); patch(S);
  try { return compute(); } finally { S = keep; }
}
function modeCompare(){
  const sea = S.mode === 'sea' ? R : computeWith(s => { s.mode = 'sea'; });
  const air = S.mode === 'air' ? R : computeWith(s => { s.mode = 'air'; });
  const boxes = sea.ships.flatMap(s => s.boxes);
  const out = { sea: null, air: null };
  if (sea.containers && sea.containers.length) {
    const cbm = sea.loose ? boxes.reduce((a, b) => a + b.L * b.W * b.H, 0) / 1e6 : sea.pallets.reduce((a, p) => a + sea.P * sea.Q * p.height, 0) / 1e6;
    out.sea = { n: sea.containers.length, name: sea.cont.name, pallets: sea.pallets.length, loose: sea.loose, cbm, weight: sea.containers.reduce((a, c) => a + c.weight, 0) };
    const c = parseFloat(S.cost.sea); if (c > 0) out.sea.cost = c * out.sea.n;
  }
  if (air.air) {
    const up = air.uldPlan;
    out.air = { pallets: air.pallets.length, charge: air.air.charge, gross: air.air.gross, cbm: air.pallets.reduce((a, p) => a + air.P * air.Q * p.height, 0) / 1e6,
      n: up ? up.ulds.length : null, code: up ? up.U.code : '', looseCharge: Math.max(air.air.loose.w, air.air.loose.v) };
    const c = parseFloat(S.cost.air); if (c > 0) out.air.cost = c * out.air.charge;
  }
  return out;
}
