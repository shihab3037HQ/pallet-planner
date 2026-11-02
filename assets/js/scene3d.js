// Landing page 3D: a shipping container that fills with US pallets (40 x 48 in), two high, in the
// "two lanes" floor pattern the planner uses. One lane has pallets lengthwise, the other crosswise,
// which is how 20 US pallets fit on the floor of a 40 ft container (see learn/pallets-per-container).
// Every <div class="scene3d" data-box="40hc"> on the page gets its own scene; buttons with
// data-pick-box="20" inside the same section switch the container.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Inside sizes in cm (length, width, height): typical values, as in the planner.
const BOXES = {
  '20':   { name: "20' Standard",  l: 589,  w: 235, h: 239 },
  '40':   { name: "40' Standard",  l: 1203, w: 235, h: 239 },
  '40hc': { name: "40' High Cube", l: 1203, w: 235, h: 269 },
  '45hc': { name: "45' High Cube", l: 1355, w: 235, h: 269 },
};
const PAL = { l: 121.9, w: 101.6, base: 14, load: 108 };   // 48 x 40 in pallet, 5.5 in base, 48 in total
const GAP = 1.5;
// one colour per pallet (the planner colours boxes by SKU), in HexaEcom blues with some amber and mint
const COLORS = [0x3d6bff, 0x6f93ff, 0x3d6bff, 0xffb03b, 0x5b82ff, 0x22c993, 0x9db8ff, 0x3d6bff, 0xffb03b, 0x6f93ff];
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

// Floor spots for the two-lanes pattern: lane 1 lengthwise, lane 2 crosswise.
function spots(box) {
  const out = [];
  const lane1 = Math.floor(box.l / (PAL.l + GAP)), lane2 = Math.floor(box.l / (PAL.w + GAP));
  for (let i = 0; i < Math.max(lane1, lane2); i++) {
    if (i < lane1) out.push({ x: i * (PAL.l + GAP) + PAL.l / 2, z: PAL.w / 2, rot: false });
    if (i < lane2) out.push({ x: i * (PAL.w + GAP) + PAL.w / 2, z: PAL.w + GAP + PAL.l / 2, rot: true });
  }
  return out;
}

function palletGroup(rot, seed, load) {
  const g = new THREE.Group();
  const L = rot ? PAL.w : PAL.l, W = rot ? PAL.l : PAL.w;
  const wood = new THREE.Mesh(new THREE.BoxGeometry(L, PAL.base, W), new THREE.MeshStandardMaterial({ color: 0xc8925a, roughness: .9 }));
  wood.position.y = PAL.base / 2;
  g.add(wood);
  // cartons: 3 x 2 per layer, 4 layers
  const nx = 3, nz = 2, ny = 4, bx = L / nx, bz = W / nz, by = load / ny;
  const geo = new THREE.BoxGeometry(bx - 1.6, by - 1.6, bz - 1.6);
  const mat = new THREE.MeshStandardMaterial({ roughness: .55 });
  const inst = new THREE.InstancedMesh(geo, mat, nx * ny * nz);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  let k = 0;
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) for (let z = 0; z < nz; z++) {
    m.makeTranslation(-L / 2 + bx * (x + .5), PAL.base + by * (y + .5), -W / 2 + bz * (z + .5));
    inst.setMatrixAt(k, m);
    inst.setColorAt(k, c.setHex(COLORS[seed % COLORS.length]).offsetHSL(0, 0, ((x + y + z) % 2) * .045));
    k++;
  }
  g.add(inst);
  return g;
}

function makeScene(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  el.appendChild(renderer.domElement);
  el.classList.add('live');
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4e0, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-600, 900, 700); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(32, 1, 10, 20000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false;
  controls.autoRotate = !still; controls.autoRotateSpeed = .6;
  controls.minPolarAngle = .5; controls.maxPolarAngle = 1.35;
  if (coarse) { controls.enabled = false; renderer.domElement.style.touchAction = 'pan-y'; }

  const world = new THREE.Group(); scene.add(world);
  let pallets = [], t0 = 0, box = null;

  function build(key) {
    box = BOXES[key] || BOXES['40hc'];
    world.clear(); pallets = [];
    const shell = new THREE.Mesh(new THREE.BoxGeometry(box.l, box.h, box.w),
      new THREE.MeshBasicMaterial({ color: 0x3d6bff, transparent: true, opacity: .06, depthWrite: false }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry), new THREE.LineBasicMaterial({ color: 0x3d6bff }));
    shell.position.set(box.l / 2, box.h / 2, box.w / 2); edges.position.copy(shell.position);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(box.l, 3, box.w), new THREE.MeshStandardMaterial({ color: 0xdfe6f5 }));
    floor.position.set(box.l / 2, -1.5, box.w / 2);
    world.add(floor, shell, edges);
    const floorSpots = spots(box);
    // two high, with the load kept under half the inside height (lower stacks in standard boxes)
    const high = 2, load = Math.min(PAL.load, (box.h - 6) / 2 - PAL.base);
    floorSpots.forEach((s, i) => {
      for (let level = 0; level < high; level++) {
        const p = palletGroup(s.rot, i + level * 3, load);
        const y = level * (PAL.base + load + 1);
        p.position.set(s.x, y, s.z);
        p.userData = { y, order: level * floorSpots.length + i };
        world.add(p); pallets.push(p);
      }
    });
    world.position.set(-box.l / 2, -box.h / 2, -box.w / 2);
    const d = box.l * 1.12 + 330;
    camera.position.set(d * .58, d * .4, d * .74);
    controls.target.set(0, -20, 0);
    controls.update();
    t0 = performance.now();
    el.dispatchEvent(new CustomEvent('scene:built', { bubbles: true, detail: { name: box.name, floor: floorSpots.length, total: pallets.length, high } }));
  }

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  let visible = true, raf = 0;
  function frame(now) {
    raf = 0;
    const step = 140, fall = 520;
    pallets.forEach(p => {
      const k = still ? 1 : Math.min(1, Math.max(0, (now - t0 - p.userData.order * step) / fall));
      const e = 1 - Math.pow(1 - k, 3);
      p.position.y = p.userData.y + (1 - e) * 260;
      p.visible = k > 0;
    });
    controls.update();
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) raf = requestAnimationFrame(frame); }

  new ResizeObserver(() => { resize(); start(); }).observe(el);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: .05 }).observe(el);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  build(el.dataset.box);
  resize(); start();
  return { build: key => { build(key); start(); } };
}

function webgl() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

if (webgl()) {
  document.querySelectorAll('.scene3d').forEach(el => {
    const s = makeScene(el);
    const section = el.closest('section') || document;
    section.querySelectorAll('[data-pick-box]').forEach(b => b.addEventListener('click', () => {
      section.querySelectorAll('[data-pick-box]').forEach(o => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
      s.build(b.dataset.pickBox);
    }));
  });
}
// The counts under a picker follow the scene ("20 pallets on the floor").
document.addEventListener('scene:built', e => {
  const out = e.target.closest('section')?.querySelector('[data-scene-count]');
  if (!out) return;
  const d = e.detail;
  out.innerHTML = `<b>${d.name}</b>: ${d.floor} US pallets on the floor` + (d.high > 1 ? `, ${d.total} stacked two high` : '');
});
