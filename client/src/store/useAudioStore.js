import { create } from "zustand";

/* ─── Singleton audio instances (survive across component mounts) ─── */

let _audioCtx = null;
let _masterGain = null;
let _audioEl = null;
let _ambianceNodes = [];

function getAudioCtx() {
  if (!_audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    _audioCtx = new AudioCtx();
    _masterGain = _audioCtx.createGain();
    _masterGain.connect(_audioCtx.destination);
  }
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

function createNoiseBuffer(ctx, seconds = 2) {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, sr * seconds, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function buildAmbianceNodes(ctx, master, type) {
  const nodes = [];
  const noiseBuf = createNoiseBuffer(ctx, 2);
  const fadeIn = ctx.createGain();
  fadeIn.gain.setValueAtTime(0, ctx.currentTime);
  fadeIn.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
  fadeIn.connect(master);

  if (type === "rain") {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 600;
    lp.Q.value = 0.3;
    const g = ctx.createGain();
    g.gain.value = 0.18;
    src.connect(lp).connect(g).connect(fadeIn);
    src.start();
    nodes.push(src);
    const drip = ctx.createBufferSource();
    drip.buffer = noiseBuf;
    drip.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 2500;
    hp.Q.value = 0.2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.03;
    drip.connect(hp).connect(g2).connect(fadeIn);
    drip.start();
    nodes.push(drip);
  } else if (type === "ocean") {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 120;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();
    const g = ctx.createGain();
    g.gain.value = 0.2;
    src.connect(lp).connect(g).connect(fadeIn);
    src.start();
    nodes.push(src, lfo);
  } else if (type === "wind") {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 350;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 150;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();
    const g = ctx.createGain();
    g.gain.value = 0.15;
    src.connect(lp).connect(g).connect(fadeIn);
    src.start();
    nodes.push(src, lfo);
  } else if (type === "fireplace") {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 250;
    bp.Q.value = 0.8;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1.5;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 80;
    lfo.connect(lfoG).connect(bp.frequency);
    lfo.start();
    const g = ctx.createGain();
    g.gain.value = 0.14;
    src.connect(bp).connect(g).connect(fadeIn);
    src.start();
    nodes.push(src, lfo);
    const rumble = ctx.createOscillator();
    rumble.frequency.value = 45;
    rumble.type = "sine";
    const rg = ctx.createGain();
    rg.gain.value = 0.025;
    rumble.connect(rg).connect(fadeIn);
    rumble.start();
    nodes.push(rumble);
  } else if (type === "cafe") {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 800;
    bp.Q.value = 0.2;
    const g = ctx.createGain();
    g.gain.value = 0.08;
    src.connect(bp).connect(g).connect(fadeIn);
    src.start();
    nodes.push(src);
    const src2 = ctx.createBufferSource();
    src2.buffer = noiseBuf;
    src2.loop = true;
    const bp2 = ctx.createBiquadFilter();
    bp2.type = "lowpass";
    bp2.frequency.value = 400;
    const g2 = ctx.createGain();
    g2.gain.value = 0.05;
    src2.connect(bp2).connect(g2).connect(fadeIn);
    src2.start();
    nodes.push(src2);
  } else if (type === "nature") {
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 1800 + Math.random() * 1200;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 2 + Math.random() * 3;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 400;
      lfo.connect(lfoG).connect(osc.frequency);
      lfo.start();
      const g = ctx.createGain();
      g.gain.value = 0.015;
      osc.connect(g).connect(fadeIn);
      osc.start();
      nodes.push(osc, lfo);
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 400;
    const g = ctx.createGain();
    g.gain.value = 0.07;
    src.connect(lp).connect(g).connect(fadeIn);
    src.start();
    nodes.push(src);
  }
  return nodes;
}

/* ─── Zustand store ─── */

const useAudioStore = create((set, get) => ({
  isPlaying: false,
  volume: 70,
  selectedMood: null,
  selectedAmbiance: null,
  stationIndex: 0,
  currentStation: null,
  musicLoading: false,

  setVolume: (v) => {
    set({ volume: v });
    if (_masterGain) _masterGain.gain.value = v / 100;
    if (_audioEl) _audioEl.volume = v / 100;
  },

  playStation: (station) => {
    if (!station) return;
    // stop previous music
    if (_audioEl) {
      _audioEl.pause();
      _audioEl.src = "";
      _audioEl = null;
    }
    set({ musicLoading: true, currentStation: station });

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = get().volume / 100;
    audio.addEventListener("canplay", () => set({ musicLoading: false }), {
      once: true,
    });
    audio.addEventListener("error", () => set({ musicLoading: false }), {
      once: true,
    });
    audio.src = station.url;
    audio.play().catch(() => set({ musicLoading: false }));
    _audioEl = audio;
  },

  stopMusic: () => {
    if (_audioEl) {
      _audioEl.pause();
      _audioEl.src = "";
      _audioEl = null;
    }
    set({
      musicLoading: false,
      isPlaying: false,
      currentStation: null,
      selectedMood: null,
    });
  },

  stopAmbianceAudio: () => {
    _ambianceNodes.forEach((n) => {
      try {
        n.stop();
      } catch {}
    });
    _ambianceNodes = [];
  },

  startAmbiance: (type) => {
    const ctx = getAudioCtx();
    // stop old
    _ambianceNodes.forEach((n) => {
      try {
        n.stop();
      } catch {}
    });
    _ambianceNodes = [];
    if (type) {
      _ambianceNodes = buildAmbianceNodes(ctx, _masterGain, type);
    }
    set({ selectedAmbiance: type });
  },

  selectMood: (mood, stations) => {
    const idx = 0;
    set({ selectedMood: mood, stationIndex: idx, isPlaying: true });
    get().playStation(stations?.[idx]);
  },

  nextStation: (stations) => {
    if (!stations) return;
    const nextIdx = (get().stationIndex + 1) % stations.length;
    set({ stationIndex: nextIdx });
    get().playStation(stations[nextIdx]);
  },

  prevStation: (stations) => {
    if (!stations) return;
    const prevIdx =
      (get().stationIndex - 1 + stations.length) % stations.length;
    set({ stationIndex: prevIdx });
    get().playStation(stations[prevIdx]);
  },

  togglePlayPause: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      if (_audioEl) _audioEl.pause();
      if (_audioCtx) _audioCtx.suspend();
      set({ isPlaying: false });
    } else {
      if (_audioEl) _audioEl.play().catch(() => {});
      if (_audioCtx) _audioCtx.resume();
      set({ isPlaying: true });
    }
  },
}));

export default useAudioStore;
