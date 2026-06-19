import { availableAudioAssets, fallbackSoundPresets } from './soundConfig.js';

export function createAudioManager(initialSettings) {
  let audioContext = null;
  let activated = false;
  let settings = { ...initialSettings };

  return {
    activate() {
      if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          return;
        }
        audioContext = new AudioContextClass();
      }

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      activated = true;
    },
    syncSettings(nextSettings) {
      settings = { ...settings, ...nextSettings };
    },
    playSound(soundId) {
      if (!activated || !settings.soundEnabled) {
        return;
      }

      const assetPath = availableAudioAssets.sfx[soundId];
      if (assetPath) {
        playFile(assetPath, settings.sfxVolume);
        return;
      }

      playFallback(soundId, audioContext, settings.sfxVolume);
    },
    drainQueue(state) {
      if (!state.audioQueue?.length) {
        return;
      }

      for (const soundId of state.audioQueue) {
        this.playSound(soundId);
      }

      state.audioQueue = [];
    },
  };
}

function playFile(assetPath, volume) {
  const audio = new Audio(assetPath);
  audio.volume = volume;
  audio.play().catch(() => {});
}

function playFallback(soundId, audioContext, volume) {
  if (!audioContext) {
    return;
  }

  const steps = fallbackSoundPresets[soundId] ?? fallbackSoundPresets.ui_click;
  const startAt = audioContext.currentTime;

  for (const step of steps) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = step.type;
    oscillator.frequency.setValueAtTime(step.frequency, startAt + (step.delay ?? 0));
    gainNode.gain.setValueAtTime((step.gain ?? 0.05) * volume, startAt + (step.delay ?? 0));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + (step.delay ?? 0) + step.duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startAt + (step.delay ?? 0));
    oscillator.stop(startAt + (step.delay ?? 0) + step.duration);
  }
}
