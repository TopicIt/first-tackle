import { availableAudioAssets, fallbackSoundPresets } from './soundConfig.js';

export function createAudioManager(initialSettings) {
  let audioContext = null;
  let activated = false;
  let settings = { ...initialSettings };
  let musicAudio = null;
  let currentMusicId = null;

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
      startMusic('ambient_day');
    },
    syncSettings(nextSettings) {
      settings = { ...settings, ...nextSettings };
      if (musicAudio) {
        musicAudio.volume = settings.musicEnabled ? settings.musicVolume : 0;
      }
      if (activated && settings.musicEnabled) {
        startMusic(currentMusicId ?? 'ambient_day');
      }
    },
    startMusic,
    playSound(soundId) {
      if (!activated || !settings.soundEnabled) {
        return;
      }

      const assetPath = availableAudioAssets.sfx[soundId];
      if (assetPath) {
        playFile(assetPath, settings.sfxVolume)
          .catch(() => playFallback(soundId, audioContext, settings.sfxVolume));
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

  function startMusic(musicId = 'ambient_day') {
    if (!activated || !settings.musicEnabled) {
      return;
    }

    const assetPath = availableAudioAssets.music[musicId];
    if (!assetPath) {
      return;
    }

    if (musicAudio && currentMusicId === musicId) {
      musicAudio.volume = settings.musicVolume;
      musicAudio.play().catch(() => {});
      return;
    }

    if (musicAudio) {
      musicAudio.pause();
    }

    currentMusicId = musicId;
    musicAudio = new Audio(assetPath);
    musicAudio.loop = true;
    musicAudio.volume = settings.musicVolume;
    musicAudio.play().catch(() => {});
  }
}

function playFile(assetPath, volume) {
  const audio = new Audio(assetPath);
  audio.volume = volume;
  return audio.play();
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
