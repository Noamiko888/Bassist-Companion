import { BassSound, KickSound, SnareSound, HiHatSound, ClapSound, TomSound } from '../types';

// The Web Audio API's exponentialRampToValueAtTime method cannot ramp to a value of 0.
// This constant defines a very small positive number to use as a target instead, preventing errors.
const MIN_EXP_TARGET = 0.0001;

// Helper function for creating distortion curves for WaveShaperNode
const makeDistortionCurve = (amount: number) => {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};


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
  let noteLength = 0.4;
  const nodes: AudioScheduledSourceNode[] = [];

  const playNode = (node: AudioNode, gainValue: number, length: number, destination: AudioNode = ctx.destination) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gainValue, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + length);
      node.connect(gain).connect(destination);
  }

  switch (bassSound) {
    case 'P-Bass': { // Thumpy, fundamental, quick decay
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(250, time + 0.1);
      osc.connect(filter);
      playNode(filter, 0.7, 0.2);
      osc.start(time);
      osc.stop(time + 0.25);
      nodes.push(osc);
      break;
    }
    case 'J-Bass': { // Growly, bright, with subtle overdrive
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
      filter.frequency.setValueAtTime(1800, time);
      
      const distortion = ctx.createWaveShaper();
      distortion.curve = makeDistortionCurve(80);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(distortion);
      
      playNode(distortion, 0.35, 0.4);
      osc1.start(time);
      osc1.stop(time + noteLength);
      osc2.start(time);
      osc2.stop(time + noteLength);
      nodes.push(osc1, osc2);
      break;
    }
    case 'Muted Pick': { // Percussive, short, with pick attack
      noteLength = 0.15;
      // The "pick" sound
      const pickNoise = createNoise(ctx, 'white', 0.03);
      const pickFilter = ctx.createBiquadFilter();
      pickFilter.type = 'highpass';
      pickFilter.frequency.value = 3000;
      const pickGain = ctx.createGain();
      pickGain.gain.setValueAtTime(0.8, time);
      pickGain.gain.exponentialRampToValueAtTime(MIN_EXP_TARGET, time + 0.03);
      pickNoise.connect(pickFilter).connect(pickGain).connect(ctx.destination);
      
      // The "note" body
      const bodyOsc = ctx.createOscillator();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(freq, time);
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.value = 400;
      bodyOsc.connect(bodyFilter);
      playNode(bodyFilter, 0.4, noteLength);
      
      pickNoise.start(time);
      pickNoise.stop(time + 0.03);
      bodyOsc.start(time);
      bodyOsc.stop(time + noteLength);
      nodes.push(pickNoise, bodyOsc);
      break;
    }
     case 'Sub Synth': { // Pure sine with a sub-octave
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      playNode(osc, 0.7, 0.3);

      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 2, time); // One octave below
      playNode(subOsc, 0.6, 0.3);

      osc.start(time);
      osc.stop(time + noteLength);
      subOsc.start(time);
      subOsc.stop(time + noteLength);
      nodes.push(osc, subOsc);
      break;
    }
    case 'Classic': { // Smoother, vintage tone
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, time); // Lower cutoff for vintage sound
      osc.connect(filter);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.6, time + 0.02); // Slower attack
      gain.gain.exponentialRampToValueAtTime(0.01, time + noteLength);
      filter.connect(gain).connect(ctx.destination);

      osc.start(time);
      osc.stop(time + noteLength);
      nodes.push(osc);
      break;
    }
    case 'Synth': { // Dynamic filter wobble
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(12, time);
      filter.frequency.setValueAtTime(100, time);

      // LFO to modulate the filter
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(6, time); // LFO speed
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(1500, time); // LFO depth
      lfo.connect(lfoGain).connect(filter.frequency);
      
      osc.connect(filter);
      playNode(filter, 0.4, noteLength);
      
      osc.start(time);
      osc.stop(time + noteLength);
      lfo.start(time);
      lfo.stop(time + noteLength);
      nodes.push(osc, lfo);
      break;
    }
    case 'Electric': // Punchier with compression
    default: {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);
      osc1.detune.setValueAtTime(-6, time);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, time);
      osc2.detune.setValueAtTime(6, time);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-20, time);
      compressor.knee.setValueAtTime(30, time);
      compressor.ratio.setValueAtTime(12, time);
      compressor.attack.setValueAtTime(0, time);
      compressor.release.setValueAtTime(0.25, time);

      osc1.connect(filter);
      osc2.connect(filter);
      
      playNode(filter, 0.4, noteLength, compressor);

      osc1.start(time);
      osc1.stop(time + noteLength);
      osc2.start(time);
      osc2.stop(time + noteLength);
      nodes.push(osc1, osc2);
      break;
    }
  }
  return nodes;
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

