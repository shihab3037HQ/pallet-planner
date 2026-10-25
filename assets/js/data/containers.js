'use strict';
/* Sea containers. Inside sizes in cm, payload in kg. Typical values; they vary by owner and build year.
   dW / dH: door opening. topLoad: loaded from the top or side, so the door height does not limit cargo.
   Reefer H is the height to the red load line, not the ceiling, so cold air can flow over the cargo. */
const CONTAINERS = {
  '20GP': { group: 'Dry', name: "20' Standard", L: 589.8, W: 235.2, H: 239.3, dW: 234.0, dH: 228.0, payload: 28200 },
  '20HC': { group: 'Dry', name: "20' High Cube", L: 589.8, W: 235.2, H: 269.8, dW: 234.0, dH: 258.5, payload: 28000 },
  '40GP': { group: 'Dry', name: "40' Standard", L: 1203.2, W: 235.2, H: 239.3, dW: 234.0, dH: 228.0, payload: 26700 },
  '40HC': { group: 'Dry', name: "40' High Cube", L: 1203.2, W: 235.2, H: 269.8, dW: 234.0, dH: 258.5, payload: 26500 },
  '45HC': { group: 'Dry', name: "45' High Cube", L: 1355.6, W: 235.2, H: 269.8, dW: 234.0, dH: 258.5, payload: 27700 },
  '20RF': { group: 'Reefer', kind: 'reefer', name: "20' Reefer", L: 544.0, W: 228.6, H: 216.0, dW: 228.6, dH: 222.0, payload: 27400,
            note: 'Height is to the red load line. Keep cargo below it and leave the floor T-bars clear so cold air can flow.' },
  '40RH': { group: 'Reefer', kind: 'reefer', name: "40' High Cube Reefer", L: 1158.0, W: 229.0, H: 245.0, dW: 229.0, dH: 250.0, payload: 29000,
            note: 'Height is to the red load line. Keep cargo below it and leave the floor T-bars clear so cold air can flow.' },
  '20OT': { group: 'Special', kind: 'ot', topLoad: true, name: "20' Open Top", L: 589.3, W: 234.8, H: 234.6, dW: 228.6, dH: 223.6, payload: 28100,
            note: 'Loaded from the top by crane or forklift, so the door height does not limit cargo. Cargo above the roof line is out of gauge and costs extra.' },
  '40OT': { group: 'Special', kind: 'ot', topLoad: true, name: "40' Open Top", L: 1203.2, W: 234.8, H: 234.6, dW: 228.6, dH: 223.6, payload: 26600,
            note: 'Loaded from the top by crane or forklift, so the door height does not limit cargo. Cargo above the roof line is out of gauge and costs extra.' },
  '20FR': { group: 'Special', kind: 'fr', topLoad: true, name: "20' Flat Rack", L: 562.0, W: 240.0, H: 233.0, dW: 240.0, dH: 233.0, payload: 30000,
            note: 'No side walls or roof: loaded from the side or top. Height shown is the end-wall height; higher or wider cargo is out of gauge. Cargo must be lashed.' },
  '40FR': { group: 'Special', kind: 'fr', topLoad: true, name: "40' Flat Rack", L: 1208.0, W: 224.0, H: 196.0, dW: 224.0, dH: 196.0, payload: 39000,
            note: 'No side walls or roof: loaded from the side or top. Height shown is the end-wall height; higher or wider cargo is out of gauge. Cargo must be lashed.' }
};
