'use strict';
/* Visitor counting with Google Analytics 4.
   Paste the Measurement ID (looks like G-XXXXXXXXXX) below to switch it on. Empty = off.
   Only page views and feature names are counted (for example "print" or "import_file").
   Shipment data, SKUs and file contents are never sent. A visitor can opt out on the guide page. */
const ANALYTICS_ID = 'G-NHPSP50KPT';

function statsOptedOut(){ try { return localStorage.getItem('pp-no-stats') === '1'; } catch (e) { return false; } }
function track(name, params){
  try { if (window.gtag && ANALYTICS_ID && !statsOptedOut()) window.gtag('event', name, params || {}); } catch (e) {}
}
(function(){
  if (!ANALYTICS_ID || statsOptedOut()) return;
  const s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ANALYTICS_ID);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ANALYTICS_ID);
})();
