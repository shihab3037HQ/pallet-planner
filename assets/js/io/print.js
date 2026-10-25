'use strict';
/* ---------------- print ---------------- */
function printDoc(){
  if (R.loose ? !R.containers.length : !R.pallets.length) { toast('Nothing to print yet'); return; }
  const snap = has3D() && $('#print3d') && $('#print3d').checked;
  const foot = n => `<div class="pfoot"><span>HexaEcom Pallet & Container Planner · pallet.hexaecom.com · ${esc(S.name || '')} · ${esc(R.ships.map(s => `${shipCode(s.si)}: ${s.sh.sid || s.sh.name || ''}`).join(' · '))}</span><span>${n}</span></div>`;
  let pg = 0; let h = '';
  // page 1 summary
  pg++;
  h += `<div class="pp"><h1>${esc(S.name || 'Pallet plan')}</h1><div class="muted" style="margin-bottom:8px">${S.mode === 'sea' ? 'Sea freight' : 'Air freight'} · ${R.loose ? 'floor-loaded cartons' : 'pallet ' + esc(fDims(S.pallet.L, S.pallet.W, S.pallet.H))} · ${S.mode === 'sea' ? esc(R.cont.name) : esc(ULDS[S.air.uld]?.name || '')}</div>${kpisHTML()}${msgsHTML()}
    ${R.loose ? '' : R.ships.map(shp => sizeTableHTML(shp)).join('')}${foot('Page ' + pg)}</div>`;
  if (R.loose) {
    R.containers.forEach((C, ci) => {
      pg++;
      h += `<div class="pp"><h1>Container ${ci + 1} of ${R.containers.length} · ${esc(R.cont.name)} · floor-loaded</h1><div style="width:80%;margin:0 auto">${looseTopSVG(C)}</div><div style="width:80%;margin:4px auto 0">${looseSideSVG(C)}</div>
        <div class="load">${C.walls.map(w => `<div><span class="o">${w.no}</span><span class="pill" style="background:${shipColor(w.si)}">${shipCode(w.si)}</span><span>box ${esc(runs(w.boxes.map(b => b.n)))}</span><span class="spacer"></span><span class="muted">${w.boxes.length} · ${esc(fW(w.weight))}</span></div>`).join('')}</div>${foot('Page ' + pg)}</div>`;
      if (snap) { const img = snapshot3D(build3DLoose(C)); if (img) { pg++; h += `<div class="pp"><h1>3D view · container ${ci + 1}</h1><img src="${img}" style="width:100%;border:1px solid #dde2e9;border-radius:6px">${foot('Page ' + pg)}</div>`; } }
    });
    $('#print').innerHTML = h; printNow(); return;
  }
  if (S.mode === 'air' && R.uldPlan && R.uldPlan.ulds.length) {
    const up = R.uldPlan;
    up.ulds.forEach(u => {
      pg++;
      const img = snap ? snapshot3D(build3DULD(u, up), 1400, 560) : null;
      h += `<div class="pp"><h1>${esc(up.U.code)} ${u.idx + 1} of ${up.ulds.length} · ${esc(up.U.name)}</h1><div class="muted">${u.place.length} pallets · gross ${esc(fW(u.gross))} of ${esc(fW(up.U.mgw))} · chargeable ${esc(fW(u.charge))}</div>
        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;align-items:start;max-width:78%;margin:0 auto">${uldTopSVG(u, up)}${uldFrontSVG(u, up)}</div>
        ${img ? `<img src="${img}" style="max-height:78mm;max-width:100%;display:block;margin:4px auto 0">` : ''}${foot('Page ' + pg)}</div>`;
    });
  }
  if (S.mode === 'sea' && R.layouts) {
    pg++;
    h += `<div class="pp"><h1>Loading options · ${esc(R.cont.name)}</h1>${['straight', 'lanes'].map(k => { const L = R.layouts[k]; if (!L || L.fs.fallback || !L.containers[0]) return ''; return `<div style="margin-bottom:6px"><b>Option ${L.fs.no} · ${esc(L.fs.name)}</b>${R.layout === L ? ' (used for these pallet sheets)' : ''} · ${L.per} floor spots · ${L.nC} container${L.nC > 1 ? 's' : ''}<div class="note">${esc(L.fs.desc)}</div><div style="width:86%;margin:0 auto">${containerSVG(L.containers[0], L)}</div></div>`; }).join('')}${foot('Page ' + pg)}</div>`;
    R.layout.containers.forEach((C, ci) => {
      pg++; h += `<div class="pp"><h1>Option ${R.layout.fs.no} · Container ${ci + 1} of ${R.layout.nC} · ${esc(R.cont.name)}</h1><div style="width:86%;margin:0 auto">${containerSVG(C, R.layout)}</div><div style="margin-top:4px">${loadListHTML(C)}</div>${foot('Page ' + pg)}</div>`;
      if (snap) { const img = snapshot3D(build3DContainer(C, R.layout)); if (img) { pg++; h += `<div class="pp"><h1>3D view · container ${ci + 1}</h1><img src="${img}" style="width:100%;border:1px solid #dde2e9;border-radius:6px">${foot('Page ' + pg)}</div>`; } }
    });
  }
  for (const p of R.pallets) {
    pg++;
    const n = p.layers.length, cols = n <= 3 ? 3 : n <= 4 ? 4 : Math.ceil(n / 2);
    const where = S.mode === 'sea' ? (p.level === 'bottom' ? `BOTTOM pallet · ${esc(p.partner.id)} goes on top` : p.level === 'top' ? `TOP pallet · goes on ${esc(p.partner.id)}` : 'SINGLE pallet') : R.uldPlan && p.uspot ? `Air pallet · ${esc(R.uldPlan.U.code)} ${p.uld + 1}, spot ${p.uspot.no}` : 'Air pallet';
    const counts = {}; p.boxes.forEach(b => { const k = fDimsCm(b.L, b.W, b.H); counts[k] = (counts[k] || 0) + 1; });
    h += `<div class="pp"><div class="row" style="gap:12px;margin-bottom:6px"><div class="code" style="background:${shipColor(p.si)};width:auto;padding:0 14px;height:52px;font-size:34px">${esc(p.id)}</div>
      <div><div style="font-size:15px;font-weight:800">${where}</div><div>${p.count} boxes · ${esc(fL(p.height, 0))} high · ${esc(fW(p.weight))} · label ${p.n}/${p.labelOf} · ${esc(S.shipments[p.si].sid || '')}${S.mode === 'sea' && p.spot ? ` · container ${p.cont + 1}, ${posText(p.spot)} (${fL(p.spot.d, 0)} side across), load #${p.order}` : ''}</div>
      <div><b>Box size:</b> ${Object.entries(counts).map(([k, c]) => `${c} boxes of ${k}`).join(' + ')}</div></div></div>
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px">${p.layers.map((L, li) => `<div><div style="font-weight:700;font-size:12px">Layer ${li + 1}${li === 0 ? ' (bottom)' : li === n - 1 ? ' (top)' : ''}</div>${layerSVG(p, li)}</div>`).join('')}</div>${foot('Page ' + pg)}</div>`;
  }
  $('#print').innerHTML = h;
  printNow();
}
function printNow(){
  // print on light paper even when the page is in dark mode
  document.documentElement.dataset.theme = 'light';
  window.addEventListener('afterprint', () => { applyTheme(); $('#print').innerHTML = ''; }, { once: true });
  setTimeout(() => window.print(), 50);
}
