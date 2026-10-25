'use strict';
/* Air cargo ULDs (unit load devices). Sizes in cm, weights in kg. Typical values only: the real contour
   depends on the aircraft type and the loading position, so always confirm with the airline or forwarder.
   L: length of the base, W: width of the base (the contour runs across W).
   H: the highest cargo allowed (base to top of contour).
   cl / cr: the contour on the left and right side as [height, inset] points. A positive inset narrows
   the shape (a sloped top corner); a negative inset widens it (the overhang "wing" of an LD3 or LD8). */
const LD_SLOPE = [[0, 0], [114, 0], [160, 40]];
const ULDS = {
  PMC_LD:    { group: 'Pallets · lower deck', code: 'PMC / P6P', name: 'PMC / P6P pallet, lower deck (160 cm)', L: 317.5, W: 243.8, H: 160, tare: 110, mgw: 5035, cl: LD_SLOPE, cr: LD_SLOPE },
  PAG_LD:    { group: 'Pallets · lower deck', code: 'PAG / P1P', name: 'PAG / P1P pallet, lower deck (160 cm)', L: 317.5, W: 223.5, H: 160, tare: 105, mgw: 4626, cl: LD_SLOPE, cr: LD_SLOPE },
  PLA:       { group: 'Pallets · lower deck', code: 'PLA', name: 'PLA half pallet, lower deck (160 cm)', L: 307.0, W: 153.4, H: 160, tare: 90, mgw: 3175, cl: [[0, 0], [160, 0]], cr: [[0, 0], [160, 0]] },
  PMC_MD244: { group: 'Pallets · main deck', code: 'PMC / P6P', name: 'PMC / P6P pallet, main deck (244 cm)', L: 317.5, W: 243.8, H: 244, tare: 110, mgw: 6804, cl: [[0, 0], [195, 0], [244, 35]], cr: [[0, 0], [195, 0], [244, 35]] },
  PAG_MD244: { group: 'Pallets · main deck', code: 'PAG / P1P', name: 'PAG / P1P pallet, main deck (244 cm)', L: 317.5, W: 223.5, H: 244, tare: 105, mgw: 6033, cl: [[0, 0], [195, 0], [244, 35]], cr: [[0, 0], [195, 0], [244, 35]] },
  PMC_MD300: { group: 'Pallets · main deck', code: 'PMC / P6P', name: 'PMC / P6P pallet, freighter main deck (300 cm)', L: 317.5, W: 243.8, H: 300, tare: 110, mgw: 6804, cl: [[0, 0], [244, 0], [300, 41]], cr: [[0, 0], [244, 0], [300, 41]] },
  AKE:       { group: 'Containers · lower deck', code: 'AKE / LD3', name: 'AKE / LD3 container (160 cm)', L: 156.2, W: 153.4, H: 160, tare: 80, mgw: 1588, closed: true, cl: [[0, 0], [160, 0]], cr: [[0, 0], [64, -47.6], [160, -47.6]] },
  DQF:       { group: 'Containers · lower deck', code: 'DQF / LD8', name: 'DQF / LD8 container (160 cm)', L: 153.4, W: 243.8, H: 160, tare: 140, mgw: 2449, closed: true, cl: [[0, 0], [64, -36.8], [160, -36.8]], cr: [[0, 0], [64, -36.8], [160, -36.8]] },
  ALP:       { group: 'Containers · lower deck', code: 'ALP / LD11', name: 'ALP / LD11 container (160 cm)', L: 317.5, W: 153.4, H: 160, tare: 200, mgw: 3176, closed: true, cl: [[0, 0], [160, 0]], cr: [[0, 0], [160, 0]] },
  NONE:      { group: 'Other', code: '', name: 'No ULD (loose pallets, custom height)' }
};
