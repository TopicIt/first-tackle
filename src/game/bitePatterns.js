export const castZones = ['near_bank', 'mid_water', 'reed_edge'];

export const castSpots = [
  {
    id: 'dam_edge',
    labelKey: 'castSpotDamEdge',
    zone: 'near_bank',
    target: { x: 24, y: 67 },
    radius: { x: 9, y: 6 },
    scale: 1.18,
    allowedMethods: ['handline', 'stickRod'],
    weights: { rotan: 4.8, crucian: 1.2, loach: 0.18, bleak: 0.45 },
  },
  {
    id: 'shallow_weeds',
    labelKey: 'castSpotShallowWeeds',
    zone: 'near_bank',
    target: { x: 36, y: 57 },
    radius: { x: 10, y: 7 },
    scale: 1.04,
    allowedMethods: ['handline', 'stickRod'],
    weights: { rotan: 2.4, crucian: 2.2, rudd: 1.8, roach: 0.7 },
  },
  {
    id: 'open_middle',
    labelKey: 'castSpotOpenMiddle',
    zone: 'mid_water',
    target: { x: 53, y: 46 },
    radius: { x: 13, y: 8 },
    scale: 0.92,
    allowedMethods: ['stickRod'],
    weights: { crucian: 3.8, roach: 2.1, bleak: 1.8, rudd: 0.6 },
  },
  {
    id: 'reed_pocket',
    labelKey: 'castSpotReedPocket',
    zone: 'reed_edge',
    target: { x: 72, y: 43 },
    radius: { x: 10, y: 8 },
    scale: 0.86,
    allowedMethods: ['stickRod'],
    weights: { rudd: 3.5, roach: 1.9, crucian: 1.6, pike: 0.16 },
  },
  {
    id: 'muddy_bottom',
    labelKey: 'castSpotMuddyBottom',
    zone: 'mid_water',
    target: { x: 58, y: 66 },
    radius: { x: 12, y: 7 },
    scale: 0.94,
    allowedMethods: ['stickRod'],
    weights: { loach: 0.28, crucian: 2.4, rotan: 0.8, roach: 0.7 },
  },
  {
    id: 'far_shadow',
    labelKey: 'castSpotFarShadow',
    zone: 'reed_edge',
    target: { x: 84, y: 32 },
    radius: { x: 10, y: 6 },
    scale: 0.72,
    allowedMethods: ['betterLine'],
    weights: { pike: 0.42, crucian: 2.4, roach: 1.8, rudd: 1.8 },
  },
  {
    id: 'greada_mud',
    labelKey: 'castSpotGreadaMud',
    zone: 'mid_water',
    target: { x: 46, y: 64 },
    radius: { x: 14, y: 8 },
    scale: 0.88,
    allowedMethods: ['stickRod', 'betterLine'],
    waterId: 'greada',
    weights: { canadian_catfish: 3.2, crucian: 2.2, loach: 0.5, rotan: 0.8 },
  },
];

export function getCastSpot(spotId) {
  return castSpots.find((spot) => spot.id === spotId) ?? castSpots[0];
}

export const biteProfiles = {
  rotan: {
    difficulty: 0.28,
    hookWindowMs: [1700, 2600],
    biteCycles: [2, 3],
    preferred: {
      methods: ['handline'],
      zones: ['near_bank'],
      baits: ['worms', 'larvae'],
    },
    patterns: [
      ['tiny_nibble', 'hard_dip', 'strike_window'],
      ['idle', 'hard_dip', 'submerged', 'strike_window'],
      ['tiny_nibble', 'sideways_pull', 'strike_window'],
    ],
  },
  crucian: {
    difficulty: 0.35,
    hookWindowMs: [2400, 3800],
    biteCycles: [2, 3],
    preferred: {
      methods: ['stickRod'],
      zones: ['mid_water', 'reed_edge'],
      baits: ['worms', 'larvae'],
    },
    patterns: [
      ['tiny_nibble', 'tiny_nibble', 'lift', 'strike_window'],
      ['tiny_nibble', 'slow_dip', 'idle', 'slow_dip', 'strike_window'],
      ['lift', 'sideways_pull', 'strike_window'],
    ],
  },
  bleak: {
    difficulty: 0.54,
    hookWindowMs: [1200, 1900],
    biteCycles: [2, 3],
    preferred: {
      methods: ['stickRod'],
      zones: ['mid_water'],
      baits: ['larvae', 'worms'],
    },
    patterns: [
      ['tiny_nibble', 'tiny_nibble', 'tiny_nibble', 'strike_window'],
      ['sideways_pull', 'strike_window'],
    ],
  },
  roach: {
    difficulty: 0.46,
    hookWindowMs: [1800, 2900],
    biteCycles: [2, 3],
    preferred: {
      methods: ['stickRod'],
      zones: ['mid_water', 'reed_edge'],
      baits: ['worms', 'larvae'],
    },
    patterns: [
      ['tiny_nibble', 'idle', 'slow_dip', 'strike_window'],
      ['tiny_nibble', 'sideways_pull', 'slow_dip', 'strike_window'],
    ],
  },
  rudd: {
    difficulty: 0.42,
    hookWindowMs: [1900, 3200],
    biteCycles: [2, 3],
    preferred: {
      methods: ['stickRod'],
      zones: ['reed_edge'],
      baits: ['larvae', 'worms'],
    },
    patterns: [
      ['tiny_nibble', 'sideways_pull', 'strike_window'],
      ['idle', 'lift', 'sideways_pull', 'strike_window'],
    ],
  },
  loach: {
    difficulty: 0.48,
    hookWindowMs: [2500, 4000],
    biteCycles: [2, 3],
    preferred: {
      methods: ['handline', 'stickRod'],
      zones: ['near_bank'],
      baits: ['worms'],
    },
    patterns: [
      ['idle', 'tiny_nibble', 'slow_dip', 'idle', 'submerged', 'strike_window'],
      ['slow_dip', 'idle', 'slow_dip', 'strike_window'],
    ],
  },
  pike: {
    difficulty: 0.82,
    hookWindowMs: [1300, 2100],
    biteCycles: [1, 2],
    preferred: {
      methods: ['liveBait'],
      zones: ['reed_edge'],
      baits: ['live_bait'],
    },
    patterns: [
      ['idle', 'sideways_pull', 'hard_dip', 'strike_window'],
    ],
  },
  canadian_catfish: {
    difficulty: 0.62,
    hookWindowMs: [2200, 3600],
    biteCycles: [2, 3],
    preferred: {
      methods: ['stickRod'],
      zones: ['mid_water'],
      baits: ['worms', 'larvae'],
    },
    patterns: [
      ['idle', 'slow_dip', 'submerged', 'strike_window'],
      ['tiny_nibble', 'slow_dip', 'strike_window'],
    ],
  },
};

export const stateDurationsMs = {
  idle: [900, 1700],
  tiny_nibble: [650, 1200],
  lift: [850, 1400],
  slow_dip: [1100, 1800],
  hard_dip: [650, 1000],
  sideways_pull: [900, 1500],
  submerged: [700, 1100],
};

export function getBiteProfile(fishId) {
  return biteProfiles[fishId];
}
