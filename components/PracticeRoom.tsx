import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lick, BassSound } from '../types';
import TabDisplay from './TabDisplay';
import DrumMachine from './DrumMachine';
import { BackIcon, PlayIcon, PauseIcon } from './icons';
import { DRUM_PATTERNS } from '../constants';
import { createBassNote } from '../audio/audioUtils';
import { generateTablature } from '../utils/licks';

interface PracticeRoomProps {
  lick: Lick;
  onBack: () => void;
  bassSound: BassSound;
  onBassSoundChange: (sound: BassSound) => void;
}

let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const PracticeRoom: React.FC<PracticeRoomProps> = ({ lick, onBack, bassSound, onBassSoundChange }) => {
  const [tempo, setTempo] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [drumPatternName, setDrumPatternName] = useState<string>(DRUM_PATTERNS[0].name);
  const [isDrumsMuted, setIsDrumsMuted] = useState(false);
  const [visualBeat, setVisualBeat] = useState<number | null>(null);
  
  const schedulerTimer = useRef<number | null>(null);
  const current16thStep = useRef(0);
  const nextNoteTime = useRef(0.0);
  const playbackStartTime = useRef(0.0);
  const visualScheduler = useRef<number | null>(null);
  
  const timeSignatureBeats = lick.timeSignature === '4/4' ? 4 : lick.timeSignature === '3/4' ? 3 : 7;
  const tablature = generateTablature(lick.sequence, lick.timeSignature);

  const difficultyColor: { [key in Lick['difficulty']]: string } = {
    Beginner: 'bg-green-500 text-green-900',
    Intermediate: 'bg-yellow-500 text-yellow-900',
    Advanced: 'bg-red-500 text-red-900',
  };
  
  const createKick = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.start(time);
    osc.stop(time + 0.1);
  };
  
  const createSnare = (ctx: AudioContext, time: number) => {
    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, bufferSize);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);
    const noiseEnvelope = ctx.createGain();
    noiseFilter.connect(noiseEnvelope);
    noiseEnvelope.connect(ctx.destination);
    noiseEnvelope.gain.setValueAtTime(1, time);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.start(time);
    noise.stop(time + 0.2);
  };

  const createHiHat = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(bandpass).connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  };

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    const scheduleAheadTime = 0.1;
    const currentPattern = DRUM_PATTERNS.find(p => p.name === drumPatternName)!;
    const secondsPer16thNote = (60.0 / tempo) / 4;

    while (nextNoteTime.current < ctx.currentTime + scheduleAheadTime) {
      const lickIs16th = lick.sequence.length > 8 && lick.sequence.length > timeSignatureBeats * 2;
      const stepOfBar = current16thStep.current % 16;
      
      // --- Schedule Bass ---
      if (lickIs16th) {
        const lickStepIndex = current16thStep.current % lick.sequence.length;
        const note = lick.sequence[lickStepIndex];
        if (note) createBassNote(ctx, nextNoteTime.current, note.midi, bassSound);
      } else if (stepOfBar % 2 === 0) { // 8th note lick
        const lickStepIndex = (current16thStep.current / 2) % lick.sequence.length;
        const note = lick.sequence[lickStepIndex];
        if (note) createBassNote(ctx, nextNoteTime.current, note.midi, bassSound);
      }

      // --- Schedule Drums (always 8th notes) ---
      if (!isDrumsMuted && stepOfBar % 2 === 0) {
        const drumStepIndex = (stepOfBar / 2) % currentPattern.sequence.length;
        const patternStep = currentPattern.sequence[drumStepIndex];
        if (patternStep[0]) createKick(ctx, nextNoteTime.current);
        if (patternStep[1]) createSnare(ctx, nextNoteTime.current);
        if (patternStep[2]) createHiHat(ctx, nextNoteTime.current);
      }
      
      nextNoteTime.current += secondsPer16thNote;
      current16thStep.current++;
    }
  }, [tempo, lick.sequence, bassSound, drumPatternName, isDrumsMuted, timeSignatureBeats]);
  
  const start = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    current16thStep.current = 0;
    const startTime = ctx.currentTime + 0.1;
    nextNoteTime.current = startTime;
    playbackStartTime.current = startTime;

    scheduler();
    schedulerTimer.current = window.setInterval(scheduler, 25);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (schedulerTimer.current) {
      clearInterval(schedulerTimer.current);
      schedulerTimer.current = null;
    }
  }, []);

  const togglePlay = () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    setIsPlaying(prev => !prev);
  };
  
  const visualLoop = useCallback(() => {
      const ctx = getAudioContext();
      const secondsPerBeat = 60.0 / tempo;
      const timeElapsed = ctx.currentTime - playbackStartTime.current;
      if (timeElapsed >= 0) {
          const newVisualBeat = Math.floor(timeElapsed / secondsPerBeat) % timeSignatureBeats;
          setVisualBeat(beat => (beat !== newVisualBeat ? newVisualBeat : beat));
      }
      visualScheduler.current = requestAnimationFrame(visualLoop);
  }, [tempo, timeSignatureBeats]);

  useEffect(() => {
      if (isPlaying) {
          visualScheduler.current = requestAnimationFrame(visualLoop);
      } else {
          if (visualScheduler.current) cancelAnimationFrame(visualScheduler.current);
          setVisualBeat(null);
      }
      return () => {
          if (visualScheduler.current) cancelAnimationFrame(visualScheduler.current);
      };
  }, [isPlaying, visualLoop]);

  useEffect(() => {
    if (isPlaying) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [isPlaying, start, stop]);

  useEffect(() => {
    if(isPlaying) {
        stop();
        start();
    }
  }, [tempo, bassSound, drumPatternName, isDrumsMuted, lick, start, stop]);

  return (
    <div className="space-y-8">
      <div>
        <button onClick={onBack} className="flex items-center text-purple-400 hover:text-purple-300 mb-4 group">
          <BackIcon />
          <span className="ml-2 group-hover:underline">Back to Exercises</span>
        </button>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4 mb-1 flex-wrap">
            <h2 className="text-4xl font-bold text-purple-400">{lick.name}</h2>
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${difficultyColor[lick.difficulty]}`}>
              {lick.difficulty}
            </span>
          </div>
          <p className="text-xl text-gray-400 mb-4">Style: {lick.artist}</p>
          <p className="text-gray-300 mb-6">{lick.description}</p>
          <TabDisplay tablature={tablature} />
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-3xl font-bold text-purple-300 mb-4">Practice Controls</h3>
        
        <div className="flex justify-center gap-4 mb-6">
            {Array.from({ length: timeSignatureBeats }).map((_, i) => (
                <div
                    key={i}
                    className={`h-4 w-4 rounded-full transition-all duration-100 ease-in-out ${
                        visualBeat === i ? 'bg-purple-400 scale-125' : 'bg-gray-600'
                    }`}
                />
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4 justify-center md:justify-start">
                <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-full transition-colors duration-200 shadow-lg flex items-center justify-center gap-2 w-32"
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    <span className="font-bold text-lg">{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
            </div>
            
            <div className="flex flex-col items-center">
                <div className="text-6xl font-bold text-gray-100 font-roboto-mono">{tempo}</div>
                <div className="text-sm text-gray-400 -mt-2">BPM</div>
                 <input
                    id="tempo"
                    type="range"
                    min="40"
                    max="200"
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
                />
            </div>
            
            <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                 <label htmlFor="bassSound" className="text-lg font-semibold text-purple-300">Bass Sound</label>
                 <select
                    id="bassSound"
                    value={bassSound}
                    onChange={(e) => onBassSoundChange(e.target.value as BassSound)}
                    className="w-full sm:w-auto bg-gray-700 text-white py-2 px-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="J-Bass">J-Bass</option>
                    <option value="P-Bass">P-Bass</option>
                    <option value="Muted Pick">Muted Pick</option>
                    <option value="Sub Synth">Sub Synth</option>
                    <option value="Classic">Classic</option>
                    <option value="Electric">Electric</option>
                    <option value="Synth">Synth</option>
                  </select>
            </div>
        </div>
        <div className="border-t border-gray-700 pt-6">
          <DrumMachine 
            patternName={drumPatternName}
            onPatternChange={setDrumPatternName}
            isMuted={isDrumsMuted}
            onMuteToggle={() => setIsDrumsMuted(prev => !prev)}
          />
        </div>
      </div>
    </div>
  );
};

export default PracticeRoom;
