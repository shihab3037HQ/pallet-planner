'use strict';
/* ---------------- Air view ---------------- */
function viewAir(){
  if (!R.pallets.length || !R.air) return msgsHTML() + `<div class="card empty">Nothing to plan yet.</div>`;
  const A = R.air, up = R.uldPlan;
  let h = kpisHTML() + msgsHTML();
  if (up && up.ulds.length) {
    const U = up.U;
    up.ulds.forEach((u, ui3) => {
      const k3 = 'uld-' + u.idx;
      h += `<div class="card cont"><div class="contHead"><h2 style="margin:0">${esc(U.code)} ${u.idx + 1} of ${up.ulds.length}</h2>
        <span class="badge">${esc(U.name)}</span><span class="badge">${u.place.length} of ${up.spots.length} spots</span>
        <span class="badge ${u.gross > U.mgw ? 'err' : ''}">gross ${esc(fW(u.gross))} of ${esc(fW(U.mgw))}</span><span class="badge">chargeable ${esc(fW(u.charge))}</span><span class="badge">${Math.round(u.fillVol * 100)}% of contour volume</span>
        ${u.place.some(p => p.over) ? '<span class="badge err">outside contour</span>' : ''}
        <span class="spacer"></span><button class="btn small" data-act="show3dUld" data-k3="${k3}">${ui.uld3d === k3 ? 'Hide 3D' : 'Show 3D'}</button></div>
        ${ui.uld3d === k3 ? view3dHTML('v3dUld', { steps: true }) : ''}
        <div class="uldviews"><div class="paper"><div class="lbl">Top view</div>${uldTopSVG(u, up)}</div><div class="paper"><div class="lbl">End view (contour)</div>${uldFrontSVG(u, up)}</div></div>
        <div class="load" style="margin-top:8px">${u.place.map(pl => `<div><span class="o">${pl.spot.no}</span><span class="pill" style="background:${pl.over ? 'var(--err)' : shipColor(pl.p.si)}">${esc(pl.p.id)}</span><span>${pl.p.count} boxes</span><span class="spacer"></span><span class="muted">${esc(fL(pl.p.height, 0))} · ${esc(fW(pl.p.weight))}</span></div>`).join('')}</div></div>`;
    });
  } else if (ULDS[S.air.uld] && !ULDS[S.air.uld].L) h += `<div class="card note" style="margin-bottom:14px">No ULD selected. Pick an air pallet or container in the sidebar to see how the pallets build up.</div>`;
  h += `<div class="card" style="margin-bottom:14px"><h2>Air freight pallets</h2><div class="tblwrap" style="max-height:none"><table class="t"><thead><tr><th>Pallet</th><th>Shipment</th><th class="n">Boxes</th><th class="n">L x W x H (${Lu()})</th><th class="n">Gross (${Wu()})</th><th class="n">Volume wt (${Wu()})</th><th class="n">Chargeable (${Wu()})</th>${up ? '<th>ULD</th>' : ''}</tr></thead><tbody>
  ${A.rows.map(r => `<tr><td><span class="pill" style="background:${r.p.over ? 'var(--err)' : shipColor(r.p.si)}">${esc(r.p.id)}</span></td><td class="mono">${esc(S.shipments[r.p.si].sid || '')}</td><td class="n">${r.p.count}</td>
    <td class="n">${esc([R.P, R.Q, r.p.height].map(x => lenVal(x, 1)).join(' x '))}</td><td class="n">${wtVal(r.gross, 0)}</td><td class="n">${wtVal(r.vol, 0)}</td><td class="n"><b>${wtVal(r.charge, 0)}</b></td>${up ? `<td>${r.p.uspot ? esc(up.U.code) + ' ' + (r.p.uld + 1) + ' · spot ' + r.p.uspot.no : '-'}</td>` : ''}</tr>`).join('')}
  <tr><td colspan="4"><b>Total</b></td><td class="n"><b>${wtVal(A.gross, 0)}</b></td><td class="n"><b>${wtVal(A.vol, 0)}</b></td><td class="n"><b>${wtVal(A.charge, 0)}</b></td>${up ? '<td></td>' : ''}</tr></tbody></table></div>
  <div class="note" style="margin-top:8px">For comparison, the same boxes sent loose: gross ${esc(fW(A.loose.w))}, volume weight ${esc(fW(A.loose.v))}, chargeable ${esc(fW(Math.max(A.loose.w, A.loose.v)))}. Airlines and forwarders round and may add their own minimums.</div></div>`;
  h += uldCompareHTML();
  return h;
}
function uldCompareHTML(){
  const rows = uldCompare(R);
  if (!rows.length || !R.pallets.length) return '';
  const ok = rows.filter(r => r.n && !r.over), best = ok.length ? Math.min(...ok.map(r => r.n)) : null;
  return `<div class="card"><h3>Compare ULDs</h3><div class="note" style="margin-bottom:6px">For these ${R.pallets.length} pallets (built for the current height limit). Click a row to use it.</div><div class="tblwrap" style="max-height:none"><table class="t"><thead><tr><th>ULD</th><th class="n">Pallet spots</th><th class="n">Tallest spot</th><th class="n">ULDs needed</th><th class="n">Too tall</th><th class="n">Chargeable</th></tr></thead><tbody>
  ${rows.map(r => `<tr data-uld="${r.k}" class="click ${r.k === S.air.uld ? 'on' : ''}"><td>${esc(r.U.name)}</td><td class="n">${r.per || '<span class="muted">pallet too big</span>'}</td><td class="n">${r.per ? esc(fL(r.maxAllow, 0)) : '-'}</td><td class="n">${r.per ? (r.n === best && !r.over ? `<span class="badge ok">${r.n}</span>` : r.n) : '-'}</td><td class="n">${r.over ? `<span class="badge err">${r.over}</span>` : r.per ? '0' : '-'}</td><td class="n">${r.per ? esc(fW(r.charge)) : '-'}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}
function after3DULD(){
  const el = $('#v3dUld'); if (!el || !ui.uld3d || !R.uldPlan) return;
  const u = R.uldPlan.ulds[+ui.uld3d.split('-')[1]];
  if (u) mount3D(el, 'uld-' + S.air.uld + '-' + (u.idx + 1), build3DULD(u, R.uldPlan));
}
