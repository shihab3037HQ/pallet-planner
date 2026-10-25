'use strict';
/* ---------------- sea plan ---------------- */
const PATTERNS = { straight: { no: 1, name: 'Straight rows' }, lanes: { no: 2, name: 'Two lanes' } };
function floorSpots(cont, P, Q, pattern, doorSpot){
  // P = long side of the pallet (48 in), Q = short side (40 in). x runs along the container from the front wall, y across.
  const L = cont.L, W = cont.W, spots = [], lanes = [];
  let desc = '', spareW = 0, fallback = false, doorSlack = null;
  if (pattern === 'lanes' && P + Q > W + E) { pattern = 'straight'; fallback = true; }
  if (pattern === 'lanes') {
    const n1 = Math.floor((L + E) / Q), n2 = Math.floor((L + E) / P);
    spareW = W - P - Q; const off = spareW / 2;
    for (let i = 0; i < n1; i++) spots.push({ x: i * Q, y: off, w: Q, d: P, lane: 1, pos: i + 1 });
    for (let i = 0; i < n2; i++) spots.push({ x: i * P, y: off + P, w: P, d: Q, lane: 2, pos: i + 1 });
    lanes.push({ lane: 1, n: n1, across: P, along: Q, y: off, spare: L - n1 * Q }, { lane: 2, n: n2, across: Q, along: P, y: off + P, spare: L - n2 * P });
    desc = `Lane 1: ${n1} pallets with the ${fL(P, 0)} side across · Lane 2: ${n2} pallets with the ${fL(Q, 0)} side across`;
  } else {
    const optA = { along: P, across: Q, na: Math.floor((W + E) / Q), nr: Math.floor((L + E) / P) };
    const optB = { along: Q, across: P, na: Math.floor((W + E) / P), nr: Math.floor((L + E) / Q) };
    const o = optB.na * optB.nr > optA.na * optA.nr ? optB : optA;
    spareW = W - o.na * o.across; const off = spareW / 2;
    for (let c = 0; c < o.na; c++) {
      for (let r = 0; r < o.nr; r++) spots.push({ x: r * o.along, y: off + c * o.across, w: o.along, d: o.across, lane: c + 1, pos: r + 1 });
      lanes.push({ lane: c + 1, n: o.nr, across: o.across, along: o.along, y: off + c * o.across, spare: L - o.nr * o.along });
    }
    desc = `${o.na} lanes of ${o.nr} pallets, all with the ${fL(o.across, 0)} side across`;
    if (doorSpot) {
      const left = L - o.nr * o.along;
      if (left + E >= o.across && W + E >= o.along) {
        const n2 = Math.floor((W + E) / o.along), off2 = (W - n2 * o.along) / 2;
        for (let c = 0; c < n2; c++) spots.push({ x: o.nr * o.along, y: off2 + c * o.along, w: o.across, d: o.along, lane: 'D', pos: c + 1 });
        lanes.forEach(l => (l.spare = 0));
        desc += ` + ${n2} turned at the doors`;
        doorSlack = left - o.across;
      }
    }
  }
  spots.slice().sort((a, b) => (a.lane === 'D') - (b.lane === 'D') || (a.lane === 'D' ? 0 : a.lane - b.lane) || a.pos - b.pos).forEach((sp, i) => (sp.no = i + 1));
  const seq = spots.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  seq.forEach((sp, i) => (sp.seq = i));
  return { pattern, spots, seq, lanes, desc, spareW, fallback, doorSlack, name: PATTERNS[pattern].name, no: PATTERNS[pattern].no };
}
function posText(sp){ if (!sp) return ''; return sp.lane === 'D' ? `Doors, turned ${sp.pos}` : `Lane ${sp.lane}, spot ${sp.pos}`; }
function layoutUnits(units, fs){
  const per = fs.seq.length, nC = per ? Math.ceil(units.length / per) : 0, containers = [];
  let order = 0;
  for (let c = 0; c < nC; c++) {
    const us = units.slice(c * per, (c + 1) * per);
    const C = { idx: c, place: [], weight: 0, pallets: 0, boxes: 0 };
    us.forEach((u, k) => {
      const pl = { u, spot: fs.seq[k], oB: ++order, oT: u.top ? ++order : null };
      C.place.push(pl);
      for (const p of [u.bottom, u.top]) if (p) { C.weight += p.weight; C.pallets++; C.boxes += p.count; }
    });
    containers.push(C);
  }
  return { fs, containers, nC, per, units };
}
function roomLeft(res, lay){
  const out = { freeSpots: 0, freePallets: 0, perSize: [] };
  if (!lay || !lay.nC) return out;
  out.freeSpots = lay.nC * lay.per - lay.units.length;
  const lim = res.stackLim;
  for (const s of res.sizes) {
    if (!s.o) continue;
    const fullH = S.pallet.H + s.o.layers * s.o.h;
    const two = S.rules.stackable && 2 * fullH <= lim + E;
    const onTop = S.rules.stackable ? lay.units.filter(u => !u.top && u.bottom.flat && u.bottom.height + fullH <= lim + E).length : 0;
    const pallets = out.freeSpots * (two ? 2 : 1) + onTop;
    out.perSize.push({ s, pallets, boxes: pallets * s.o.cap });
  }
  out.freePallets = out.perSize.length ? out.perSize[0].pallets : 0;
  return out;
}
function pairPallets(pallets, limH, limW){
  // 1) "Hard" pallets first: part-full top (must go on top) or too tall/heavy to stack on a twin.
  //    Each gets the tallest partner that still fits (best fit), same shipment and lowest number first.
  // 2) The rest pair in pallet-number order so the plan is easy to follow.
  // Heavier flat pallet at the bottom; a part-full pallet is always on top.
  const fits = (a, b) => a.height + b.height <= limH + E && a.weight + b.weight <= limW + E && (a.flat || b.flat);
  const hard = p => !p.flat || 2 * p.height > limH + E || 2 * p.weight > limW + E;
  const units = [], used = new Set();
  const make = (a, b) => {
    let bot = a, top = b;
    if (!bot.flat || (top.flat && top.weight > bot.weight)) { bot = b; top = a; }
    used.add(a); used.add(b); units.push({ bottom: bot, top });
  };
  const order = (a, b) => a.si - b.si || a.n - b.n;
  const H = pallets.filter(hard).sort((a, b) => (b.height - a.height > 0.5 ? 1 : a.height - b.height > 0.5 ? -1 : 0) || order(a, b));
  for (const x of H) {
    if (used.has(x)) continue;
    let best = null;
    for (const c of pallets) {
      if (c === x || used.has(c) || !fits(x, c)) continue;
      if (hard(c) && c.flat === false && x.flat === false) continue;
      if (!best) { best = c; continue; }
      const key = p => [hard(p) ? 1 : 0, p.si === x.si ? 0 : 1, p.sizes[0] === x.sizes[0] ? 0 : 1, -p.height, p.n];
      const ka = key(c), kb = key(best);
      for (let i = 0; i < ka.length; i++) { if (Math.abs(ka[i] - kb[i]) > 1e-6) { if (ka[i] < kb[i]) best = c; break; } }
    }
    if (best) make(x, best);
  }
  const rest = pallets.filter(p => !used.has(p)).sort(order);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]; if (used.has(a)) continue;
    let j = i + 1; while (j < rest.length && (used.has(rest[j]) || !fits(a, rest[j]))) j++;
    if (j < rest.length && rest[j].si === a.si) make(a, rest[j]);
  }
  const left = pallets.filter(p => !used.has(p)).sort(order);
  for (let i = 0; i < left.length; i++) {
    const a = left[i]; if (used.has(a)) continue;
    const b = left.find(q => q !== a && !used.has(q) && fits(a, q));
    if (b) make(a, b); else { used.add(a); units.push({ bottom: a, top: null }); }
  }
  return units;
}
function seaPlan(res, msg){
  const cont = res.cont;
  const stackLim = Math.min(S.rules.stackMax, cont.H - 5);
  res.stackLim = stackLim;
  let units;
  if (S.rules.stackable) {
    units = pairPallets(res.pallets, stackLim, S.rules.stackWtMax);
    const minPair = res.pallets.length > 1 ? Math.min(...res.pallets.map(p => p.height)) * 2 : 0;
    if (res.pallets.length > 1 && !units.some(u => u.top) && minPair > stackLim) msg('warn', `Pallets can't be stacked 2 high in a ${cont.name}: two pallets are over the ${fL(stackLim)} limit (inside height ${fL(cont.H)}). A High Cube container or lower pallets would allow stacking.`);
  } else units = res.pallets.map(p => ({ bottom: p, top: null }));
  units.forEach(u => { u.h = u.bottom.height + (u.top ? u.top.height : 0); u.w = u.bottom.weight + (u.top ? u.top.weight : 0); });
  units.sort((a, b) => Math.min(a.bottom.si, a.top ? a.top.si : 99) - Math.min(b.bottom.si, b.top ? b.top.si : 99) || Math.min(a.bottom.n, a.top ? a.top.n : 1e9) - Math.min(b.bottom.n, b.top ? b.top.n : 1e9));
  res.units = units;
  res.layouts = {};
  for (const pat of ['straight', 'lanes']) res.layouts[pat] = layoutUnits(units, floorSpots(cont, res.P, res.Q, pat, pat === 'straight' && S.sea.doorSpot));
  const actKey = res.layouts[S.sea.pattern] && !res.layouts[S.sea.pattern].fs.fallback ? S.sea.pattern : 'straight';
  const lay = res.layout = res.layouts[actKey];
  res.spots = lay.fs;
  if (!lay.fs.spots.length) { msg('error', 'The pallet does not fit in this container.'); return; }
  if (res.layouts.lanes.fs.fallback) msg('info', `Two lanes need ${fL(res.P + res.Q, 0)} of width, wider than this container (${fL(cont.W, 0)}). Only straight rows are possible.`);
  // apply the active layout to the pallets
  for (const C of lay.containers) for (const pl of C.place) {
    const u = pl.u;
    for (const [p, lvl, o] of [[u.bottom, u.top ? 'bottom' : 'floor', pl.oB], [u.top, 'top', pl.oT]]) {
      if (!p) continue;
      p.unit = u; p.spot = pl.spot; p.level = lvl; p.cont = C.idx; p.order = o; p.partner = lvl === 'bottom' ? u.top : lvl === 'top' ? u.bottom : null;
    }
  }
  res.containers = lay.containers;
  for (const C of lay.containers) {
    if (C.weight > cont.payload) msg('error', `Container ${C.idx + 1} is ${fW(C.weight)}, over the ${cont.name} payload of about ${fW(cont.payload)}.`);
    else if (C.weight > US_ROAD_KG) msg('warn', `Container ${C.idx + 1} carries ${fW(C.weight)}. Over about 19,900 kg (44,000 lb) of cargo may exceed US road weight limits. Check with your forwarder.`);
  }
  const stacks = units.filter(u => u.top).length, singles = units.length - stacks;
  const opt = `Option ${lay.fs.no} (${lay.fs.name.toLowerCase()})`;
  if (lay.nC > 1) {
    const last = lay.containers[lay.nC - 1];
    msg('warn', `With ${opt} this plan needs <b>${lay.nC} x ${cont.name}</b>: ${lay.per} floor spots per container, and you have ${units.length} (${stacks} stacks${singles ? ` + ${singles} single` : ''}). The last container carries only ${last.pallets} pallet${last.pallets > 1 ? 's' : ''}.`);
  } else msg('ok', `With ${opt} everything fits in one ${cont.name}: ${units.length} of ${lay.per} floor spots used (${stacks} stacks${singles ? `, ${singles} single` : ''}).`);
  const otherKey = actKey === 'lanes' ? 'straight' : 'lanes', other = res.layouts[otherKey];
  if (!other.fs.fallback && other.nC && other.nC !== lay.nC) {
    const o2 = `Option ${other.fs.no} (${other.fs.name.toLowerCase()})`;
    msg(other.nC < lay.nC ? 'warn' : 'info', `${o2} needs ${other.nC} container${other.nC > 1 ? 's' : ''} (${other.per} floor spots each) instead of ${lay.nC}.${other.nC < lay.nC ? ' Switch to it under Container.' : ''}`);
  }
  const lf = res.layouts.lanes.fs;
  if (!lf.fallback && actKey === 'lanes') msg('info', `Two lanes: ${fL(lf.spareW, 1)} spare across the width. Spare at the doors: ${lf.lanes.map(l => `lane ${l.lane} ${fL(l.spare, 0)}`).join(', ')}, so the doors close easily.`);
  if (actKey === 'straight' && lay.fs.doorSlack != null) msg('warn', `Turned pallets at the doors leave only ${fL(lay.fs.doorSlack, 1)} spare. Confirm with your forwarder before planning on it.`);
  const tallStack = cont.topLoad ? [] : units.filter(u => u.top && u.h > cont.dH - 5);
  if (tallStack.length) msg('info', `${tallStack.length} stack${tallStack.length > 1 ? 's are' : ' is'} taller than the door opening (${fL(cont.dH)}). Put the bottom pallet in first and lift the top pallet on inside the container.`);
  const heavyTop = units.filter(u => u.top && u.top.weight > u.bottom.weight + 1);
  if (heavyTop.length) msg('info', `${heavyTop.length} stack${heavyTop.length > 1 ? 's have' : ' has'} a heavier pallet on top because the heavier one has a part-filled top layer. Within the weight limit, but check it is stable.`);
  const lonely = units.filter(u => !u.top && !u.bottom.flat && S.rules.stackable);
  if (lonely.length) msg('info', `${lonely.length} pallet${lonely.length > 1 ? 's stand' : ' stands'} alone because the top layer is only part full.`);
  const room = roomLeft(res, lay);
  if (room.perSize.length && room.perSize[0].pallets > 0) {
    const r0 = room.perSize[0];
    msg('info', `Room left in the last container: about <b>${r0.pallets} more pallet${r0.pallets > 1 ? 's' : ''}</b> (${room.perSize.map(r => `about ${r.boxes} boxes of ${fDims(r.s.a, r.s.b, r.s.h)}`).join(', or ')}).`);
  }
  res.room = room;
  if (cont.note) msg('info', `${esc(cont.name)}: ${esc(cont.note)}`);
  for (const C of lay.containers) { C.stats = contStats(C); cogMsg(C, msg); }
}
function compareOptions(res){
  const rows = [];
  for (const [k, c] of Object.entries(CONTAINERS)) {
    const lim = Math.min(S.rules.stackMax, c.H - 5);
    const units = S.rules.stackable ? pairPallets(res.pallets, lim, S.rules.stackWtMax) : res.pallets.map(p => ({ bottom: p, top: null }));
    const stacks = units.filter(u => u.top).length;
    for (const pat of ['straight', 'lanes']) {
      const fs = floorSpots(c, res.P, res.Q, pat, false);
      if (fs.fallback || !fs.spots.length) continue;
      const per = fs.spots.length, nC = Math.ceil(units.length / per);
      const lastUsed = units.length - (nC - 1) * per;
      const main = res.sizes.find(z => z.o);
      const two = S.rules.stackable && main && 2 * (S.pallet.H + main.o.layers * main.o.h) <= lim + E;
      rows.push({ k, c, pat, no: fs.no, name: fs.name, per, nC, units: units.length, stacks, two, maxPallets: per * (two ? 2 : 1), lastFill: Math.round(lastUsed / per * 100) });
    }
  }
  return rows;
}

