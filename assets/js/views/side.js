'use strict';
/* ---------------- sidebar ---------------- */
function numInput(key, type, attrs = ''){
  const v = getPath(S, key);
  const shown = type === 'len' ? lenVal(v) : type === 'wt' ? wtVal(v, 1) : v;
  return `<input class="inp" type="number" step="any" data-k="${key}" data-t="${type}" value="${esc(shown)}" ${attrs}>`;
}
function groupedOpts(obj, cur){
  const groups = new Map();
  for (const [k, p] of Object.entries(obj)) { if (!groups.has(p.group)) groups.set(p.group, []); groups.get(p.group).push(`<option value="${k}" ${cur === k ? 'selected' : ''}>${esc(p.name)}</option>`); }
  return [...groups].map(([g, o]) => `<optgroup label="${esc(g)}">${o.join('')}</optgroup>`).join('');
}
function renderSide(){
  const pal = S.pallet, c = CONTAINERS[S.sea.type], sea = S.mode === 'sea', loose = sea && S.sea.load === 'loose';
  const U = ULDS[S.air.uld] || ULDS.NONE;
  const presetOpts = Object.entries(PALLETS).map(([k, p]) => `<option value="${k}" ${pal.preset === k ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  const divs = [[6000, '6000 (IATA standard)'], [5000, '5000 (couriers, express)'], [7000, '7000 (some airlines)']];
  const divCustom = ui.divCustom || !divs.some(d => d[0] === +S.air.divisor);
  $('#side').innerHTML = `
  <div class="card">
    <span class="lbl">Shipping mode</span>
    <div class="seg" data-seg="mode"><button data-v="sea" class="${sea ? 'on' : ''}">Sea (container)</button><button data-v="air" class="${!sea ? 'on' : ''}">Air freight</button></div>
    ${sea ? `<div style="margin-top:10px"><span class="lbl">Load as</span><div class="seg" data-seg="sea.load"><button data-v="pallets" class="${!loose ? 'on' : ''}">Pallets</button><button data-v="loose" class="${loose ? 'on' : ''}">Loose cartons</button></div></div>` : ''}
    <div class="grid2" style="margin-top:10px">
      <div><span class="lbl">Length</span><div class="seg" data-seg="units"><button data-v="in" class="${S.units === 'in' ? 'on' : ''}">in</button><button data-v="cm" class="${S.units === 'cm' ? 'on' : ''}">cm</button></div></div>
      <div><span class="lbl">Weight</span><div class="seg" data-seg="wunits"><button data-v="lb" class="${S.wunits === 'lb' ? 'on' : ''}">lb</button><button data-v="kg" class="${S.wunits === 'kg' ? 'on' : ''}">kg</button></div></div>
    </div>
    <div style="margin-top:10px"><span class="lbl">Colour boxes by</span>
      <select class="sel" data-k="colorBy" data-t="str">${[['product', 'Product colour (from SKU)'], ['size', 'Box size'], ['shipment', 'Shipment'], ...(loose ? [] : [['pallet', 'Pallet']])].map(([k, n]) => `<option value="${k}" ${S.colorBy === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
  </div>
  ${loose ? `<details class="card" open><summary>Floor-loaded cartons</summary><div class="body">
    <div class="note">Cartons are stacked in walls straight on the container floor, from the front wall to the doors. Each wall holds one box size of one shipment.</div>
    <div><span class="lbl">Gap left at the top (${Lu()})</span>${numInput('sea.topGap', 'len')}</div>
    <label class="chk"><input type="checkbox" data-k="rules.onEnd" data-t="bool" ${S.rules.onEnd ? 'checked' : ''}><span><b>Allow boxes on their side</b><br><span class="note">Can fit more, but check "This side up" markings.</span></span></label>
  </div></details>` : `
  <details class="card" open><summary>Pallet</summary><div class="body">
    <div><span class="lbl">Pallet size</span><select class="sel" data-k="pallet.preset" data-t="preset">${presetOpts}</select></div>
    ${pal.preset !== 'US' ? `<div class="warnbox">Amazon US needs 40 x 48 in pallets. A 120 x 80 cm (EUR/UK) pallet fits far fewer boxes per layer.</div>` : ''}
    <div class="grid2"><div><span class="lbl">Length (${Lu()})</span>${numInput('pallet.L', 'len', pal.preset !== 'CUSTOM' ? 'disabled' : '')}</div><div><span class="lbl">Width (${Lu()})</span>${numInput('pallet.W', 'len', pal.preset !== 'CUSTOM' ? 'disabled' : '')}</div></div>
    <div class="hl"><span class="lbl">Empty pallet height (${Lu()})</span>${numInput('pallet.H', 'len')}<div class="note" style="margin-top:4px">Measure the real pallet. This number decides how many layers fit.</div></div>
    <div><span class="lbl">Empty pallet weight (${Wu()})</span>${numInput('pallet.wt', 'wt')}</div>
  </div></details>
  <details class="card" open><summary>${sea ? 'Height & weight limits' : 'Air: ULD & limits'}</summary><div class="body">
    ${sea ? `
    <label class="chk"><input type="checkbox" data-k="rules.stackable" data-t="bool" ${S.rules.stackable ? 'checked' : ''}><span><b>Stackable pallets</b> (2 high)</span></label>
    ${S.rules.stackable ? `
    <div class="grid2"><div><span class="lbl">Max per pallet (${Lu()})</span>${numInput('rules.perPalletMax', 'len')}</div><div><span class="lbl">Max stack of 2 (${Lu()})</span>${numInput('rules.stackMax', 'len')}</div></div>
    <div class="note">Amazon: about 50 in per stackable pallet, 100 in for a stack of two.</div>` : `
    <div><span class="lbl">Max pallet height (${Lu()})</span>${numInput('rules.singleMax', 'len')}</div><div class="note">Amazon: 72 in for a single pallet.</div>`}
    ` : `
    <div><span class="lbl">ULD (air pallet or container)</span><select class="sel" data-k="air.uld" data-t="uld">${groupedOpts(ULDS, S.air.uld)}</select></div>
    ${U.L ? `<div class="note">Base ${esc(fDims(U.L, U.W, 0).replace(/ x 0 .*/, ''))} ${Lu()} · contour ${esc(fL(U.H, 0))} high · max gross ${esc(fW(U.mgw))} (tare ${esc(fW(U.tare))}). Typical values; contours differ by aircraft.</div>` : ''}
    <div class="grid2"><div><span class="lbl">Max cargo height (${Lu()})</span>${numInput('air.H', 'len')}</div>${U.L ? `<div><span class="lbl">Edge clearance (${Lu()})</span>${numInput('air.edge', 'len')}</div>` : ''}</div>
    <div><span class="lbl">Volume divisor</span><select class="sel" data-k="air.divisor" data-t="divisor">${divs.map(([v, n]) => `<option value="${v}" ${+S.air.divisor === v ? 'selected' : ''}>${n}</option>`).join('')}<option value="custom" ${divCustom ? 'selected' : ''}>Custom…</option></select></div>
    ${divCustom ? `<div>${numInput('air.divisor', 'num')}</div>` : ''}
    <div class="note">Also capped at the Amazon single-pallet limit of ${esc(fL(S.rules.singleMax, 0))}. Volume weight = L x W x H cm / divisor.</div>`}
    <div class="grid2"><div><span class="lbl">Max per pallet (${Wu()})</span>${numInput('rules.palletWtMax', 'wt')}</div>${sea && S.rules.stackable ? `<div><span class="lbl">Max per stack (${Wu()})</span>${numInput('rules.stackWtMax', 'wt')}</div>` : ''}</div>
  </div></details>
  <details class="card" open><summary>Packing rules</summary><div class="body">
    <div class="note">Always on: no overhang, full flat layers, only the top layer can be part full, pallets with a part-full top go on top of a stack.</div>
    <label class="chk"><input type="checkbox" data-k="rules.mixSizes" data-t="bool" ${S.rules.mixSizes ? 'checked' : ''}><span><b>Mix box sizes on a pallet</b><br><span class="note">Off: every pallet holds one box size (pallets grouped by size). On: fewer pallets.</span></span></label>
    <label class="chk"><input type="checkbox" data-k="rules.mixShipments" data-t="bool" ${S.rules.mixShipments ? 'checked' : ''}><span><b>Let one pallet carry 2 shipments</b><br><span class="note">Only used when a shipment needs more pallets than its pallet labels.</span></span></label>
    <label class="chk"><input type="checkbox" data-k="rules.onEnd" data-t="bool" ${S.rules.onEnd ? 'checked' : ''}><span><b>Allow boxes on their side</b><br><span class="note">Can fit more, but check "This side up" markings.</span></span></label>
  </div></details>`}
  ${sea ? `<details class="card" open><summary>Container</summary><div class="body">
    <div><span class="lbl">Container type</span><select class="sel" data-k="sea.type" data-t="str">${groupedOpts(CONTAINERS, S.sea.type)}</select></div>
    <div class="note">Inside ${esc(fDims(c.L, c.W, c.H))}${c.topLoad ? ' · loaded from the top' : ` · door ${esc(fDims(c.dW, c.dH, 0).replace(/ x 0 .*/, ''))} ${Lu()}`} · payload about ${esc(fW(c.payload))}. Typical sizes; check with your carrier.</div>
    ${c.note ? `<div class="note hl">${esc(c.note)}</div>` : ''}
    ${loose ? '' : `<div><span class="lbl">Loading option for pallet sheets</span><select class="sel" data-k="sea.pattern" data-t="str"><option value="straight" ${S.sea.pattern === 'straight' ? 'selected' : ''}>Option 1 · Straight rows (all ${esc(fL(Math.min(pal.L, pal.W), 0))} across)</option><option value="lanes" ${S.sea.pattern === 'lanes' ? 'selected' : ''}>Option 2 · Two lanes (${esc(fL(Math.max(pal.L, pal.W), 0))} + ${esc(fL(Math.min(pal.L, pal.W), 0))} across)</option></select></div>
    <div class="note">The Container tab shows both options. The one chosen here is used for pallet sheets, print and Excel.</div>
    <label class="chk"><input type="checkbox" data-k="sea.doorSpot" data-t="bool" ${S.sea.doorSpot ? 'checked' : ''}><span>Option 1: turn extra pallets into the space at the doors <span class="note">(only if it fits)</span></span></label>`}
  </div></details>` : ''}
  <div class="note" style="padding:0 4px">Rules and sizes are typical values. Always confirm the final plan with your forwarder.</div>
  <div class="card helpcard"><b>Need help shipping?</b><div class="note">Ask the HexaEcom team about Amazon inbound and your pallet plan.</div>
    <div class="row" style="margin-top:8px"><a class="btn small wa" href="https://wa.me/8801723252489?text=Hi%20HexaEcom%2C%20I%20found%20you%20on%20the%20Pallet%20Planner." target="_blank" rel="noopener" data-track="contact_whatsapp">WhatsApp</a><a class="btn small" href="mailto:shihabhexa@gmail.com?subject=Shipping%20help%20(Pallet%20Planner)" data-track="contact_email">Email</a><a class="btn small" href="https://hexaecom.com" data-track="contact_website">hexaecom.com</a></div></div>`;
}
