import { availableAudioAssets, defaultMusicTrackId, fallbackSoundPresets, getMusicTrack, musicTracks } from './soundConfig.js';

export function createAudioManager(initialSettings) {
  let audioContext = null;
  let activated = false;
  let hasStartedMusic = false;
  let settings = { ...initialSettings };
  let musicAudio = null;
  let currentMusicId = normalizeTrackId(initialSettings?.musicTrackId);
  let musicSourceIndex = 0;
  let shuffleBag = [];
  let failedTrackIdsThisCycle = new Set();

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

      if (activated) {
        resumeMusicIfNeeded();
        return;
      }

      activated = true;
      if (settings.musicEnabled) {
        startMusic(getStartupTrackId(), { forceRestart: !musicAudio });
      }
    },
    syncSettings(nextSettings) {
      const previousMusicEnabled = settings.musicEnabled;
      settings = {
        ...settings,
        ...nextSettings,
        musicTrackId: normalizeTrackId(nextSettings?.musicTrackId ?? settings.musicTrackId),
        musicMode: nextSettings?.musicMode ?? settings.musicMode ?? 'random',
      };
      const shouldSwitchTrack = currentMusicId !== settings.musicTrackId;
      currentMusicId = settings.musicTrackId;

      if (!settings.musicEnabled) {
        pauseMusic();
        return;
      }

      if (musicAudio) {
        musicAudio.volume = settings.musicVolume;
        musicAudio.loop = isFixedMusicMode();
      }

      if (!activated) {
        return;
      }

      if (shouldSwitchTrack && hasStartedMusic) {
        startMusic(currentMusicId, { forceRestart: true });
        return;
      }

      if (!previousMusicEnabled && hasStartedMusic && musicAudio) {
        resumeMusicIfNeeded();
        return;
      }

      if (!hasStartedMusic) {
        startMusic(getStartupTrackId(), { forceRestart: true });
      }
    },
    startMusic,
    playNextTrack() {
      const nextTrackId = getAdjacentTrackId(currentMusicId, 1);
      return startMusic(nextTrackId, { forceRestart: true });
    },
    playRandomTrack() {
      const nextTrackId = getNextShuffleTrackId() ?? getRandomTrackId(currentMusicId);
      return startMusic(nextTrackId, { forceRestart: true });
    },
    getCurrentTrackId() {
      return currentMusicId;
    },
    isUnlocked() {
      return activated;
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
      pauseMusic();
      return track.id;
    }

    if (musicAudio && previousTrackId === track.id && !forceRestart) {
      musicAudio.volume = settings.musicVolume;
      musicAudio.loop = isFixedMusicMode();
      if (musicAudio.paused) {
        attemptMusicPlay();
      }
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
    musicAudio.loop = isFixedMusicMode();
    musicAudio.addEventListener('ended', handleMusicEnded);
    musicAudio.addEventListener('error', handleMusicError);
    hasStartedMusic = true;
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
    attemptMusicPlay();
  }

  function handleMusicEnded() {
    if (!isFixedMusicMode()) {
      failedTrackIdsThisCycle.clear();
      startNextShuffleTrack();
      return;
    }

    attemptMusicPlay();
  }

  function handleMusicError() {
    const track = getMusicTrack(currentMusicId);
    if (musicSourceIndex < (track.sources?.length ?? 0) - 1) {
      musicSourceIndex += 1;
      loadTrackSource(track);
      return;
    }

    if (!isFixedMusicMode()) {
      failedTrackIdsThisCycle.add(currentMusicId);
      startNextShuffleTrack();
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

  function pauseMusic() {
    if (!musicAudio) {
      return;
    }

    musicAudio.pause();
  }

  function resumeMusicIfNeeded() {
    if (!settings.musicEnabled || !musicAudio || !musicAudio.paused) {
      return;
    }

    attemptMusicPlay();
  }

  function attemptMusicPlay() {
    if (!musicAudio || !settings.musicEnabled) {
      return;
    }

    const playResult = musicAudio.play();
    if (playResult?.catch) {
      playResult.catch(() => {});
    }
  }

  function startNextShuffleTrack() {
    const nextTrackId = getNextShuffleTrackId(failedTrackIdsThisCycle);
    if (!nextTrackId) {
      stopMusic(false);
      return null;
    }

    return startMusic(nextTrackId, { forceRestart: true });
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

  function getNextShuffleTrackId(skipIds = new Set()) {
    if (!shuffleBag.length) {
      const candidates = musicTracks
        .map((track) => track.id)
        .filter((id) => !skipIds.has(id));
      if (!candidates.length) {
        return null;
      }
      shuffleBag = shuffleTrackIds(candidates);
      avoidImmediateShuffleRepeat(shuffleBag, currentMusicId);
    }

    return shuffleBag.shift() ?? null;
  }

  function shuffleTrackIds(trackIds) {
    const shuffled = [...trackIds];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function avoidImmediateShuffleRepeat(trackIds, previousTrackId) {
    if (trackIds.length <= 1 || trackIds[0] !== previousTrackId) {
      return;
    }

    const swapIndex = trackIds.findIndex((id) => id !== previousTrackId);
    if (swapIndex > 0) {
      [trackIds[0], trackIds[swapIndex]] = [trackIds[swapIndex], trackIds[0]];
    }
  }

  function normalizeTrackId(trackId) {
    return musicTracks.find((track) => track.id === trackId)?.id ?? defaultMusicTrackId;
  }

  function getStartupTrackId() {
    if (!isFixedMusicMode()) {
      return getNextShuffleTrackId() ?? getRandomTrackId(currentMusicId);
    }

    return currentMusicId;
  }

  function isFixedMusicMode() {
    return settings.musicMode === 'fixed';
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
