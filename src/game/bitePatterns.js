export const castZones = ['near_bank', 'mid_water', 'reed_edge'];

export const biteProfiles = {
  rotan: {
    difficulty: 0.28,
    hookWindowMs: [800, 1400],
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
    hookWindowMs: [1400, 2400],
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
    hookWindowMs: [500, 900],
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
    hookWindowMs: [900, 1500],
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
    hookWindowMs: [1000, 1800],
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
    hookWindowMs: [1600, 2600],
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
    hookWindowMs: [700, 1200],
    preferred: {
      methods: ['liveBait'],
      zones: ['reed_edge'],
      baits: ['live_bait'],
    },
    patterns: [
      ['idle', 'sideways_pull', 'hard_dip', 'strike_window'],
    ],
  },
};

export const stateDurationsMs = {
  idle: [900, 1600],
  tiny_nibble: [280, 520],
  lift: [360, 620],
  slow_dip: [620, 1000],
  hard_dip: [220, 420],
  sideways_pull: [300, 560],
  submerged: [260, 620],
};

export function getBiteProfile(fishId) {
  return biteProfiles[fishId];
}
