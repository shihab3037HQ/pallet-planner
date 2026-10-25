'use strict';
/* ---------------- state ---------------- */
function defaultState(){
  return {
    v: 2, name: 'New project', mode: 'sea', units: 'in', wunits: 'lb', colorBy: 'product',
    pallet: { preset: 'US', L: 121.92, W: 101.6, H: 13.97, wt: 20 },
    rules: { stackable: true, perPalletMax: 132.08, stackMax: 254, singleMax: 182.88,
             palletWtMax: 680.39, stackWtMax: 680.39, mixSizes: false, mixShipments: false, onEnd: false },
    sea: { type: '40HC', pattern: 'lanes', doorSpot: false, load: 'pallets', topGap: 5 },
    air: { uld: 'PMC_LD', H: 160, divisor: 6000, edge: 2.5 },
    cost: { cur: 'USD', sea: '', air: '' },
    shipments: []
  };
}
let S = defaultState();
let R = null;
const ui = { tab: 'shipments', pallet: null, cont: 0, cont3d: null, uld3d: null, importTarget: null, showOpt: 'both' };
let uidSeq = 1;
const uid = () => 'u' + (Date.now().toString(36)) + (uidSeq++);
