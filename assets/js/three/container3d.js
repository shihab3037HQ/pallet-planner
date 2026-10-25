'use strict';
// container shell: each wall is a plane facing inwards, so walls between the camera and the cargo disappear
function shell3D(g, L, W, H, kind){
  const wallCol = kind === 'reefer' ? 0xe9eef3 : 0xc3cad3;
  const mat = new THREE.MeshLambertMaterial({ color: wallCol, transparent: true, opacity: .55, depthWrite: false });
  const add = (w, h, pos, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat.clone()); m.position.set(...pos); m.rotation.set(...rot); g.add(m); return m; };
  add(W, H, [-L / 2, H / 2, 0], [0, Math.PI / 2, 0]);                       // front wall
  if (kind !== 'fr') {
    add(L, H, [0, H / 2, -W / 2], [0, 0, 0]);                                 // side walls
    add(L, H, [0, H / 2, W / 2], [0, Math.PI, 0]);
  } else add(W, H, [L / 2, H / 2, 0], [0, -Math.PI / 2, 0]);                 // flat rack: second end wall
  if (kind !== 'ot' && kind !== 'fr') add(L, W, [0, H, 0], [Math.PI / 2, 0, 0]); // roof
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, W), new THREE.MeshLambertMaterial({ color: kind === 'fr' ? 0x9b7b55 : (css('--cfloor3d') || '#d9dee5') }));
  floor.rotation.x = -Math.PI / 2; g.add(floor);
  const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), new THREE.LineBasicMaterial({ color: 0x1b2330, transparent: true, opacity: kind === 'fr' || kind === 'ot' ? .35 : .9 }));
  shell.position.set(0, H / 2, 0); g.add(shell);
}
function build3DContainer(C, lay){
  return g => {
    const cont = R.cont, L = cont.L, W = cont.W, H = cont.H, P = R.P, Q = R.Q;
    shell3D(g, L, W, H, cont.kind);
    for (const pl of C.place) {
      const u = pl.u, sp = pl.spot;
      const rot = Math.abs(sp.w - P) > 1;
      const cx = sp.x + sp.w / 2 - L / 2, cz = sp.y + sp.d / 2 - W / 2;
      let base = 0;
      for (const [p, o] of [[u.bottom, pl.oB], [u.top, pl.oT]]) {
        if (!p) continue;
        const grp = addPallet3D(g, p, cx, cz, base, rot, { where: `Container ${C.idx + 1}, ${esc(posText(sp))} · load #${o}` });
        grp.userData.step = o; T.steps.push(grp);
        base += p.height;
      }
    }
    return { x: L * .62, y: H, z: W, len: L };
  };
}
function build3DLoose(C){
  return g => {
    const cont = R.cont, L = cont.L, W = cont.W, H = cont.H;
    shell3D(g, L, W, H, cont.kind);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    for (const w of C.walls) {
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), w.pos.length);
      w.pos.forEach((ps, i) => {
        m4.compose(v.set(ps.x + w.d / 2 - L / 2, ps.z + w.h / 2, ps.y + w.w / 2 - W / 2), q, sc.set(w.d * .97, w.h * .97, w.w * .97));
        mesh.setMatrixAt(i, m4); mesh.setColorAt(i, col3(boxFill(ps.b)));
      });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.userData.step = w.no; T.steps.push(mesh);
      mesh.userData.info = () => wallInfoHTML(w);
      T.pick.push(mesh);
      g.add(mesh);
    }
    return { x: L * .62, y: H, z: W, len: L };
  };
}
function wallInfoHTML(w){
  const skus = [...new Set(w.boxes.map(b => b.sku))];
  return `<b>Wall ${w.no}</b> · ${esc(shipLabel(w.si))}<br>${w.boxes.length} boxes (${w.nx} across x ${Math.ceil(w.boxes.length / w.nx)} high) · ${esc(fDims(w.size.a, w.size.b, w.size.h))}<br>Box ${esc(runs(w.boxes.map(b => b.n)))} · ${esc(fW(w.weight))}<br><span class="mono">${esc(skus.slice(0, 3).join(', '))}${skus.length > 3 ? ' +' + (skus.length - 3) : ''}</span>`;
}
