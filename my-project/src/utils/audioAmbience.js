/**
 * Procedural Web Audio Weather Ambience Synthesizer
 * Generates soothing ambient weather audio (rain, wind, night crickets, sunny breeze)
 * using the browser's native Web Audio API with zero external media files.
 */

let audioCtx = null;
let currentNodes = [];
let isPlaying = false;
let currentMode = 'clear';

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function stopAmbience() {
  currentNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch {
      // ignore
    }
  });
  currentNodes = [];
  isPlaying = false;
}

/** Synthesize soft falling rain using filtered pink/white noise */
function playRain(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pink noise approximation
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  // Bandpass filter for soft patter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, ctx.currentTime);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  currentNodes.push(noise, filter, gain);
}

/** Synthesize calming ambient wind with sweeping lowpass filter */
function playWind(ctx) {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.03;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(320, ctx.currentTime);
  filter.Q.setValueAtTime(2.5, ctx.currentTime);

  // LFO to slowly modulate wind frequency
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(140, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.07, ctx.currentTime);

  noise.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  noise.start();
  lfo.start();
  currentNodes.push(noise, filter, lfo, lfoGain, masterGain);
}

/** Synthesize soothing night crickets with rhythmic high-pitched pulses */
function playNight(ctx) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(4500, ctx.currentTime);

  // Tremolo modulation
  const tremolo = ctx.createOscillator();
  tremolo.frequency.setValueAtTime(12, ctx.currentTime);
  const tremoloGain = ctx.createGain();
  tremoloGain.gain.setValueAtTime(0.015, ctx.currentTime);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.015, ctx.currentTime);

  tremolo.connect(masterGain.gain);
  osc.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc.start();
  tremolo.start();
  currentNodes.push(osc, tremolo, tremoloGain, masterGain);
}

/** Synthesize a warm, peaceful light morning breeze */
function playSunnyBreeze(ctx) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, ctx.currentTime);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.015, ctx.currentTime);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  currentNodes.push(osc, filter, gain);
}

export function toggleAudioAmbience(weatherCode = 0, isDay = 1) {
  if (isPlaying) {
    stopAmbience();
    return false;
  }

  const ctx = getAudioContext();
  if (!ctx) return false;

  stopAmbience();

  // Determine mode
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
    playRain(ctx);
    currentMode = 'rain';
  } else if (!isDay) {
    playNight(ctx);
    currentMode = 'night';
  } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    playWind(ctx);
    currentMode = 'snow';
  } else {
    playSunnyBreeze(ctx);
    currentMode = 'clear';
  }

  isPlaying = true;
  return true;
}

export function getAudioAmbienceState() {
  return { isPlaying, currentMode };
}
