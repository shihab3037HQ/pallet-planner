'use strict';
/* ---------------- tabs ---------------- */
function tabList(){
  const sea = S.mode === 'sea', loose = sea && S.sea.load === 'loose';
  const t = [['shipments', 'Shipments'], ['plan', 'Plan'], sea ? ['container', 'Container'] : ['air', 'Air · ULD']];
  if (!loose) t.push(['pallets', 'Pallets']);
  t.push(['compare', 'Compare']);
  return t;
}
function renderTabs(){
  const tabs = tabList();
  if (ui.tab === 'container' && S.mode === 'air') ui.tab = 'air';
  if (ui.tab === 'air' && S.mode === 'sea') ui.tab = 'container';
  if (!tabs.some(t => t[0] === ui.tab)) ui.tab = 'plan';
  $('#tabs').innerHTML = tabs.map(([k, n]) => `<button data-tab="${k}" class="${ui.tab === k ? 'on' : ''}" role="tab" aria-selected="${ui.tab === k}">${n}</button>`).join('');
}
function render(){
  stopPlay();
  renderTabs();
  const v = $('#view');
  if (ui.tab === 'shipments') v.innerHTML = viewShipments();
  else if (ui.tab === 'plan') v.innerHTML = viewPlan();
  else if (ui.tab === 'container') { v.innerHTML = viewContainer(); after3DContainer(); }
  else if (ui.tab === 'air') { v.innerHTML = viewAir(); after3DULD(); }
  else if (ui.tab === 'pallets') { v.innerHTML = viewPallets(); after3DPallet(); }
  else if (ui.tab === 'compare') v.innerHTML = viewCompare();
  $('#projName').value = S.name || '';
}
function msgsHTML(){
  const icon = { error: 'Problem', warn: 'Check', info: 'Note', ok: 'OK' };
  const order = { error: 0, warn: 1, ok: 2, info: 3 };
  return `<div class="msgs">${R.msgs.slice().sort((a, b) => order[a.level] - order[b.level]).map(m => `<div class="msg ${m.level}"><b>${icon[m.level]}</b><span>${m.text}</span></div>`).join('')}</div>`;
}
function kpisHTML(){
  const boxes = R.ships.reduce((a, s) => a + s.N, 0), units = R.ships.reduce((a, s) => a + s.units, 0);
  const contName = () => esc(R.cont.name.replace(' Standard', '').replace('High Cube', 'HQ'));
  let k = `<div class="kpi"><div class="k">Boxes</div><div class="v">${boxes.toLocaleString()}</div><div class="s">${units.toLocaleString()} units · ${R.ships.length} shipment${R.ships.length !== 1 ? 's' : ''}</div></div>`;
  if (R.loose) {
    const wt = R.containers.reduce((a, c) => a + c.weight, 0), cbm = R.containers.reduce((a, c) => a + c.vol, 0) / 1e6;
    k += `<div class="kpi"><div class="k">Walls of cartons</div><div class="v">${R.looseP.walls.length}</div><div class="s">floor-loaded, no pallets</div></div>
    <div class="kpi dark"><div class="k">Containers</div><div class="v">${R.containers.length} x ${contName()}</div><div class="s">${R.containers.map((c, i) => `#${i + 1}: ${c.boxes} boxes`).join(' · ') || '-'}</div></div>
    <div class="kpi"><div class="k">Cargo volume</div><div class="v">${cbm.toFixed(1)} m³</div><div class="s">${(cbm * 35.3147).toFixed(0)} cu ft</div></div>
    <div class="kpi"><div class="k">Total weight</div><div class="v">${fW(wt)}</div><div class="s">boxes only</div></div>`;
    return `<div class="kpis">${k}</div>`;
  }
  const wt = R.pallets.reduce((a, p) => a + p.weight, 0);
  k += `<div class="kpi"><div class="k">Pallets</div><div class="v">${R.pallets.length}</div><div class="s">${R.ships.map(s => `${shipCode(s.si)}: ${s.pallets.length}`).join(' · ')}</div></div>`;
  if (S.mode === 'sea') {
    const stacks = R.units.filter(u => u.top).length, per = R.layout ? R.layout.per : 0;
    k += `<div class="kpi"><div class="k">Floor spots</div><div class="v">${R.units.length}</div><div class="s">${stacks} stacks of 2 · ${R.units.length - stacks} single · ${per} per container (Option ${R.layout ? R.layout.fs.no : ''})</div></div>
    <div class="kpi dark"><div class="k">Containers</div><div class="v">${R.containers.length} x ${contName()}</div><div class="s">${R.containers.map((c, i) => `#${i + 1}: ${c.pallets} pallets`).join(' · ') || '-'}</div></div>`;
  } else if (R.air) {
    if (R.uldPlan && R.uldPlan.ulds.length) k += `<div class="kpi"><div class="k">ULDs</div><div class="v">${R.uldPlan.ulds.length} x ${esc(R.uldPlan.U.code)}</div><div class="s">${R.uldPlan.spots.length} pallet spot${R.uldPlan.spots.length > 1 ? 's' : ''} each${R.uldPlan.over ? ` · <b style="color:var(--err)">${R.uldPlan.over} too tall</b>` : ''}</div></div>`;
    k += `<div class="kpi dark"><div class="k">Chargeable weight</div><div class="v">${fW(R.air.charge)}</div><div class="s">gross ${fW(R.air.gross)} · volume ${fW(R.air.vol)}</div></div>`;
  }
  k += `<div class="kpi"><div class="k">Total weight</div><div class="v">${fW(wt)}</div><div class="s">boxes + pallets</div></div>`;
  return `<div class="kpis">${k}</div>`;
}
// 3D viewport with camera presets, step-by-step loading and a details panel for clicked items
function view3dHTML(id, o = {}){
  const views = [['iso', '3D'], ['top', 'Top'], ['side', 'Side'], ...(o.doors ? [['doors', 'Doors']] : [])];
  return `<div class="view3d ${o.tall ? 'tall' : ''}" id="${id}"><div class="pick" hidden></div><div class="wm" aria-hidden="true"><img src="../assets/img/logo-mark.svg" alt="" class="mark-ink"><span>HexaEcom</span></div><span class="hint">Drag to rotate · scroll or pinch to zoom · tap ${o.what || 'a pallet'} for details</span></div>
  <div class="tools3d">
    <div class="seg seg-sm" role="group" aria-label="Camera">${views.map(([k, n]) => `<button data-view3d="${k}" class="${k === 'iso' ? 'on' : ''}">${n}</button>`).join('')}</div>
    ${o.steps ? `<button class="btn small" data-act="play3d">▶ ${o.stepLabel || 'Play loading'}</button><input type="range" id="step3d" min="0" max="1" value="1" aria-label="Loading step"><span class="note" id="step3dLbl"></span>` : ''}
    <span class="spacer"></span><button class="btn small" data-act="png">Save 3D image</button>
  </div>`;
}
