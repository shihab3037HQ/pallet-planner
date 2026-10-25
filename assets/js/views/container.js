'use strict';
/* ---------------- Container view ---------------- */
function loadListHTML(C){
  const rows = [];
  C.place.slice().sort((a, b) => a.oB - b.oB).forEach(pl => {
    const u = pl.u;
    for (const [p, lvl, o] of [[u.bottom, u.top ? 'bottom' : 'single', pl.oB], [u.top, 'top', pl.oT]]) {
      if (!p) continue;
      rows.push(`<div><span class="o">${o}</span><span class="pill" style="background:${shipColor(p.si)}">${esc(p.id)}</span><span>${esc(posText(pl.spot))}, ${lvl}</span><span class="spacer"></span><span class="muted">${esc(fL(p.height, 0))} · ${esc(fW(p.weight))}</span></div>`);
    }
  });
  return `<div class="load">${rows.join('')}</div>`;
}
function optionCard(key){
  const lay = R.layouts[key], fs = lay.fs, active = R.layout === lay, C0 = lay.containers[0];
  if (fs.fallback) return `<div class="card opt"><h3>Option ${PATTERNS[key].no} · ${PATTERNS[key].name}</h3><div class="note">Not possible: the pallet is too wide for two lanes in this container.</div></div>`;
  const room = roomLeft(R, lay), r0 = room.perSize[0];
  return `<div class="card opt ${active ? 'on' : ''}">
    <div class="row"><h3 style="margin:0">Option ${fs.no} · ${esc(fs.name)}</h3><span class="spacer"></span>${active ? '<span class="badge ok">Used for pallet sheets</span>' : `<button class="btn small" data-act="usePattern" data-pat="${key}">Use this option</button>`}</div>
    <div class="note" style="margin:4px 0 8px">${esc(fs.desc)}</div>
    ${C0 ? `<div class="paper">${containerSVG(C0, lay)}</div>` : ''}
    <div class="row" style="margin-top:8px"><span class="badge">${lay.per} floor spots per container</span><span class="badge ${lay.nC > 1 ? 'warn' : 'ok'}">${lay.nC} container${lay.nC > 1 ? 's' : ''}</span><span class="badge">${lay.units.length} of ${lay.nC * lay.per} spots used</span>
    ${r0 && r0.pallets > 0 ? `<span class="badge">room for about ${r0.pallets} more pallet${r0.pallets > 1 ? 's' : ''} (${r0.boxes} boxes)</span>` : ''}</div></div>`;
}
function containerBlock(lay, key){
  return lay.containers.map((C, ci) => {
    const pct = Math.round(C.place.length / lay.per * 100), k3 = key + '-' + ci;
    if (!C.stats) C.stats = contStats(C);
    return `<div class="card cont"><div class="contHead"><h2 style="margin:0">Option ${lay.fs.no} · Container ${ci + 1} of ${lay.nC}</h2>
      <span class="badge">${esc(R.cont.name)} · inside ${esc(fDims(R.cont.L, R.cont.W, R.cont.H))}</span><span class="badge">${C.place.length} of ${lay.per} floor spots (${pct}%)</span><span class="badge">${C.pallets} pallets · ${C.boxes} boxes</span><span class="badge ${C.weight > R.cont.payload ? 'err' : C.weight > US_ROAD_KG ? 'warn' : ''}">${esc(fW(C.weight))}</span>
      <span class="spacer"></span><button class="btn small" data-act="show3dCont" data-k3="${k3}">${ui.cont3d === k3 ? 'Hide 3D' : 'Show 3D'}</button></div>
      ${statsHTML(C.stats)}
      ${ui.cont3d === k3 ? view3dHTML('v3dCont', { steps: true, doors: true, tall: true }) : ''}
      <div class="paper">${containerSVG(C, lay)}</div>
      <div class="sides">${[...new Set(lay.fs.lanes.map(l => l.lane))].map(ln => `<div class="paper">${sideSVG(C, lay, ln)}</div>`).join('')}</div>
      <h3 style="margin-top:12px">Loading order (front to doors, bottom pallet first)</h3>${loadListHTML(C)}</div>`;
  }).join('');
}
function compareHTML(){
  const rows = compareOptions(R);
  const best = Math.min(...rows.map(r => r.nC));
  return `<div class="card" style="margin-bottom:14px"><h3>Compare all containers and options</h3><div class="note" style="margin-bottom:6px">For this plan (${R.pallets.length} pallets). Click a row to use it.</div><div class="tblwrap" style="max-height:none"><table class="t"><thead><tr><th>Container</th><th>Option</th><th class="n">Floor spots</th><th class="n">Full pallets stack 2 high</th><th class="n">Max pallets per container</th><th class="n">Containers needed</th><th class="n">Last container full</th></tr></thead><tbody>
  ${rows.map(r => { const on = r.k === S.sea.type && r.pat === R.layout.fs.pattern; return `<tr data-cmp="${r.k}|${r.pat}" class="click ${on ? 'on' : ''}"><td>${esc(r.c.name)}</td><td>Option ${r.no} · ${esc(r.name)}</td><td class="n">${r.per}</td><td class="n">${r.two ? 'yes' : 'no'}</td><td class="n">${r.maxPallets}</td><td class="n">${r.nC === best ? '<span class="badge ok">' + r.nC + '</span>' : r.nC}</td><td class="n">${r.lastFill}%</td></tr>`; }).join('')}
  </tbody></table></div></div>`;
}
function viewContainer(){
  if (R.loose) return viewContainerLoose();
  if (!R.pallets.length || !R.layouts) return msgsHTML() + `<div class="card empty">Nothing to load yet.</div>`;
  let h = kpisHTML();
  h += `<div class="optgrid">${optionCard('straight')}${optionCard('lanes')}</div>`;
  h += `<div class="row" style="margin:4px 0 12px"><span class="lbl" style="margin:0">Show full plans</span><div class="seg" data-uiseg="showOpt" style="width:360px">${[['straight', 'Option 1'], ['lanes', 'Option 2'], ['both', 'Both']].map(([k, n]) => `<button data-v="${k}" class="${ui.showOpt === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>`;
  const show = ui.showOpt === 'both' ? ['straight', 'lanes'] : [ui.showOpt];
  for (const k of show) { const lay = R.layouts[k]; if (!lay || lay.fs.fallback) continue; h += containerBlock(lay, k); }
  return h;
}
function after3DContainer(){
  const el = $('#v3dCont'); if (!el || !ui.cont3d) return;
  if (R.loose) { const ci = +ui.cont3d.split('-')[1], C = R.containers[ci]; if (C) mount3D(el, 'loose-container-' + (ci + 1), build3DLoose(C)); return; }
  const [key, ci] = ui.cont3d.split('-'); const lay = R.layouts && R.layouts[key]; const C = lay && lay.containers[+ci];
  if (C) mount3D(el, 'option' + lay.fs.no + '-container-' + (+ci + 1), build3DContainer(C, lay));
}