/* ---------------- container fill and balance ---------------- */
function statsOut(cont, vol, floor, wt, mx){
  const V = cont.L * cont.W * cont.H;
  return { vol: vol / V, floor: floor / (cont.L * cont.W), wt: wt / cont.payload, cog: wt ? mx / wt / cont.L : 0.5, cbm: vol / 1e6, weight: wt };
}
function contStats(C){
  const cont = R ? R.cont : CONTAINERS[S.sea.type], P = Math.max(S.pallet.L, S.pallet.W), Q = Math.min(S.pallet.L, S.pallet.W);
  let vol = 0, floor = 0, wt = 0, mx = 0;
  for (const pl of C.place) {
    const u = pl.u, sp = pl.spot; floor += sp.w * sp.d;
    for (const p of [u.bottom, u.top]) if (p) { vol += P * Q * p.height; wt += p.weight; mx += p.weight * (sp.x + sp.w / 2); }
  }
  return statsOut(CONTAINERS[S.sea.type], vol, floor, wt, mx);
}
function cogMsg(C, msg){
  const st = C.stats;
  // only meaningful once most of the floor is used; a part-loaded container is front-heavy by design
  if (st.floor >= .6 && (st.cog < .38 || st.cog > .62)) msg('warn', `Container ${C.idx + 1}: the weight centre is at ${Math.round(st.cog * 100)}% of the length from the front wall. Aim for the middle (40 to 60%) by moving heavy pallets or walls, so the chassis and crane lift stay balanced.`);
}

