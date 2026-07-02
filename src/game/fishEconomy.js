export const fishPricePerKg = {
  rotan: 50,
  crucian: 120,
  bleak: 80,
  roach: 90,
  rudd: 110,
  loach: 120,
  pike: 300,
  okun: 150,
  lynok: 180,
  sudak: 350,
  som: 350,
  canadian_catfish: 160,
  carp: 180,
  grass_carp: 220,
  silver_carp: 170,
  white_bream: 130,
  bream: 180,
  plotytsia: 80,
  gudgeon: 70,
  eel: 900,
};

export function getFishPricePerKg(fishId) {
  return fishPricePerKg[fishId] ?? 100;
}