function viewContainerLoose(){
  if (!R.containers.length) return msgsHTML() + `<div class="card empty">Nothing to load yet.</div>`;
  let h = kpisHTML();
  R.containers.forEach((C, ci) => {
    const k3 = 'loose-' + ci;
    h += `<div class="card cont"><div class="contHead"><h2 style="margin:0">Container ${ci + 1} of ${R.containers.length} · floor-loaded</h2>
      <span class="badge">${esc(R.cont.name)} · inside ${esc(fDims(R.cont.L, R.cont.W, R.cont.H))}</span><span class="badge">${C.walls.length} walls · ${C.boxes} boxes</span><span class="badge">${esc(fL(C.len, 0))} of ${esc(fL(R.cont.L, 0))} used</span><span class="badge ${C.weight > R.cont.payload ? 'err' : C.weight > US_ROAD_KG ? 'warn' : ''}">${esc(fW(C.weight))}</span>
      <span class="spacer"></span><button class="btn small" data-act="show3dCont" data-k3="${k3}">${ui.cont3d === k3 ? 'Hide 3D' : 'Show 3D'}</button></div>
      ${statsHTML(C.stats)}
      ${ui.cont3d === k3 ? view3dHTML('v3dCont', { steps: true, doors: true, tall: true, what: 'a wall' }) : ''}
      <div class="paper">${looseTopSVG(C)}</div><div class="paper" style="margin-top:8px">${looseSideSVG(C)}</div>
      <h3 style="margin-top:12px">Loading order (front wall to doors)</h3>
      <div class="tblwrap" style="max-height:none"><table class="t"><thead><tr><th class="n">Wall</th><th>Shipment</th><th>Box numbers</th><th>SKUs</th><th class="n">Boxes</th><th class="n">Box size</th><th class="n">Across x high</th><th class="n">Weight</th></tr></thead><tbody>
      ${C.walls.map(w => { const sk = [...new Set(w.boxes.map(b => b.sku))]; return `<tr><td class="n"><b>${w.no}</b></td><td><span class="pill" style="background:${shipColor(w.si)}">${shipCode(w.si)}</span></td><td>${esc(runs(w.boxes.map(b => b.n)))}</td><td class="mono">${esc(sk.slice(0, 2).join(', '))}${sk.length > 2 ? ' +' + (sk.length - 2) : ''}</td><td class="n">${w.boxes.length}</td><td class="n">${esc(fDims(w.size.a, w.size.b, w.size.h))}</td><td class="n">${w.nx} x ${Math.ceil(w.boxes.length / w.nx)}</td><td class="n">${esc(fW(w.weight))}</td></tr>`; }).join('')}
      </tbody></table></div></div>`;
  });
  return h;
}
