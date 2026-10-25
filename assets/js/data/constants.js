'use strict';
/* ====================================================================
   Pallet & Container Planner v2 · HexaEcom
   All sizes are stored in cm and kg. Display units are converted.
   ==================================================================== */
const APP_VERSION = '2.0';
const IN = 2.54, LB = 0.45359237, E = 1e-6;
const SHIP_COLORS = ['#1d5fc4','#e07000','#1a8a4a','#7b3fbf','#c0262d','#0e8a8a','#8a6d1d','#c2185b'];
const SHIP_LIGHT  = ['#e6effc','#fdf0e2','#e5f5eb','#f1e9fa','#fdeaea','#e2f4f4','#f5efdd','#fbe6ef'];
const SIZE_COLORS = ['#5b7fa6','#c65b4a','#4f9a6b','#a47bc8','#d4a03a','#4aa3a3','#8c6d52','#d46a9a','#6b8e23','#7f8c8d'];
const PALLET_COLORS = ['#4e79a7','#f28e2b','#59a14f','#b07aa1','#e15759','#76b7b2','#edc948','#9c755f','#ff9da7','#86bcb6','#8cd17d','#d4a6c8'];
const PALLETS = {
  US:   { name: 'US 40 x 48 in (Amazon US)', L: 121.92, W: 101.6 },
  EUR:  { name: 'EUR / UK 120 x 80 cm', L: 120, W: 80 },
  ISO:  { name: 'Industrial 120 x 100 cm', L: 120, W: 100 },
  AUS:  { name: 'Australian 116.5 x 116.5 cm', L: 116.5, W: 116.5 },
  CUSTOM: { name: 'Custom size' }
};
// v1 aircraft choices, kept so v1 projects open with the same height limit
const AIRCRAFT = {
  lower:   { name: 'Passenger aircraft, lower deck', H: 160, uld: 'PMC_LD' },
  main244: { name: 'Freighter, main deck (244 cm)', H: 244, uld: 'PMC_MD244' },
  main300: { name: 'Freighter, main deck (300 cm)', H: 300, uld: 'PMC_MD300' },
  custom:  { name: 'Custom height', uld: 'NONE' }
};
const US_ROAD_KG = 19900;   // rough cargo limit for US road haulage of one container
const AMZ_BOX_KG = 22.68;   // 50 lb
