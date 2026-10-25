'use strict';
/* ---------------- Shipments view ---------------- */
function viewShipments(){
  let h = `<div class="row" style="margin-bottom:12px"><h2 style="margin:0">Shipments</h2><span class="spacer"></span>
    <button class="btn" data-act="addShip">+ Add shipment</button>
    <button class="btn primary" data-act="importNew">Import AWD / FBA upload file (.xlsx, .csv)</button></div>
    <div class="note" style="margin-bottom:12px">Import the same Excel file you upload to Seller Central ("Merchant SKU, Units per box, Number of boxes, Box length / width / height, Box weight"). Box numbers follow Amazon's label order (SKU A to Z), so they match the printed box labels. Spot-check one label to be sure.</div>`;
  if (!S.shipments.length) return h + `<div class="card empty">No shipments yet. Import an upload file, add one by hand, or click <b>Load example</b>.</div>`;
  S.shipments.forEach((sh, si) => {
    const shp = R.ships[si];
    const sizes = [...new Set(shp.boxes.map(b => b.size))];
    const pl = shp.pallets.length, lab = +sh.labels || 0;
    h += `<div class="card" style="margin-bottom:14px">
      <div class="shipHead"><div class="code" style="background:${shipColor(si)}">${shipCode(si)}</div>
        <div style="flex:1;min-width:160px"><span class="lbl">Name</span><input class="inp" data-sh="${si}" data-f="name" value="${esc(sh.name)}"></div>
        <div style="flex:1;min-width:170px"><span class="lbl">Amazon shipment ID</span><input class="inp mono" data-sh="${si}" data-f="sid" value="${esc(sh.sid)}"></div>
        <div style="width:120px"><span class="lbl">Pallet labels</span><input class="inp" type="number" min="0" data-sh="${si}" data-f="labels" value="${esc(sh.labels)}"></div>
        <div class="row" style="align-self:flex-end"><button class="btn small" data-act="importInto" data-si="${si}">Replace from file</button><button class="btn small danger" data-act="delShip" data-si="${si}">Delete</button></div></div>
      <div class="row" style="margin-bottom:8px"><span class="badge">${shp.N} boxes</span><span class="badge">${shp.units.toLocaleString()} units</span><span class="badge">${sh.lines.length} lines</span>
        ${sizes.map(s => `<span class="badge"><span class="swatch" style="background:${s.color};vertical-align:-2px"></span> ${esc(fDims(s.a, s.b, s.h))}: ${shp.boxes.filter(b => b.size === s).length}</span>`).join('')}
        <span class="badge ${lab ? (pl === lab ? 'ok' : 'err') : ''}">${pl} pallets${lab ? ` / ${lab} labels` : ''}</span></div>
      <div class="tblwrap"><table class="t"><thead><tr><th>SKU</th><th class="n">Units / box</th><th class="n">Boxes</th><th class="n">L (${Lu()})</th><th class="n">W (${Lu()})</th><th class="n">H (${Lu()})</th><th class="n">Weight / box (${Wu()})</th><th></th></tr></thead><tbody>
      ${sh.lines.map((l, li) => `<tr>
        <td><input data-sh="${si}" data-li="${li}" data-f="sku" value="${esc(l.sku)}" class="mono"></td>
        <td class="n"><input type="number" step="any" data-sh="${si}" data-li="${li}" data-f="upb" value="${esc(l.upb)}"></td>
        <td class="n"><input type="number" step="1" data-sh="${si}" data-li="${li}" data-f="boxes" value="${esc(l.boxes)}"></td>
        <td class="n"><input type="number" step="any" data-sh="${si}" data-li="${li}" data-f="L" value="${lenVal(l.L)}"></td>
        <td class="n"><input type="number" step="any" data-sh="${si}" data-li="${li}" data-f="W" value="${lenVal(l.W)}"></td>
        <td class="n"><input type="number" step="any" data-sh="${si}" data-li="${li}" data-f="H" value="${lenVal(l.H)}"></td>
        <td class="n"><input type="number" step="any" data-sh="${si}" data-li="${li}" data-f="wt" value="${wtVal(l.wt, 2)}"></td>
        <td><button class="btn small danger" data-act="delLine" data-si="${si}" data-li="${li}" aria-label="Delete line">x</button></td></tr>`).join('')}
      </tbody></table></div>
      <div style="margin-top:8px"><button class="btn small" data-act="addLine" data-si="${si}">+ Add line</button></div></div>`;
  });
  return h;
}
