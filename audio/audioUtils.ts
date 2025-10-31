import { BassSound, KickSound, SnareSound, HiHatSound, ClapSound, TomSound } from '../types';

// The Web Audio API's exponentialRampToValueAtTime method cannot ramp to a value of 0.
// This constant defines a very small positive number to use as a target instead, preventing errors.
const MIN_EXP_TARGET = 0.0001;

export const midiToFreq = (midi: number): number => {
  return Math.pow(2, (midi - 69) / 12) * 440;
};

export const createBassNote = (
  ctx: AudioContext,
  time: number,
  midiNote: number,
  bassSound: BassSound
): AudioScheduledSourceNode[] => {
  const freq = midiToFreq(midiNote);
  const attackTime = 0.01;
  let noteLength = 0.4;

  const playNode = (node: AudioNode, gainValue: number, length: number) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gainValue, time + attackTime);
      gain.gain.exponentialRampToValueAtTime(0.01, time + length);
      node.connect(gain).connect(ctx.destination);
  }

  switch (bassSound) {
    case 'P-Bass': { // Thumpy, fundamental
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, time);
      osc.connect(filter);
      playNode(filter, 0.6, 0.25);
      osc.start(time);
      osc.stop(time + 0.25);
      return [osc];
    }
    case 'J-Bass': { // Growly, bright
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);
      osc1.detune.setValueAtTime(-4, time);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, time);
      osc2.detune.setValueAtTime(4, time);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, time);
      
      osc1.connect(filter);
      osc2.connect(filter);
      playNode(filter, 0.3, 0.4);
      osc1.start(time);
      osc1.stop(time + noteLength);
      osc2.start(time);
      osc2.stop(time + noteLength);
      return [osc1, osc2];
    }
    case 'Muted Pick': { // Percussive, short
      noteLength = 0.15;
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * noteLength, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, time);
      filter.Q.value = 5;
      noise.connect(filter);
      playNode(filter, 0.5, noteLength);
      noise.start(time);
      noise.stop(time + noteLength);
      return [noise];
    }
     case 'Sub Synth': { // Pure sine
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      playNode(osc, 0.8, 0.3);
      osc.start(time);
      osc.stop(time + noteLength);
      return [osc];
    }
    case 'Classic': {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, time);
      osc.connect(filter);
      playNode(filter, 0.7, noteLength);
      osc.start(time);
      osc.stop(time + noteLength);
      return [osc];
    }
    case 'Synth': {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(10, time);
      filter.frequency.setValueAtTime(5000, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + noteLength * 0.75);
      osc.connect(filter);
      playNode(filter, 0.5, noteLength);
      osc.start(time);
      osc.stop(time + noteLength);
      return [osc];
    }
    case 'Electric':
    default: {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);
      osc1.detune.setValueAtTime(-5, time);
      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, time);
      osc2.detune.setValueAtTime(5, time);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);
      osc1.connect(filter);
      osc2.connect(filter);
      playNode(filter, 0.4, noteLength);
      osc1.start(time);
      osc1.stop(time + noteLength);
      osc2.start(time);
      osc2.stop(time + noteLength);
      return [osc1, osc2];
    }
  }
};

// ===================================
// New Drum Synthesis Engine
// ===================================

const createNoise = (ctx: AudioContext, type: 'white' | 'pink' | 'brown', duration: number): AudioBufferSourceNode => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    } else { // Pink or Brown
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            let noise = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            if (type === 'pink') {
                 output[i] = noise * 0.11;
            } else { // Brown
                 output[i] = (noise + b6) * 0.07;
            }
        }
    }
    
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    return node;
};

export const createKick = (ctx: AudioContext, time: number, sound: KickSound = 'Acoustic', volume: number = 1.0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    let startFreq = 150, endFreq = 40, decay = 0.2, gainVol = 1.0;

    switch(sound) {
      case '808':
        startFreq = 120; endFreq = 30; decay = 0.8; gainVol = 1.2;
        break;
      case 'Rock':
        startFreq = 180; endFreq = 50; decay = 0.15; gainVol = 1.5;
        // Add a click for the beater
        const click = createNoise(ctx, 'white', 0.02);
        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.5 * volume, time);
        clickGain.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.001 * volume), time + 0.02);
        click.connect(clickGain).connect(ctx.destination);
        click.start(time);
        click.stop(time + 0.02);
        break;
      case 'Thump':
        startFreq = 100; endFreq = 35; decay = 0.25; gainVol = 1.3;
        break;
      case 'Acoustic':
      default:
        startFreq = 160; endFreq = 45; decay = 0.2; gainVol = 1.1;
        break;
    }

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay * 0.5);
    gain.gain.setValueAtTime(gainVol * volume, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + decay);
    osc.start(time);
    osc.stop(time + decay);
};
  
