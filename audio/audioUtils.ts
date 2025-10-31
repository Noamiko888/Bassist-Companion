import { BassSound } from '../types';

export const midiToFreq = (midi: number): number => {
  return Math.pow(2, (midi - 69) / 12) * 440;
};

// This function creates a bass note with a specific sound and returns the source nodes
// so they can be stopped manually if needed (e.g., in a preview).
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
