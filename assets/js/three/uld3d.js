'use strict';
function build3DULD(u, plan){
  return g => {
    const U = plan.U, L = U.L, W = U.W, H = U.H, P = R.P, Q = R.Q;
    const base = new THREE.Mesh(new THREE.BoxGeometry(L, 2, W), new THREE.MeshLambertMaterial({ color: 0xaeb6c0 }));
    base.position.y = -1; g.add(base);
    // contour: the cross-section (across W, up H) pushed along the length
    const shape = new THREE.Shape();
    const left = U.cl.map(([z, i]) => [W / 2 - i, z]), right = U.cr.map(([z, i]) => [-(W / 2 - i), z]).reverse();
    const pts = [...left, ...right];
    shape.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => shape.lineTo(p[0], p[1])); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false });
    const skin = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: U.closed ? 0x9fb4cc : 0x7fa7d9, transparent: true, opacity: U.closed ? .22 : .13, side: THREE.DoubleSide, depthWrite: false }));
    skin.rotation.y = Math.PI / 2; skin.position.x = -L / 2; g.add(skin);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), new THREE.LineBasicMaterial({ color: 0x1d4f91, transparent: true, opacity: .7 }));
    edges.rotation.y = Math.PI / 2; edges.position.x = -L / 2; g.add(edges);
    u.place.forEach((pl, k) => {
      const sp = pl.spot, rot = Math.abs(sp.w - P) > 1;
      const grp = addPallet3D(g, pl.p, sp.x + sp.w / 2 - L / 2, sp.y + sp.h / 2 - W / 2, 0, rot, { red: pl.over, where: `${esc(U.code)} ${u.idx + 1}, spot ${sp.no} (max ${esc(fL(sp.allow, 0))})` });
      grp.userData.step = k + 1; T.steps.push(grp);
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(L * 2.2, W * 2.6), new THREE.MeshLambertMaterial({ color: css('--floor3d') || '#dfe5ec' }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2.1; g.add(floor);
    return { x: L, y: H, z: W * 1.2, len: L };
  };
}
