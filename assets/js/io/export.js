'use strict';
/* ---------------- export ---------------- */
function aboutSheet(){
  return XLSX.utils.aoa_to_sheet([['HexaEcom Pallet & Container Planner'], ['https://pallet.hexaecom.com'], [], ['Project', S.name || ''], ['Created', new Date().toLocaleString()], ['Mode', S.mode === 'sea' ? (S.sea.load === 'loose' ? 'Sea, floor-loaded cartons' : 'Sea, pallets') : 'Air'], [], ['Sizes, payloads and contours are typical values. Confirm the final plan with your forwarder or airline.']]);
}
function exportExcel(){
  if (R.loose) { exportExcelLoose(); return; }
  if (!R.pallets.length) { toast('Nothing to export yet'); return; }
  const pal = [['Pallet', 'Shipment', 'Amazon shipment ID', 'Pallet label', 'Role', 'Stack partner', 'Boxes', 'Units', 'Layers', `Height (${Lu()})`, `Weight (${Wu()})`, 'Box sizes', 'Container', 'Lane', 'Spot', 'Load #', 'Box numbers']];
  for (const p of R.pallets) {
    const byShip = {}; p.boxes.forEach(b => (byShip[shipCode(b.si)] = byShip[shipCode(b.si)] || []).push(b.n));
    pal.push([p.id, shipCode(p.si), S.shipments[p.si].sid || '', `${p.n}/${p.labelOf}`, p.level || '', p.partner ? p.partner.id : '', p.count, p.units, p.layers.length, +lenVal(p.height, 1), +wtVal(p.weight, 1),
      [...new Set(p.boxes.map(b => fDimsCm(b.L, b.W, b.H)))].join(' + '), p.cont != null ? p.cont + 1 : '', p.spot ? p.spot.lane : '', p.spot ? p.spot.pos : '', p.order || '',
      Object.entries(byShip).map(([k, ns]) => (Object.keys(byShip).length > 1 ? k + ': ' : '') + runs(ns)).join(' | ')]);
  }
  const box = [['Shipment', 'Amazon shipment ID', 'Box #', 'Box label', 'SKU', 'Units', `L (${Lu()})`, `W (${Lu()})`, `H (${Lu()})`, `Weight (${Wu()})`, 'Pallet', 'Layer']];
  for (const p of R.pallets) p.layers.forEach((L, li) => L.boxes.forEach(b => box.push([shipCode(b.si), S.shipments[b.si].sid || '', b.n, `Box ${b.n} of ${R.ships[b.si].N}`, b.sku, b.upb, +lenVal(b.L), +lenVal(b.W), +lenVal(b.H), +wtVal(b.wt, 2), p.id, li + 1])));
  box.splice(1, box.length - 1, ...box.slice(1).sort((a, b) => byAscii(a[0], b[0]) || a[2] - b[2]));
  const fname = (S.name || 'pallet-plan').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');
  if (window.XLSX) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pal), 'Pallets');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(box), 'Boxes');
    if (S.mode === 'sea') {
      const ld = [['Load #', 'Container', 'Pallet', 'Lane', 'Spot', 'Level', `Height (${Lu()})`, `Weight (${Wu()})`]];
      R.pallets.slice().sort((a, b) => a.order - b.order).forEach(p => ld.push([p.order, p.cont + 1, p.id, p.spot.lane, p.spot.pos, p.level, +lenVal(p.height, 1), +wtVal(p.weight, 1)]));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ld), 'Loading plan');
      const cmp = [['Container', 'Option', 'Floor spots', 'Stacks 2 high', 'Max pallets per container', 'Containers needed', 'Last container full %']];
      compareOptions(R).forEach(r => cmp.push([r.c.name, 'Option ' + r.no + ' ' + r.name, r.per, r.two ? 'yes' : 'no', r.maxPallets, r.nC, r.lastFill]));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cmp), 'Loading options');
    }
    if (S.mode === 'air' && R.uldPlan && R.uldPlan.ulds.length) {
      const U = R.uldPlan.U, ul = [['ULD', 'Type', 'Spot', 'Pallet', `Height (${Lu()})`, `Max height at spot (${Lu()})`, `Weight (${Wu()})`, 'Outside contour']];
      R.uldPlan.ulds.forEach(u => u.place.forEach(pl => ul.push([u.idx + 1, U.code, pl.spot.no, pl.p.id, +lenVal(pl.p.height, 1), +lenVal(pl.spot.allow, 1), +wtVal(pl.p.weight, 1), pl.over ? 'YES' : ''])));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ul), 'ULDs');
    }
    XLSX.utils.book_append_sheet(wb, aboutSheet(), 'HexaEcom');
    XLSX.writeFile(wb, fname + '.xlsx');
    track('export_excel', { mode: S.mode });
  } else {
    const csv = box.map(r => r.map(c => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(',')).join('\n');
    download(new Blob([csv], { type: 'text/csv' }), fname + '_boxes.csv');
  }
}
function exportExcelLoose(){
  if (!R.containers.length) { toast('Nothing to export yet'); return; }
  const fname = (S.name || 'loading-plan').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');
  const box = [['Shipment', 'Amazon shipment ID', 'Box #', 'Box label', 'SKU', 'Units', `L (${Lu()})`, `W (${Lu()})`, `H (${Lu()})`, `Weight (${Wu()})`, 'Container', 'Wall']];
  const walls = [['Container', 'Wall', 'Shipment', 'Box numbers', 'Boxes', 'Box size', 'Across', 'High', `Weight (${Wu()})`]];
  for (const C of R.containers) for (const w of C.walls) {
    walls.push([C.idx + 1, w.no, shipCode(w.si), runs(w.boxes.map(b => b.n)), w.boxes.length, fDims(w.size.a, w.size.b, w.size.h), w.nx, Math.ceil(w.boxes.length / w.nx), +wtVal(w.weight, 1)]);
    for (const b of w.boxes) box.push([shipCode(b.si), S.shipments[b.si].sid || '', b.n, `Box ${b.n} of ${R.ships[b.si].N}`, b.sku, b.upb, +lenVal(b.L), +lenVal(b.W), +lenVal(b.H), +wtVal(b.wt, 2), C.idx + 1, w.no]);
  }
  box.splice(1, box.length - 1, ...box.slice(1).sort((a, b) => byAscii(a[0], b[0]) || a[2] - b[2]));
  if (window.XLSX) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(walls), 'Loading plan');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(box), 'Boxes');
    XLSX.utils.book_append_sheet(wb, aboutSheet(), 'HexaEcom');
    XLSX.writeFile(wb, fname + '.xlsx');
    track('export_excel', { mode: S.mode });
  } else download(new Blob([box.map(r => r.map(c => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(',')).join('\n')], { type: 'text/csv' }), fname + '_boxes.csv');
}
function download(blob, name){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