// Simple reverb using a generated impulse response
const createReverb = (ctx: AudioContext, duration: number = 0.2, decay: number = 0.2): ConvolverNode => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = length - i;
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
};


export const createKick = (ctx: AudioContext, time: number, sound: KickSound = 'Acoustic', volume: number = 1.0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    let finalNode: AudioNode = gain;

    let startFreq = 150, endFreq = 40, decay = 0.2, gainVol = 1.0;

    switch(sound) {
      case '808': {
        startFreq = 100; endFreq = 25; decay = 0.9; gainVol = 1.3;
        const distortion = ctx.createWaveShaper();
        distortion.curve = makeDistortionCurve(150);
        gain.connect(distortion);
        finalNode = distortion;
        break;
      }
      case 'Rock': {
        startFreq = 180; endFreq = 50; decay = 0.15; gainVol = 1.5;
        const distortion = ctx.createWaveShaper();
        distortion.curve = makeDistortionCurve(250);
        const compressor = ctx.createDynamicsCompressor();
        gain.connect(distortion).connect(compressor);
        finalNode = compressor;
        // fall-through to add click
      }
      // falls through
      case 'Thump':
      case 'Acoustic':
      default: {
        // Add a "beater" click to non-808 kicks
        // FIX: This comparison was always true because the type of `sound` in this block is narrowed and cannot be '808',
        // which caused a compiler error. The redundant `if` statement has been removed.
        const click = createNoise(ctx, 'white', 0.02);
        const clickGain = ctx.createGain();
        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.setValueAtTime(1000, time);
        clickGain.gain.setValueAtTime(0.4 * volume, time);
        clickGain.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.001 * volume), time + 0.02);
        click.connect(clickFilter).connect(clickGain).connect(ctx.destination);
        click.start(time);
        click.stop(time + 0.02);
        
        // FIX: Added this condition to prevent overwriting parameters for the 'Rock' sound, which falls through.
        if (sound !== 'Rock') {
            startFreq = sound === 'Thump' ? 100 : 160;
            endFreq = sound === 'Thump' ? 35 : 45;
            decay = sound === 'Thump' ? 0.25 : 0.2;
            gainVol = sound === 'Thump' ? 1.3 : 1.1;
        }
        break;
      }
    }

    osc.connect(gain);
    finalNode.connect(ctx.destination);

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay * 0.8);
    gain.gain.setValueAtTime(gainVol * volume, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + decay);
    osc.start(time);
    osc.stop(time + decay);
};
  
export const createSnare = (ctx: AudioContext, time: number, sound: SnareSound = 'Acoustic', volume: number = 1.0) => {
    // Noise component (the "snares")
    const noiseType = sound === 'Brush' ? 'pink' : 'white';
    const noise = createNoise(ctx, noiseType, 0.2);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    const noiseEnvelope = ctx.createGain();
    
    // Body component (the "drum")
    const osc = ctx.createOscillator();
    const oscEnvelope = ctx.createGain();

    // Reverb for depth
    const reverb = createReverb(ctx, 0.15, 2);
    const wetGain = ctx.createGain();
    wetGain.gain.value = (sound === 'Acoustic' || sound === 'Tight') ? 0.2 : 0; // Only for acoustic snares

    noise.connect(noiseFilter).connect(noiseEnvelope);
    osc.connect(oscEnvelope);
    
    noiseEnvelope.connect(ctx.destination);
    oscEnvelope.connect(ctx.destination);
    
    noiseEnvelope.connect(reverb).connect(wetGain).connect(ctx.destination);
    oscEnvelope.connect(reverb).connect(wetGain).connect(ctx.destination);

    let hpf = 1000, noiseDecay = 0.15, oscFreq = 200, oscDecay = 0.1;

    switch(sound) {
      case '808':
        hpf = 1500; noiseDecay = 0.1; oscFreq = 180; oscDecay = 0.15;
        break;
      case 'Brush':
        hpf = 2000; noiseDecay = 0.25; oscFreq = 250; oscDecay = 0.08;
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
    noiseEnvelope.gain.setValueAtTime(0.8 * volume, time);
    noiseEnvelope.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + noiseDecay);
    noise.start(time);
    noise.stop(time + noiseDecay);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(oscFreq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(oscFreq, time + oscDecay * 0.5);
    oscEnvelope.gain.setValueAtTime(0.9 * volume, time);
    oscEnvelope.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + oscDecay);
    osc.start(time);
    osc.stop(time + oscDecay);
};

