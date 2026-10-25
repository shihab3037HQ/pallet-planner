'use strict';
/* ---------------- Pallets view ---------------- */
function viewPallets(){
  if (!R.pallets.length) return `<div class="card empty">No pallets yet.</div>`;
  let p = R.pallets.find(x => x.uid === ui.pallet) || R.pallets[0];
  ui.pallet = p.uid;
  const list = R.ships.map(shp => shp.pallets.length ? `<div class="lbl" style="margin-top:6px">Shipment ${shipCode(shp.si)}</div>` + shp.pallets.map(x => tileHTML(x, x === p)).join('') : '').join('');
  const skuRows = new Map();
  p.boxes.forEach(b => { const k = b.si + '|' + b.sku; if (!skuRows.has(k)) skuRows.set(k, { b, ns: [], units: 0 }); const r = skuRows.get(k); r.ns.push(b.n); r.units += b.upb; });
  const where = S.mode === 'sea' ? (p.level === 'bottom' ? `Bottom of stack, ${esc(p.partner.id)} goes on top` : p.level === 'top' ? `Top of stack, goes on ${esc(p.partner.id)}` : 'Single (nothing on top)') : R.uldPlan && p.uspot ? `Air pallet on ${esc(R.uldPlan.U.code)} ${p.uld + 1}, spot ${p.uspot.no}` : 'Air pallet (not stacked)';
  const pos = S.mode === 'sea' && p.spot ? ` · Option ${R.layout.fs.no}: container ${p.cont + 1}, ${posText(p.spot)}, ${fL(p.spot.d, 0)} side across, load #${p.order}` : '';
  const sh = S.shipments[p.si];
  return `<div class="split"><div class="plist">${list}</div><div>
    <div class="card" style="margin-bottom:12px"><div class="row"><div class="code" style="background:${shipColor(p.si)};width:auto;padding:0 12px;height:44px;font-size:24px">${esc(p.id)}</div>
      <div><b>${esc(sh.name || '')}</b> <span class="mono muted">${esc(sh.sid || '')}</span><div class="muted">Pallet label ${p.n}/${p.labelOf} · ${where}${pos}</div></div><span class="spacer"></span>
      <span class="badge">${p.count} boxes</span><span class="badge">${p.units.toLocaleString()} units</span><span class="badge">${p.layers.length} layers</span><span class="badge">${esc(fL(p.height))} high</span><span class="badge">${esc(fW(p.weight))}</span>
      ${p.mixedShip ? '<span class="badge warn">2 shipments</span>' : ''}${!p.flat ? '<span class="badge warn">part-full top</span>' : ''}</div></div>
    ${view3dHTML('v3dPal', { steps: true, what: 'a box', stepLabel: 'Build layers' })}
    <div class="note" style="margin:6px 0 12px">Layer 1 is the bottom layer. Each square is one carton.</div>
    <div class="layers">${p.layers.map((L, li) => `<div class="layer"><div class="lt"><span>Layer ${li + 1}${li === 0 ? ' (bottom)' : li === p.layers.length - 1 ? ' (top)' : ''}</span><span class="muted">${L.boxes.length}/${L.rects.length} · ${esc(fL(L.h))}</span></div><div class="paper">${layerSVG(p, li)}</div></div>`).join('')}</div>
    <div class="card" style="margin-top:12px"><h3>Boxes on this pallet</h3><div class="scrollx"><table class="t"><thead><tr><th>Shipment</th><th>SKU</th><th class="n">Boxes</th><th>Box numbers</th><th class="n">Units</th><th class="n">Box size</th></tr></thead><tbody>
      ${[...skuRows.values()].map(r => `<tr><td><span class="pill" style="background:${shipColor(r.b.si)}">${shipCode(r.b.si)}</span></td><td class="mono">${esc(r.b.sku)}</td><td class="n">${r.ns.length}</td><td>${esc(runs(r.ns))}</td><td class="n">${r.units}</td><td class="n">${esc(fDims(r.b.L, r.b.W, r.b.H))}</td></tr>`).join('')}
    </tbody></table></div></div></div></div>`;
}
function after3DPallet(){ const el = $('#v3dPal'); const p = R.pallets.find(x => x.uid === ui.pallet); if (el && p) mount3D(el, 'pallet-' + p.id, build3DPallet(p)); }
