'use strict';
/* ---------------- share by link ----------------
   The whole project is compressed into the part of the link after "#".
   Browsers never send that part to the server, so nothing is uploaded. */
function b64url(bytes){
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(str){
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
async function packState(obj){
  const data = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'undefined') return 'j' + b64url(data);
  const buf = await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
  return 'z' + b64url(new Uint8Array(buf));
}
async function unpackState(str){
  const kind = str[0], bytes = unb64url(str.slice(1));
  let text;
  if (kind === 'z') text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  else text = new TextDecoder().decode(bytes);
  return JSON.parse(text);
}
async function shareLink(){
  if (!S.shipments.length) { toast('Add a shipment first'); return; }
  const url = location.origin + location.pathname + '#p=' + await packState(S);
  const long = url.length > 8000;
  openModal(`<h2>Share this plan</h2>
    <p class="note">Anyone with this link can open a copy of this plan, <b>including SKUs and shipment IDs</b>. The plan is stored inside the link itself; nothing is uploaded to a server.</p>
    <div class="row" style="flex-wrap:nowrap"><input class="inp mono" id="shareUrl" readonly value="${esc(url)}"><button class="btn primary" data-act="copyShare">Copy</button></div>
    ${long ? `<div class="msg warn" style="margin-top:8px"><b>Long link</b><span>This link is ${url.length.toLocaleString()} characters. Some chat and email apps cut long links; use <b>Save</b> to send a project file instead.</span></div>` : ''}
    <div class="row" style="margin-top:12px"><span class="spacer"></span><button class="btn" data-act="closeModal">Close</button></div>`);
  $('#shareUrl').select();
}
async function readSharedLink(){
  const m = location.hash.match(/^#p=([\w-]+)$/);
  if (!m) return false;
  try {
    S = normalize(await unpackState(m[1]));
    ui.tab = 'plan'; ui.pallet = null; ui.cont3d = null; ui.uld3d = null;
    history.replaceState(null, '', location.pathname + location.search);
    changed(true);
    toast('Opened a shared plan. Your own changes are saved in this browser.');
    return true;
  } catch (e) { console.error(e); toast('That share link is damaged or incomplete'); return false; }
}