/* ---------------- floor-loaded cartons (no pallets) ---------------- */
// Cartons are stacked in walls across the container, from the front wall to the doors.
// Each wall holds one box size of one shipment, so the walls stay easy to count and check.
function loosePlan(res, msg){
  const cont = res.cont, L = cont.L, W = cont.W;
  const Hl = cont.H - Math.max(0, +S.sea.topGap || 0);
  const walls = [];
  for (const shp of res.ships) {
    for (const s of res.sizes) {
      const bx = shp.boxes.filter(b => b.size === s).sort((a, b) => a.n - b.n);
      if (!bx.length) continue;
      const opts = [[s.a, s.b, s.h, true], [s.b, s.a, s.h, true]];   // [along, across, up, upright]
      if (S.rules.onEnd) opts.push([s.a, s.h, s.b, false], [s.h, s.a, s.b, false], [s.b, s.h, s.a, false], [s.h, s.b, s.a, false]);
      let best = null;
      for (const [d, w, h, up] of opts) {
        const nx = Math.floor((W + E) / w), nz = Math.floor((Hl + E) / h);
        if (nx < 1 || nz < 1 || d > L + E) continue;
        const per = nx * nz, len = Math.ceil(bx.length / per) * d;
        if (!best || len < best.len - E || (Math.abs(len - best.len) <= E && up && !best.up)) best = { d, w, h, up, nx, nz, per, len };
      }
      if (!best) { msg('error', `${shipLabel(shp.si)}: boxes of ${fDims(s.a, s.b, s.h)} don't fit in a ${esc(cont.name)}.`); continue; }
      if (!best.up) msg('warn', `Boxes of ${fDims(s.a, s.b, s.h)} are placed on their side to fit more. Check the cartons have no "This side up" marking.`);
      for (let k = 0; k < bx.length; k += best.per) walls.push({ si: shp.si, size: s, d: best.d, w: best.w, h: best.h, up: best.up, nx: best.nx, nz: best.nz, per: best.per, boxes: bx.slice(k, k + best.per) });
    }
  }
  const containers = []; let C = null, seq = 0;
  for (const w of walls) {
    const wt = w.boxes.reduce((a, b) => a + b.wt, 0);
    if (!C || C.len + w.d > L + E || C.weight + wt > cont.payload + E) {
      C = { idx: containers.length, walls: [], len: 0, weight: 0, boxes: 0, vol: 0, mx: 0, place: [] };
      containers.push(C);
    }
    const off = (W - w.nx * w.w) / 2;
    w.x = C.len; w.no = C.walls.length + 1; w.order = ++seq; w.weight = wt; w.cont = C.idx;
    w.pos = w.boxes.map((b, k) => ({ b, x: w.x, y: off + (k % w.nx) * w.w, z: Math.floor(k / w.nx) * w.h }));
    w.top = Math.ceil(w.boxes.length / w.nx) * w.h;
    C.walls.push(w); C.len += w.d; C.weight += wt; C.boxes += w.boxes.length;
    C.vol += w.boxes.reduce((a, b) => a + b.L * b.W * b.H, 0); C.mx += wt * (w.x + w.d / 2);
  }
  for (const C of containers) {
    C.stats = statsOut(cont, C.vol, C.walls.reduce((a, w) => a + w.d * w.nx * w.w, 0), C.weight, C.mx);
    C.pallets = 0;
    if (C.weight > cont.payload) msg('error', `Container ${C.idx + 1} is ${fW(C.weight)}, over the ${esc(cont.name)} payload of about ${fW(cont.payload)}.`);
    else if (C.weight > US_ROAD_KG) msg('warn', `Container ${C.idx + 1} carries ${fW(C.weight)}. Over about 19,900 kg (44,000 lb) of cargo may exceed US road weight limits. Check with your forwarder.`);
    cogMsg(C, msg);
  }
  res.containers = containers;
  res.looseP = { walls, containers, Hl };
  const boxes = walls.reduce((a, w) => a + w.boxes.length, 0);
  if (containers.length > 1) msg('warn', `Floor-loaded, this plan needs <b>${containers.length} x ${esc(cont.name)}</b> (${walls.length} walls of cartons). The last container is ${Math.round(containers[containers.length - 1].len / L * 100)}% full along its length.`);
  else if (containers.length) msg('ok', `Floor-loaded, all ${boxes} boxes fit in one ${esc(cont.name)}: ${walls.length} walls use ${fL(containers[0].len, 0)} of ${fL(L, 0)} (${Math.round(containers[0].len / L * 100)}% of the length).`);
  const heavy = walls.reduce((m, w) => Math.max(m, (w.nz - 1) * w.size.maxWt), 0);
  if (heavy > 0) msg('info', `Cartons are stacked up to ${Math.max(...walls.map(w => w.nz))} high (${fL(Hl, 0)} usable height). A bottom carton carries up to about ${fW(heavy)}. Check the carton strength, and put heavy or strong cartons at the bottom.`);
  if (containers.length) {
    const last = containers[containers.length - 1], left = L - last.len;
    const big = walls.length ? walls[walls.length - 1] : null;
    if (big && left > big.d) msg('info', `Room left in the last container: ${fL(left, 0)} of floor at the doors, about <b>${Math.floor(left / big.d) * big.per} more boxes</b> of ${fDims(big.size.a, big.size.b, big.size.h)}.`);
  }
  if (cont.note) msg('info', `${esc(cont.name)}: ${esc(cont.note)}`);
  msg('info', 'Floor-loaded cartons are unloaded by hand. Amazon and many 3PLs charge more for floor-loaded containers, or ask for pallets. Check with the receiving warehouse.');
}
