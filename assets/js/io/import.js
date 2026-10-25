'use strict';
/* ---------------- import ---------------- */
function parseRows(rows){
  let hi = -1;
  for (let i = 0; i < Math.min(rows.length, 40); i++) if ((rows[i] || []).some(c => /^\s*(merchant\s*sku|sku|seller\s*sku)\s*$/i.test(String(c ?? '')))) { hi = i; break; }
  if (hi < 0) return null;
  const head = rows[hi].map(c => String(c ?? ''));
  const find = re => head.findIndex(h => re.test(h));
  const col = { sku: find(/^\s*(merchant\s*sku|sku|seller\s*sku)\s*$/i), qty: find(/^\s*(quantity|total units|units)\s*$/i), upb: find(/units?\s*(per|\/)\s*box|per\s*box/i), boxes: find(/number of boxes|^\s*boxes\s*$|box count|cartons/i), L: find(/length/i), W: find(/width/i), H: find(/height/i), wt: find(/weight/i) };
  if (col.boxes < 0 || col.L < 0 || col.W < 0 || col.H < 0) return null;
  const lenCm = /\(\s*cm\s*\)/i.test(head[col.L]), wKg = col.wt >= 0 && /\(\s*kg\s*\)/i.test(head[col.wt]);
  const num = v => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const lines = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i] || []; const sku = String(r[col.sku] ?? '').trim();
    if (!sku) continue;
    const boxes = Math.round(num(r[col.boxes])); if (boxes <= 0) continue;
    let upb = col.upb >= 0 ? num(r[col.upb]) : 0; if (!upb && col.qty >= 0) upb = num(r[col.qty]) / boxes;
    const k = lenCm ? 1 : IN, kw = wKg ? 1 : LB;
    const L = num(r[col.L]) * k, W = num(r[col.W]) * k, H = num(r[col.H]) * k;
    if (!(L > 0 && W > 0 && H > 0)) continue;
    lines.push({ sku, upb: Math.round(upb * 100) / 100, boxes, L, W, H, wt: col.wt >= 0 ? num(r[col.wt]) * kw : 0 });
  }
  return lines;
}
function importFile(file, targetSi){
  if (!window.XLSX) { toast('Excel import needs an internet connection to load the reader'); return; }
  const fr = new FileReader();
  fr.onload = e => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const names = wb.SheetNames.slice().sort((a, b) => (/template/i.test(b) ? 1 : 0) - (/template/i.test(a) ? 1 : 0)).filter(n => !/example|definition|instruction/i.test(n));
      let lines = null;
      for (const n of names) { lines = parseRows(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' })); if (lines && lines.length) break; }
      if (!lines || !lines.length) { toast('No box lines found. Needs columns like Merchant SKU, Number of boxes, Box length/width/height.'); return; }
      const base = file.name.replace(/\.[^.]+$/, '');
      const sid = (base.match(/(STAR|FBA)[-_A-Z0-9]{6,}/i) || [''])[0];
      if (targetSi != null && S.shipments[targetSi]) { S.shipments[targetSi].lines = lines; toast(`Replaced ${lines.length} lines`); }
      else { S.shipments.push({ uid: uid(), name: base.slice(0, 60), sid, labels: '', lines }); toast(`Imported ${lines.length} lines, ${lines.reduce((a, l) => a + l.boxes, 0)} boxes`); }
      changed(true);
      track('import_file', { lines: lines.length });
    } catch (err) { console.error(err); toast('Could not read that file'); }
  };
  fr.readAsArrayBuffer(file);
}
