// All sound is synthesised with WebAudio: no audio files, no network.
// A find chimes, a miss buzzes, a hint ticks, a level win arpeggiates.

/** Create the sound effects player. It stays silent until the first user gesture. */
export function createSound() {
  let ctx = null;
  let muted = false;

  function audio() {
    if (ctx === null) {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  /** One short oscillator note. */
  function note(freq, at, dur, type, gain) {
    const ac = audio();
    if (ac === null || muted) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ac.currentTime + at);
    g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(ac.currentTime + at);
    osc.stop(ac.currentTime + at + dur + 0.05);
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    /** Unlock the context on a user gesture (a no-op once it exists). */
    unlock() {
      audio();
    },
    click() {
      note(660, 0, 0.07, 'sine', 0.12);
    },
    /** A found difference: a bright two-note chime. */
    find() {
      note(880, 0, 0.16, 'sine', 0.22);
      note(1318.5, 0.09, 0.28, 'sine', 0.2);
    },
    /** A wrong click: a low dull buzz. */
    miss() {
      note(160, 0, 0.22, 'sawtooth', 0.12);
      note(110, 0.05, 0.25, 'sawtooth', 0.1);
    },
    /** A hint: a soft tick-tock pair. */
    hint() {
      note(1046.5, 0, 0.08, 'triangle', 0.16);
      note(1046.5, 0.14, 0.1, 'triangle', 0.14);
    },
    /** A level cleared: a rising arpeggio. */
    levelWin() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.11, 0.3, 'triangle', 0.2));
    },
    /** The whole game won: a longer fanfare. */
    gameWin() {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => note(f, i * 0.12, 0.32, 'triangle', 0.2));
    },
    /** Time running out on the final level. */
    timeUp() {
      [392, 329.63, 261.63].forEach((f, i) => note(f, i * 0.16, 0.3, 'sine', 0.18));
    },
  };
}