export const createHiHat = (ctx: AudioContext, time: number, sound: HiHatSound = 'Acoustic', volume: number = 1.0) => {
    const gain = ctx.createGain();
    
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 7000; // Cut lows for crispness
    
    let decay = 0.05, hpf = 7000, gainVol = 0.4;
    
    switch(sound) {
      case '808':
        decay = 0.15; gainVol = 0.5;
        break;
      case 'Bright':
        decay = 0.04; gainVol = 0.3; hpf = 9000;
        break;
      case 'Acoustic':
      default:
        decay = 0.05; gainVol = 0.4;
        break;
    }

    bandpass.frequency.value = hpf;
    
    ratios.forEach(ratio => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        // Detune slightly for a more complex, shimmering sound
        const fundamental = sound === 'Acoustic' ? 40 + Math.random() * 2 : 40;
        osc.frequency.value = fundamental * ratio;
        osc.connect(bandpass);
        osc.start(time);
        osc.stop(time + decay);
    });

    gain.gain.setValueAtTime(gainVol * volume, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.001 * volume), time + decay);
    
    bandpass.connect(highpass).connect(gain).connect(ctx.destination);
};


export const createClap = (ctx: AudioContext, time: number, sound: ClapSound = 'Acoustic', volume: number = 1.0) => {
    // Recreate a clap by firing 3 slightly delayed noise bursts
    const mainGain = ctx.createGain();
    mainGain.gain.value = volume;
    mainGain.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = sound === '808' ? 1200 : 1000;
    filter.Q.value = 50;
    filter.connect(mainGain);

    const decay = sound === '808' ? 0.1 : 0.15;
    
    const createBurst = (startTime: number, gainValue: number) => {
        const noise = createNoise(ctx, 'white', decay);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(gainValue, startTime);
        gain.gain.exponentialRampToValueAtTime(MIN_EXP_TARGET, startTime + decay);
        noise.connect(gain).connect(filter);
        noise.start(startTime);
        noise.stop(startTime + decay);
    };
    
    createBurst(time, 1.0);
    createBurst(time + 0.008, 0.8);
    createBurst(time + 0.016, 0.9);
}

export const createTom = (ctx: AudioContext, time: number, sound: TomSound = 'Acoustic Mid', volume: number = 1.0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    let startFreq = 200, endFreq = 100, decay = 0.2;
    let oscType: OscillatorType = 'triangle';

    switch(sound) {
      case 'Acoustic Low':
        startFreq = 150; endFreq = 75; decay = 0.3;
        break;
      case 'Acoustic High':
        startFreq = 300; endFreq = 150; decay = 0.15;
        break;
      case 'Electro':
        startFreq = 250; endFreq = 50; decay = 0.4;
        oscType = 'sine'; // Classic electro tom sound
        break;
      case 'Acoustic Mid':
      default:
        startFreq = 200; endFreq = 100; decay = 0.2;
        break;
    }

    osc.type = oscType;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay * 0.8); // More pronounced pitch drop

    gain.gain.setValueAtTime(1 * volume, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(MIN_EXP_TARGET, 0.01 * volume), time + decay);

    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + decay);
}