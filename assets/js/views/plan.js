'use strict';
/* ---------------- Plan view ---------------- */
function tileHTML(p, sel){
  const role = p.level === 'bottom' ? 'BOTTOM' : p.level === 'top' ? 'TOP' : S.mode === 'sea' ? 'SINGLE' : '';
  const flags = [];
  if (p.mixedShip) flags.push('2 shipments');
  else if (p.sizes.length > 1) flags.push('mixed sizes');
  if (!p.flat) flags.push('part-full top');
  const dark = p.level === 'bottom';
  return `<button class="tile ${sel ? 'on' : ''}" data-pallet="${p.uid}" style="border-color:${shipColor(p.si)};background:${dark ? shipColor(p.si) : shipLight(p.si)};color:${dark ? '#fff' : 'inherit'}">
    <div class="id" style="color:${dark ? '#fff' : shipColor(p.si)}">${esc(p.id)}</div>
    <div class="m" style="color:${dark ? 'rgba(255,255,255,.85)' : ''}">${p.count} boxes · ${esc(fL(p.height, 0))}</div>
    <div class="f" style="color:${dark ? '#fff' : '#5d6878'}">${role}${flags.length ? ' · ' + flags.join(' · ') : ''}</div></button>`;
}
function sizeTableHTML(shp, noHead){
  const sizes = R.sizes.filter(s => shp.boxes.some(b => b.size === s));
  let h = noHead ? '' : `<div style="margin-top:10px"><b style="color:${shipColor(shp.si)}">Shipment ${shipCode(shp.si)}</b> ${esc(shp.sh.name && shp.sh.name.trim() !== 'Shipment ' + shipCode(shp.si) ? shp.sh.name : '')} <span class="mono">${esc(shp.sh.sid || '')}</span> · ${shp.N} boxes · ${shp.pallets.length} pallets${+shp.sh.labels ? ' / ' + shp.sh.labels + ' labels' : ''}</div>`;
  h += `<div class="scrollx"><table class="t" style="margin-bottom:10px"><thead><tr><th>Box size</th><th class="n">Boxes</th><th class="n">Per layer</th><th class="n">Max layers</th><th class="n">Per pallet</th><th>Pallets</th><th class="n">Full pallet height</th></tr></thead><tbody>`;
  for (const s of sizes) {
    const ps = shp.pallets.filter(p => p.sizes.includes(s.idx));
    const n = shp.boxes.filter(b => b.size === s).length;
    h += `<tr><td><span class="swatch" style="background:${s.color};vertical-align:-2px"></span> <b>${esc(fDims(s.a, s.b, s.h))}</b>${s.o && !s.o.upright ? ' <span class="badge warn">on side</span>' : ''}</td><td class="n">${n}</td>
      <td class="n">${s.o ? s.o.TI : '-'}</td><td class="n">${s.o ? s.o.layers : '-'}</td><td class="n">${s.o ? s.o.cap : '-'}</td>
      <td>${ps.length ? esc(ps[0].id) + (ps.length > 1 ? ' to ' + esc(ps[ps.length - 1].id) : '') + ` <span class="muted">(${ps.length})</span>` : '-'}</td>
      <td class="n">${s.o ? esc(fL(S.pallet.H + s.o.layers * s.o.h)) : '-'}</td></tr>`;
  }
  return h + `</tbody></table></div>`;
}
function viewPlan(){
  if (R.loose) return viewPlanLoose();
  if (!R.pallets.length) return msgsHTML() + `<div class="card empty">Nothing to plan yet. Add shipments first.</div>`;
  let h = kpisHTML() + msgsHTML();
  for (const shp of R.ships) {
    if (!shp.pallets.length) continue;
    const sh = shp.sh, lab = +sh.labels || 0;
    h += `<div class="card" style="margin-bottom:14px"><div class="shipHead"><div class="code" style="background:${shipColor(shp.si)}">${shipCode(shp.si)}</div>
      <div><b style="font-size:16px">${esc(sh.name || 'Shipment ' + shipCode(shp.si))}</b><div class="mono muted">${esc(sh.sid || '')}</div></div><span class="spacer"></span>
      <span class="badge">${shp.N} boxes</span><span class="badge ${lab ? (lab === shp.pallets.length ? 'ok' : 'err') : ''}">${shp.pallets.length} pallets${lab ? ' / ' + lab + ' labels' : ''}</span></div>`;
    h += sizeTableHTML(shp, true);
    // pallets grouped by main size
    const groups = new Map();
    for (const p of shp.pallets) {
      const key = p.mixedShip ? 'x' : p.sizes.length > 1 ? 'm' : String(p.sizes[0]);
      if (!groups.has(key)) groups.set(key, []); groups.get(key).push(p);
    }
    for (const [key, ps] of groups) {
      let title;
      if (key === 'x') title = 'Mixed shipment pallets';
      else if (key === 'm') title = 'Mixed size pallets';
      else { const s = R.sizes[+key]; title = `<span class="swatch" style="background:${s.color}"></span> Box size ${esc(fDims(s.a, s.b, s.h))}`; }
      h += `<div class="group"><b>${title}</b><span class="muted">· ${esc(ps[0].id)}${ps.length > 1 ? ' to ' + esc(ps[ps.length - 1].id) : ''} · ${ps.length} pallet${ps.length > 1 ? 's' : ''} · ${ps.reduce((a, p) => a + p.count, 0)} boxes</span></div>`;
      h += `<div class="tiles">${ps.map(p => tileHTML(p)).join('')}</div>`;
    }
    h += `</div>`;
  }
  return h;
}

function viewPlanLoose(){
  if (!R.containers.length) return msgsHTML() + `<div class="card empty">Nothing to plan yet. Add shipments first.</div>`;
  let h = kpisHTML() + msgsHTML();
  for (const shp of R.ships) {
    const ws = R.looseP.walls.filter(w => w.si === shp.si);
    if (!ws.length) continue;
    h += `<div class="card" style="margin-bottom:14px"><div class="shipHead"><div class="code" style="background:${shipColor(shp.si)}">${shipCode(shp.si)}</div>
      <div><b style="font-size:16px">${esc(shp.sh.name || 'Shipment ' + shipCode(shp.si))}</b><div class="mono muted">${esc(shp.sh.sid || '')}</div></div><span class="spacer"></span>
      <span class="badge">${shp.N} boxes</span><span class="badge">${ws.length} walls</span></div>
      <div class="tblwrap" style="max-height:none"><table class="t"><thead><tr><th>Box size</th><th class="n">Boxes</th><th class="n">Across</th><th class="n">High</th><th class="n">Per wall</th><th>Walls</th><th class="n">Floor length</th></tr></thead><tbody>
      ${R.sizes.map(s => { const sw = ws.filter(w => w.size === s); if (!sw.length) return ''; const w0 = sw[0];
        return `<tr><td><span class="swatch" style="background:${s.color};vertical-align:-2px"></span> <b>${esc(fDims(s.a, s.b, s.h))}</b>${!w0.up ? ' <span class="badge warn">on side</span>' : ''}</td><td class="n">${sw.reduce((a, w) => a + w.boxes.length, 0)}</td><td class="n">${w0.nx}</td><td class="n">${w0.nz}</td><td class="n">${w0.per}</td><td>${sw.map(w => `C${w.cont + 1}·${w.no}`).join(', ')}</td><td class="n">${esc(fL(sw.length * w0.d, 0))}</td></tr>`; }).join('')}
      </tbody></table></div></div>`;
  }
  return h;
}
