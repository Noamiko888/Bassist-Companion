import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lick, BassSound, KickSound, SnareSound, HiHatSound, ClapSound, TomSound } from '../types';
import TabDisplay from './TabDisplay';
import DrumMachine from './DrumMachine';
import { BackIcon, PlayIcon, PauseIcon } from './icons';
import { DRUM_PATTERNS } from '../constants';
import { createBassNote, createKick, createSnare, createHiHat, createClap, createTom } from '../audio/audioUtils';
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

  // Individual drum sound states
  const [kickSound, setKickSound] = useState<KickSound>('Acoustic');
  const [snareSound, setSnareSound] = useState<SnareSound>('Acoustic');
  const [hiHatSound, setHiHatSound] = useState<HiHatSound>('Acoustic');
  const [clapSound, setClapSound] = useState<ClapSound>('Acoustic');
  const [tomSound, setTomSound] = useState<TomSound>('Acoustic Mid');
  
  const schedulerTimer = useRef<number | null>(null);
  const current16thStep = useRef(0);
  const nextNoteTime = useRef(0.0);
  const playbackStartTime = useRef(0.0);
  const visualScheduler = useRef<number | null>(null);
  
  const timeSignatureBeats = lick.timeSignature === '4/4' ? 4 : lick.timeSignature === '3/4' ? 3 : 7;
  const tablature = generateTablature(lick.sequence, lick.timeSignature);

  const difficultyClasses: { [key in Lick['difficulty']]: string } = {
    Beginner: 'bg-[var(--color-beginner)]/20 text-[var(--color-beginner)]',
    Intermediate: 'bg-[var(--color-intermediate)]/20 text-[var(--color-intermediate)]',
    Advanced: 'bg-[var(--color-advanced)]/20 text-[var(--color-advanced)]',
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
      // Sequence order: [kick, snare, hi-hat, clap, tom]
      if (!isDrumsMuted && stepOfBar % 2 === 0) {
        const drumStepIndex = (stepOfBar / 2) % currentPattern.sequence.length;
        const patternStep = currentPattern.sequence[drumStepIndex];
        if (patternStep[0]) createKick(ctx, nextNoteTime.current, kickSound);
        if (patternStep[1]) createSnare(ctx, nextNoteTime.current, snareSound);
        if (patternStep[2]) createHiHat(ctx, nextNoteTime.current, hiHatSound);
        if (patternStep[3]) createClap(ctx, nextNoteTime.current, clapSound);
        if (patternStep[4]) createTom(ctx, nextNoteTime.current, tomSound);
      }
      
      nextNoteTime.current += secondsPer16thNote;
      current16thStep.current++;
    }
  }, [tempo, lick.sequence, bassSound, drumPatternName, isDrumsMuted, timeSignatureBeats, kickSound, snareSound, hiHatSound, clapSound, tomSound]);
  
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
  }, [tempo, bassSound, drumPatternName, isDrumsMuted, lick, start, stop, kickSound, snareSound, hiHatSound, clapSound, tomSound]);

  return (
    <div className="space-y-8">
      <div>
        <button onClick={onBack} className="flex items-center text-[var(--text-accent)] hover:text-[var(--accent-primary-hover)] mb-4 group">
          <BackIcon />
          <span className="ml-2 group-hover:underline">Back to Exercises</span>
        </button>
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-6 border border-[var(--border-primary)]">
          <div className="flex items-center gap-4 mb-1 flex-wrap">
            <h2 className="text-4xl font-bold text-[var(--text-accent)]">{lick.name}</h2>
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${difficultyClasses[lick.difficulty]}`}>
              {lick.difficulty}
            </span>
          </div>
          <p className="text-xl text-[var(--text-secondary)] mb-4">Style: {lick.artist}</p>
          <p className="text-[var(--text-primary)] mb-6">{lick.description}</p>
          <TabDisplay tablature={tablature} />
        </div>
      </div>
      
      <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-6 border border-[var(--border-primary)]">
        <h3 className="text-3xl font-bold text-[var(--text-accent)] mb-4">Practice Controls</h3>
        
        <div className="flex justify-center gap-4 mb-6">
            {Array.from({ length: timeSignatureBeats }).map((_, i) => (
                <div
                    key={i}
                    className={`h-4 w-4 rounded-full transition-all duration-150 ease-in-out ${
                        visualBeat === i ? 'bg-[var(--accent-primary)] scale-125' : 'bg-[var(--bg-tertiary)]'
                    }`}
                />
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4 justify-center md:justify-start">
                <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white p-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-36"
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    <span className="font-bold text-lg">{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
            </div>
            
            <div className="flex flex-col items-center">
                <div className="text-6xl font-bold text-[var(--text-primary)] font-roboto-mono">{tempo}</div>
                <div className="text-sm text-[var(--text-secondary)] -mt-2">BPM</div>
                 <input
                    id="tempo"
                    type="range"
                    min="40"
                    max="200"
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    className="w-full mt-2"
                />
            </div>
            
            <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                 <label htmlFor="bassSound" className="text-lg font-semibold text-[var(--text-accent)]">Bass Sound</label>
                 <select
                    id="bassSound"
                    value={bassSound}
                    onChange={(e) => onBassSoundChange(e.target.value as BassSound)}
                    className="w-full sm:w-auto bg-[var(--bg-tertiary)] text-[var(--text-primary)] py-2 px-3 rounded-md border border-[var(--border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
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
        <div className="border-t border-[var(--border-primary)] pt-6">
          <DrumMachine 
            patternName={drumPatternName}
            onPatternChange={setDrumPatternName}
            isMuted={isDrumsMuted}
            onMuteToggle={() => setIsDrumsMuted(prev => !prev)}
            kickSound={kickSound} onKickSoundChange={setKickSound}
            snareSound={snareSound} onSnareSoundChange={setSnareSound}
            hiHatSound={hiHatSound} onHiHatSoundChange={setHiHatSound}
            clapSound={clapSound} onClapSoundChange={setClapSound}
            tomSound={tomSound} onTomSoundChange={setTomSound}
          />
        </div>
      </div>
    </div>
  );
};

export default PracticeRoom;