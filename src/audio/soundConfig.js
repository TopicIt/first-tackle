import { assetPath } from '../utils/assetPath.js';

export const availableAudioAssets = {
  music: {
    ambient_day: assetPath('/assets/audio/music/ambient_day.mp3'),
    ambient_evening: assetPath('/assets/audio/music/ambient_evening.mp3.mp3'),
    theme: assetPath('/assets/audio/music/theme.mp3.mp3'),
  },
  sfx: {
    catch_success: assetPath('/assets/audio/music/sfx/catch%20success.mp3'),
  },
};

export const fallbackSoundPresets = {
  ui_click: [
    { type: 'sine', frequency: 880, duration: 0.06, gain: 0.08 },
  ],
  open_scene: [
    { type: 'triangle', frequency: 520, duration: 0.08, gain: 0.08 },
    { type: 'triangle', frequency: 660, duration: 0.1, gain: 0.06, delay: 0.04 },
  ],
  close_scene: [
    { type: 'triangle', frequency: 420, duration: 0.08, gain: 0.07 },
  ],
  cast_whoosh: [
    { type: 'sawtooth', frequency: 260, duration: 0.14, gain: 0.05 },
  ],
  bobber_plop: [
    { type: 'sine', frequency: 180, duration: 0.12, gain: 0.09 },
  ],
  water_ripple: [
    { type: 'triangle', frequency: 240, duration: 0.16, gain: 0.05 },
  ],
  bird_chirp: [
    { type: 'sine', frequency: 1320, duration: 0.04, gain: 0.04 },
    { type: 'sine', frequency: 1640, duration: 0.05, gain: 0.035, delay: 0.06 },
  ],
  tiny_nibble: [
    { type: 'square', frequency: 700, duration: 0.03, gain: 0.05 },
    { type: 'square', frequency: 760, duration: 0.03, gain: 0.05, delay: 0.05 },
  ],
  strong_bite: [
    { type: 'square', frequency: 460, duration: 0.08, gain: 0.09 },
    { type: 'triangle', frequency: 320, duration: 0.08, gain: 0.06, delay: 0.06 },
  ],
  strike: [
    { type: 'triangle', frequency: 780, duration: 0.09, gain: 0.08 },
  ],
  line_tension: [
    { type: 'sawtooth', frequency: 210, duration: 0.12, gain: 0.035 },
    { type: 'triangle', frequency: 340, duration: 0.1, gain: 0.03, delay: 0.08 },
  ],
  catch_success: [
    { type: 'sine', frequency: 520, duration: 0.12, gain: 0.08 },
    { type: 'sine', frequency: 720, duration: 0.14, gain: 0.06, delay: 0.08 },
  ],
  fish_escape: [
    { type: 'triangle', frequency: 360, duration: 0.14, gain: 0.07 },
  ],
  line_break: [
    { type: 'square', frequency: 190, duration: 0.06, gain: 0.08 },
  ],
  coins: [
    { type: 'sine', frequency: 980, duration: 0.07, gain: 0.08 },
    { type: 'sine', frequency: 1240, duration: 0.09, gain: 0.05, delay: 0.05 },
  ],
  buy_item: [
    { type: 'triangle', frequency: 720, duration: 0.08, gain: 0.07 },
  ],
  sell_item: [
    { type: 'triangle', frequency: 820, duration: 0.08, gain: 0.07 },
  ],
  craft_item: [
    { type: 'square', frequency: 620, duration: 0.06, gain: 0.05 },
    { type: 'square', frequency: 700, duration: 0.06, gain: 0.05, delay: 0.05 },
  ],
  gather_bait: [
    { type: 'triangle', frequency: 540, duration: 0.05, gain: 0.05 },
  ],
  dry_fish: [
    { type: 'sine', frequency: 430, duration: 0.1, gain: 0.05 },
  ],
  insect_buzz: [
    { type: 'sawtooth', frequency: 190, duration: 0.22, gain: 0.018 },
    { type: 'triangle', frequency: 420, duration: 0.18, gain: 0.014, delay: 0.05 },
  ],
};
