'use strict';
function palletMesh(g, P, Q, H, x, z, rot){
  const mat = new THREE.MeshLambertMaterial({ color: 0xb58a52 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(P, Math.min(2.2, H * .2), Q), mat);
  top.position.set(0, H - Math.min(2.2, H * .2) / 2, 0);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(P, Math.min(1.8, H * .15), Q), mat.clone());
  bot.position.set(0, Math.min(1.8, H * .15) / 2, 0);
  const grp = new THREE.Group(); grp.add(top, bot);
  const bh = H - Math.min(2.2, H * .2) - Math.min(1.8, H * .15);
  const blockGeo = new THREE.BoxGeometry(12, bh, 12);
  for (const fx of [-.5, 0, .5]) for (const fz of [-.5, 0, .5]) {
    const m = new THREE.Mesh(blockGeo, mat.clone());
    m.position.set(fx * (P - 12), Math.min(1.8, H * .15) + bh / 2, fz * (Q - 12)); grp.add(m);
  }
  grp.position.set(x, 0, z); if (rot) grp.rotation.y = Math.PI / 2;
  g.add(grp); return grp;
}
function build3DPallet(p){
  return g => {
    const P = R.P, Q = R.Q, pal = S.pallet;
    palletMesh(g, P, Q, pal.H, 0, 0, false);
    T.stepWord = 'layers';
    let y = pal.H;
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1b2330, transparent: true, opacity: .35 });
    p.layers.forEach((L, li) => {
      L.boxes.forEach((b, k) => {
        const r = L.rects[k]; const bh = L.orient.upright ? b.H : L.h;
        const geo = new THREE.BoxGeometry(r.w * .985, bh * .985, r.h * .985);
        const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: col3(boxFill(b, p)) }));
        m.position.set(r.x + r.w / 2 - P / 2, y + bh / 2, r.y + r.h / 2 - Q / 2);
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat.clone()));
        m.userData.step = li + 1; T.steps.push(m);
        m.userData.info = () => { const i = skuInfo(b.sku); return `<b>Box #${b.n}</b> · ${esc(shipLabel(b.si))}<br><span class="mono">${esc(b.sku)}</span><br>${esc(fDims(b.L, b.W, b.H))} · ${esc(fW(b.wt))} · ${b.upb} units<br>Layer ${li + 1}${i.size ? ' · size ' + esc(i.size) : ''}`; };
        T.pick.push(m);
        g.add(m);
      });
      y += L.h;
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(P * 4, Q * 4), new THREE.MeshLambertMaterial({ color: css('--floor3d') || '#dfe5ec' }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.1; g.add(floor);
    return { x: P, y: y, z: Q, len: P };
  };
}
// one pallet with its boxes as a single pickable group; boxes drawn with one InstancedMesh
function addPallet3D(g, p, cx, cz, base, rot, opts = {}){
  const P = R.P, Q = R.Q, pal = S.pallet;
  const grp = new THREE.Group();
  palletMesh(grp, P, Q, pal.H, 0, 0, rot);
  const items = [];
  let y = pal.H;
  for (const Ly of p.layers) {
    Ly.boxes.forEach((b, i) => {
      const r = Ly.rects[i]; const bh = Ly.orient.upright ? b.H : Ly.h;
      let lx = r.x + r.w / 2 - P / 2, lz = r.y + r.h / 2 - Q / 2, sw = r.w, sd = r.h;
      if (rot) { [lx, lz] = [lz, lx]; [sw, sd] = [sd, sw]; }
      items.push({ x: lx, y: y + bh / 2, z: lz, sx: sw * .97, sy: bh * .97, sz: sd * .97, c: opts.red ? new THREE.Color('#e5484d') : col3(boxFill(b, p)) });
    });
    y += Ly.h;
  }
  if (items.length) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), items.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    items.forEach((it, i) => { m4.compose(v.set(it.x, it.y, it.z), q, sc.set(it.sx, it.sy, it.sz)); mesh.setMatrixAt(i, m4); mesh.setColorAt(i, it.c); });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    grp.add(mesh);
  }
  grp.position.set(cx, base, cz);
  grp.userData.info = () => palletInfoHTML(p, opts.where);
  T.pick.push(grp);
  g.add(grp);
  return grp;
}
function palletInfoHTML(p, where){
  return `<b style="color:${shipColor(p.si)}">${esc(p.id)}</b> · ${esc(shipLabel(p.si))}<br>${p.count} boxes · ${p.layers.length} layers · ${esc(fL(p.height, 0))} · ${esc(fW(p.weight))}${where ? '<br>' + where : ''}${p.over ? '<br><b style="color:var(--err)">Outside the ULD contour</b>' : ''}<br><button class="btn small" data-pallet="${p.uid}">Open pallet sheet</button>`;
}
