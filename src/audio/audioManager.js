import { availableAudioAssets, defaultMusicTrackId, fallbackSoundPresets, getMusicTrack, musicTracks } from './soundConfig.js';

export function createAudioManager(initialSettings) {
  let audioContext = null;
  let activated = false;
  let settings = { ...initialSettings };
  let musicAudio = null;
  let currentMusicId = normalizeTrackId(initialSettings?.musicTrackId);
  let musicSourceIndex = 0;

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
      startMusic(currentMusicId);
    },
    syncSettings(nextSettings) {
      settings = {
        ...settings,
        ...nextSettings,
        musicTrackId: normalizeTrackId(nextSettings?.musicTrackId ?? settings.musicTrackId),
        musicMode: nextSettings?.musicMode ?? settings.musicMode ?? 'fixed',
      };
      currentMusicId = settings.musicTrackId;

      if (!settings.musicEnabled) {
        stopMusic(false);
        return;
      }

      if (musicAudio) {
        musicAudio.volume = settings.musicVolume;
        musicAudio.loop = settings.musicMode !== 'random';
      }

      if (activated) {
        startMusic(currentMusicId, { forceRestart: false });
      }
    },
    startMusic,
    playNextTrack() {
      const nextTrackId = getAdjacentTrackId(currentMusicId, 1);
      return startMusic(nextTrackId, { forceRestart: true });
    },
    playRandomTrack() {
      const nextTrackId = getRandomTrackId(currentMusicId);
      return startMusic(nextTrackId, { forceRestart: true });
    },
    getCurrentTrackId() {
      return currentMusicId;
    },
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

  function startMusic(musicId = defaultMusicTrackId, options = {}) {
    const track = getMusicTrack(musicId);
    const forceRestart = Boolean(options.forceRestart);
    const previousTrackId = currentMusicId;
    currentMusicId = track.id;

    if (!activated) {
      return track.id;
    }

    if (!settings.musicEnabled) {
      stopMusic(false);
      return track.id;
    }

    if (musicAudio && previousTrackId === track.id && !forceRestart) {
      musicAudio.volume = settings.musicVolume;
      musicAudio.loop = settings.musicMode !== 'random';
      musicAudio.play().catch(() => {});
      return track.id;
    }

    startTrackPlayback(track);
    return track.id;
  }

  function startTrackPlayback(track) {
    stopMusic(false);
    musicSourceIndex = 0;
    musicAudio = new Audio();
    musicAudio.preload = 'auto';
    musicAudio.volume = settings.musicVolume;
    musicAudio.loop = settings.musicMode !== 'random';
    musicAudio.addEventListener('ended', handleMusicEnded);
    musicAudio.addEventListener('error', handleMusicError);
    loadTrackSource(track);
  }

  function loadTrackSource(track) {
    if (!musicAudio) {
      return;
    }

    const source = track.sources?.[musicSourceIndex];
    if (!source) {
      stopMusic(false);
      return;
    }

    musicAudio.src = source;
    musicAudio.load();
    musicAudio.play().catch(() => {});
  }

  function handleMusicEnded() {
    if (settings.musicMode === 'random') {
      startMusic(getRandomTrackId(currentMusicId), { forceRestart: true });
      return;
    }

    musicAudio?.play().catch(() => {});
  }

  function handleMusicError() {
    const track = getMusicTrack(currentMusicId);
    if (musicSourceIndex < (track.sources?.length ?? 0) - 1) {
      musicSourceIndex += 1;
      loadTrackSource(track);
      return;
    }

    stopMusic(false);
  }

  function stopMusic(clearTrack = false) {
    if (musicAudio) {
      musicAudio.pause();
      musicAudio.removeEventListener('ended', handleMusicEnded);
      musicAudio.removeEventListener('error', handleMusicError);
      musicAudio = null;
    }

    musicSourceIndex = 0;

    if (clearTrack) {
      currentMusicId = normalizeTrackId(defaultMusicTrackId);
    }
  }

  function getAdjacentTrackId(trackId, offset) {
    const currentIndex = musicTracks.findIndex((track) => track.id === normalizeTrackId(trackId));
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + offset + musicTracks.length) % musicTracks.length;
    return musicTracks[nextIndex]?.id ?? defaultMusicTrackId;
  }

  function getRandomTrackId(trackId) {
    const normalizedTrackId = normalizeTrackId(trackId);
    const availableTrackIds = musicTracks.map((track) => track.id);
    const pool = availableTrackIds.length > 1
      ? availableTrackIds.filter((id) => id !== normalizedTrackId)
      : availableTrackIds;
    return pool[Math.floor(Math.random() * pool.length)] ?? defaultMusicTrackId;
  }

  function normalizeTrackId(trackId) {
    return musicTracks.find((track) => track.id === trackId)?.id ?? defaultMusicTrackId;
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
