'use strict';
/* ---------------- Compare view: sea vs air, containers, ULDs ---------------- */
function money(v){ return (S.cost.cur || '') + ' ' + Math.round(v).toLocaleString('en-US'); }
function viewCompare(){
  if (!S.shipments.length) return `<div class="card empty">Add shipments first, then compare sea and air.</div>`;
  const M = modeCompare();
  const sea = M.sea, air = M.air;
  let h = `<div class="card" style="margin-bottom:14px"><div class="row" style="margin-bottom:8px"><h2 style="margin:0">Sea vs air</h2><span class="spacer"></span><span class="note">Same boxes, planned both ways with your current settings.</span></div>
  <div class="vs">
    <div class="vsc ${S.mode === 'sea' ? 'on' : ''}"><div class="lbl">Sea · ${sea ? esc(sea.name) : '-'}</div>
      ${sea ? `<div class="big">${sea.n} container${sea.n > 1 ? 's' : ''}</div>
      <div>${sea.loose ? 'Floor-loaded cartons' : sea.pallets + ' pallets'} · ${sea.cbm.toFixed(1)} m³ · ${esc(fW(sea.weight))}</div>
      ${sea.cost != null ? `<div class="cost">${esc(money(sea.cost))}</div>` : ''}` : '<div class="note">Nothing fits.</div>'}
      ${S.mode !== 'sea' ? '<button class="btn small" data-act="mode" data-v="sea">Switch to sea</button>' : '<span class="badge ok">Current plan</span>'}</div>
    <div class="vsc ${S.mode === 'air' ? 'on' : ''}"><div class="lbl">Air · ${air && air.code ? esc(air.code) : 'pallets'}</div>
      ${air ? `<div class="big">${esc(fW(air.charge))} <small>chargeable</small></div>
      <div>${air.pallets} pallets${air.n ? ` on ${air.n} x ${esc(air.code)}` : ''} · ${air.cbm.toFixed(1)} m³ · gross ${esc(fW(air.gross))}</div>
      <div class="note">Loose cartons instead: ${esc(fW(air.looseCharge))} chargeable</div>
      ${air.cost != null ? `<div class="cost">${esc(money(air.cost))}</div>` : ''}` : '<div class="note">Nothing fits.</div>'}
      ${S.mode !== 'air' ? '<button class="btn small" data-act="mode" data-v="air">Switch to air</button>' : '<span class="badge ok">Current plan</span>'}</div>
  </div>
  <div class="grid3" style="margin-top:12px;max-width:620px">
    <div><span class="lbl">Currency</span><input class="inp" data-k="cost.cur" data-t="str" value="${esc(S.cost.cur)}" maxlength="5"></div>
    <div><span class="lbl">Sea rate per container</span><input class="inp" type="number" min="0" step="any" data-k="cost.sea" data-t="str" value="${esc(S.cost.sea)}" placeholder="e.g. 3200"></div>
    <div><span class="lbl">Air rate per kg</span><input class="inp" type="number" min="0" step="any" data-k="cost.air" data-t="str" value="${esc(S.cost.air)}" placeholder="e.g. 4.5"></div>
  </div>
  <div class="note" style="margin-top:6px">Enter your forwarder's rates to see a rough cost. Real quotes add fees, minimums and surcharges. Air is charged per kg of chargeable weight (the higher of gross and volume weight).</div>
  ${sea && air && sea.cost != null && air.cost != null ? `<div class="msg ${sea.cost <= air.cost ? 'ok' : 'info'}" style="margin-top:8px"><b>Estimate</b><span>${sea.cost <= air.cost ? `Sea is about ${esc(money(air.cost - sea.cost))} cheaper; air is faster.` : `Air is about ${esc(money(sea.cost - air.cost))} cheaper for this load.`}</span></div>` : ''}
  </div>`;
  if (S.mode === 'sea' && !R.loose && R.pallets.length && R.layouts) h += compareHTML();
  if (S.mode === 'air' && R.pallets.length) h += uldCompareHTML();
  return h;
}
