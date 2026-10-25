'use strict';
/* ---------------- 3D scene (three.js, loaded as a module in the page head) ---------------- */
const T = { r: null, scene: null, cam: null, ctl: null, group: null, key: null, mount: null, ro: null, bounds: null, view: 'iso', steps: [], step: 0, play: null, pick: [], sel: null, onPick: null };
function has3D(){ return typeof window.THREE !== 'undefined' && !!window.THREE.WebGLRenderer; }
function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function ensure3D(){
  if (!has3D()) return false;
  if (T.r) return true;
  T.r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  T.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  T.scene = new THREE.Scene();
  T.cam = new THREE.PerspectiveCamera(38, 1, 1, 50000);
  if (THREE.OrbitControls) { T.ctl = new THREE.OrbitControls(T.cam, T.r.domElement); T.ctl.enableDamping = true; T.ctl.dampingFactor = .08; T.ctl.maxPolarAngle = Math.PI / 2 - .02; }
  // physically based light units: intensity x PI keeps the look of the v1 (r128) lights
  T.scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa6b5, .75 * Math.PI));
  const dl = new THREE.DirectionalLight(0xffffff, .6 * Math.PI); dl.position.set(300, 800, 500); T.scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xffffff, .25 * Math.PI); dl2.position.set(-400, 300, -300); T.scene.add(dl2);
  T.group = new THREE.Group(); T.scene.add(T.group);
  T.ro = new ResizeObserver(() => size3D());
  let down = null;
  T.r.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  T.r.domElement.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) pick3D(e); down = null; });
  const loop = () => { requestAnimationFrame(loop); if (T.mount && T.mount.isConnected) { if (T.ctl) T.ctl.update(); T.r.render(T.scene, T.cam); } };
  loop();
  return true;
}
function theme3D(){ if (T.scene) T.scene.background = new THREE.Color(css('--view3d') || '#eef2f7'); }
function size3D(){ if (!T.mount || !T.mount.isConnected) return; const w = T.mount.clientWidth, h = T.mount.clientHeight; if (!w || !h) return; T.r.setSize(w, h, false); T.cam.aspect = w / h; T.cam.updateProjectionMatrix(); }
function clear3D(){
  T.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
  while (T.group.children.length) T.group.remove(T.group.children[0]);
  T.steps = []; T.pick = []; T.sel = null; T.stepWord = ''; stopPlay();
}
function mount3D(el, key, build){
  if (!has3D()) {
    el.querySelector('.no3d')?.remove();
    el.insertAdjacentHTML('afterbegin', window.THREE_FAILED
      ? '<div class="no3d">The 3D view needs an internet connection to load. The 2D plans on this page still work.</div>'
      : '<div class="no3d">Loading 3D view…</div>');
    return;
  }
  ensure3D(); theme3D();
  el.querySelector('.no3d')?.remove();
  el.prepend(T.r.domElement);
  if (T.ro) { T.ro.disconnect(); T.ro.observe(el); }
  T.mount = el; size3D();
  clear3D();
  const b = build(T.group);
  T.bounds = b;
  if (T.key !== key && b) { T.view = 'iso'; setView('iso'); T.key = key; }
  if (T.steps.length) setStep(stepMax());
}
function stepMax(){ let m = 0; for (const o of T.steps) if (o.userData.step > m) m = o.userData.step; return m; }
function setView(v){
  const b = T.bounds; if (!b || !T.cam) return;
  T.view = v;
  const d = Math.max(b.x, b.y * 1.4, b.z) * 1.35 + 60, len = b.len || b.x, H = b.y;
  const tgt = [0, H / 2, 0];
  if (v === 'top') T.cam.position.set(0, Math.max(len, b.z * 2) * 1.25 + H, 1);
  else if (v === 'side') T.cam.position.set(0, H * .55, Math.max(len * .95, d * .8));
  else if (v === 'doors') T.cam.position.set(len / 2 + Math.max(b.z, H) * 1.9, H * .62, 0);
  else T.cam.position.set(d * .75, d * .62, d * .95);
  if (T.ctl) { T.ctl.target.set(...tgt); T.ctl.update(); } else T.cam.lookAt(...tgt);
  $$('[data-view3d]').forEach(x => x.classList.toggle('on', x.dataset.view3d === v));
}
// step-by-step loading: objects carry userData.step (1, 2, 3...); show those up to k
function setStep(k){
  const max = stepMax();
  T.step = Math.max(0, Math.min(max, k));
  for (const o of T.steps) o.visible = o.userData.step <= T.step;
  const r = $('#step3d'); if (r) { r.max = max; r.value = T.step; }
  const l = $('#step3dLbl'); if (l) l.textContent = T.step >= max ? `All ${max} ${T.stepWord || 'loaded'}` : `${T.stepWord === 'layers' ? 'Layer' : 'Step'} ${T.step} of ${max}`;
}
function stopPlay(){ if (T.play) { clearInterval(T.play); T.play = null; } const b = $('[data-act="play3d"]'); if (b) b.textContent = '▶ Play loading'; }
function togglePlay(){
  if (T.play) { stopPlay(); return; }
  if (!T.steps.length) return;
  if (T.step >= stepMax()) setStep(0);
  const b = $('[data-act="play3d"]'); if (b) b.textContent = '❚❚ Pause';
  T.play = setInterval(() => { setStep(T.step + 1); if (T.step >= stepMax()) stopPlay(); }, Math.max(160, 2400 / Math.max(1, stepMax())));
}
function pick3D(e){
  if (!T.pick.length) return;
  const rc = new THREE.Raycaster(), r = T.r.domElement.getBoundingClientRect();
  rc.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), T.cam);
  const hits = rc.intersectObjects(T.pick.filter(o => o.visible), true);
  let o = hits.length ? hits[0].object : null;
  while (o && !o.userData.info) o = o.parent;
  if (T.sel) T.sel.traverse(m => { if (m.material && m.material.emissive) m.material.emissive.setHex(0); });
  T.sel = o;
  const box = T.mount && T.mount.querySelector('.pick');
  if (!o) { if (box) box.hidden = true; return; }
  o.traverse(m => { if (m.material && m.material.emissive) m.material.emissive.setHex(0x3a3a10); });
  if (box) { box.innerHTML = o.userData.info(); box.hidden = false; }
}
function col3(f){ const c = new THREE.Color(); try { c.setStyle(f.fill); } catch (e) { c.set(0xcccccc); } return c; }
// HexaEcom mark drawn onto saved and printed 3D pictures
const BRAND = { dark: new Image(), light: new Image() };
BRAND.dark.src = '../assets/img/logo-mark.svg'; BRAND.light.src = '../assets/img/logo-mark-white.svg';
function brandedPNG(){
  const src = T.r.domElement, w = src.width, h = src.height;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.drawImage(src, 0, 0);
  const bg = T.scene.background, darkBg = bg && (bg.r + bg.g + bg.b) / 3 < .35;
  const mk = Math.max(22, Math.round(h * .055)), pad = Math.round(mk * .55), fs = Math.round(mk * .42);
  const ink = darkBg ? '#ffffff' : '#111418';
  g.globalAlpha = .72;
  g.font = `800 ${fs}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  const t1 = 'HexaEcom', t2 = 'pallet.hexaecom.com';
  g.font = `400 ${Math.round(fs * .78)}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  const w2 = g.measureText(t2).width;
  g.font = `800 ${fs}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  const tw = Math.max(g.measureText(t1).width, w2), x = w - pad - tw, y = h - pad;
  const logo = darkBg ? BRAND.light : BRAND.dark;
  if (logo.complete && logo.naturalWidth) g.drawImage(logo, x - mk * .9, y - mk, mk * 220 / 270, mk);
  g.fillStyle = ink; g.textBaseline = 'alphabetic';
  g.fillText(t1, x, y - fs * .95);
  g.font = `400 ${Math.round(fs * .78)}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  g.fillText(t2, x, y);
  g.globalAlpha = 1;
  return cv.toDataURL('image/png');
}
function export3D(){
  if (!T.r || !T.mount || !T.mount.isConnected) { toast('Open a 3D view first'); return; }
  T.r.render(T.scene, T.cam);
  const a = document.createElement('a'); a.download = 'HexaEcom-' + (T.key || 'view') + '.png'; a.href = brandedPNG(); a.click();
  track('save_3d_image');
}
// render a build function off-screen to a PNG data URL (used for the printed loading plan)
function snapshot3D(build, w = 1400, h = 620){
  if (!ensure3D()) return null;
  const keepMount = T.mount; T.mount = null;
  const keepBg = T.scene.background;
  const cv = T.r.domElement, keepSize = new THREE.Vector2(); T.r.getSize(keepSize);
  clear3D(); T.scene.background = new THREE.Color('#ffffff');
  const b = build(T.group);
  T.r.setSize(w, h, false); T.cam.aspect = w / h; T.cam.updateProjectionMatrix();
  T.bounds = b; setView('iso');
  T.r.render(T.scene, T.cam);
  const url = brandedPNG();
  clear3D(); T.scene.background = keepBg; T.key = null;
  T.r.setSize(keepSize.x || 1, keepSize.y || 1, false);
  T.mount = keepMount;
  return url;
}