export const createSnare = (ctx: AudioContext, time: number, sound: SnareSound = 'Acoustic', volume: number = 1.0) => {
    // Noise component (the "snares")
    const noise = createNoise(ctx, 'white', 0.2);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    const noiseEnvelope = ctx.createGain();
    noise.connect(noiseFilter).connect(noiseEnvelope).connect(ctx.destination);

    // Body component (the "drum")
    const osc = ctx.createOscillator();
    const oscEnvelope = ctx.createGain();
    osc.connect(oscEnvelope).connect(ctx.destination);

    let hpf = 1000, noiseDecay = 0.15, oscFreq = 200, oscDecay = 0.1;

    switch(sound) {
      case '808':
        hpf = 1200; noiseDecay = 0.1; oscFreq = 180; oscDecay = 0.2;
        break;
      case 'Brush':
        hpf = 2000; noiseDecay = 0.25; oscFreq = 250; oscDecay = 0.08;
        noiseEnvelope.gain.setValueAtTime(0.1 * volume, time);
        noiseEnvelope.gain.linearRampToValueAtTime(0.7 * volume, time + 0.01);
        break;
      case 'Tight':
        hpf = 1500; noiseDecay = 0.08; oscFreq = 220; oscDecay = 0.07;
        break;
      case 'Acoustic':
      default:
        hpf = 1000; noiseDecay = 0.2; oscFreq = 200; oscDecay = 0.1;
        break;
    }
    
    noiseFilter.frequency.value = hpf;
    if(sound !== 'Brush') noiseEnvelope.gain.setValueAtTime(0.8 * volume, time);
    noiseEnvelope.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + noiseDecay);
    noise.start(time);
    noise.stop(time + noiseDecay);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(oscFreq, time);
    oscEnvelope.gain.setValueAtTime(0.9 * volume, time);
    oscEnvelope.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + oscDecay);
    osc.start(time);
    osc.stop(time + oscDecay);
};

export const createHiHat = (ctx: AudioContext, time: number, sound: HiHatSound = 'Acoustic', volume: number = 1.0) => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    
    const fundamental = 40;
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21]; // Frequencies for a metallic sound
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';

    let decay = 0.05, hpf = 7000, gainVol = 0.4;
    
    switch(sound) {
      case '808':
        bandpass.Q.value = 0.5;
        hpf = 5000; decay = 0.08; gainVol = 0.5;
        break;
      case 'Bright':
        bandpass.Q.value = 1;
        hpf = 8000; decay = 0.04; gainVol = 0.3;
        break;
      case 'Acoustic':
      default:
        bandpass.Q.value = 0.8;
        hpf = 7000; decay = 0.06; gainVol = 0.4;
        break;
    }

    bandpass.frequency.value = hpf;
    
    ratios.forEach(ratio => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = fundamental * ratio;
        osc.connect(bandpass);
        osc.start(time);
        osc.stop(time + decay);
    });

    gain.gain.setValueAtTime(gainVol * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay); // Don't multiply target by volume
    bandpass.connect(gain);
};


export const createClap = (ctx: AudioContext, time: number, sound: ClapSound = 'Acoustic', volume: number = 1.0) => {
    const noise = createNoise(ctx, 'white', 0.2);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const gain = ctx.createGain();

    let filterFreq = 1000, decay = 0.15;
    if (sound === '808') {
        filterFreq = 1200;
        decay = 0.1;
    }

    filter.frequency.value = filterFreq;
    filter.Q.value = 50;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1 * volume, time + 0.005);
    gain.gain.linearRampToValueAtTime(0.8 * volume, time + 0.01);
    gain.gain.linearRampToValueAtTime(1 * volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + decay);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(time);
    noise.stop(time + decay);
}

export const createTom = (ctx: AudioContext, time: number, sound: TomSound = 'Acoustic Mid', volume: number = 1.0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    let startFreq = 200, endFreq = 100, decay = 0.2;

    switch(sound) {
      case 'Acoustic Low':
        startFreq = 150; endFreq = 75; decay = 0.3;
        break;
      case 'Acoustic High':
        startFreq = 300; endFreq = 150; decay = 0.15;
        break;
      case 'Electro':
        startFreq = 250; endFreq = 50; decay = 0.4;
        break;
      case 'Acoustic Mid':
      default:
        startFreq = 200; endFreq = 100; decay = 0.2;
        break;
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay);

    gain.gain.setValueAtTime(1 * volume, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + decay);

    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + decay);
}