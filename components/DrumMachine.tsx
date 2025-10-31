import React, { useRef, useCallback } from 'react';
import { DRUM_PATTERNS, KICK_SOUNDS, SNARE_SOUNDS, HIHAT_SOUNDS, CLAP_SOUNDS, TOM_SOUNDS } from '../constants';
import { SpeakerOnIcon, SpeakerOffIcon } from './icons';
import { KickSound, SnareSound, HiHatSound, ClapSound, TomSound } from '../types';
import { createKick, createSnare, createHiHat, createClap, createTom } from '../audio/audioUtils';

interface DrumMachineProps {
  patternName: string;
  onPatternChange: (name: string) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  kickSound: KickSound;
  onKickSoundChange: (sound: KickSound) => void;
  snareSound: SnareSound;
  onSnareSoundChange: (sound: SnareSound) => void;
  hiHatSound: HiHatSound;
  onHiHatSoundChange: (sound: HiHatSound) => void;
  clapSound: ClapSound;
  onClapSoundChange: (sound: ClapSound) => void;
  tomSound: TomSound;
  onTomSoundChange: (sound: TomSound) => void;
}

const DrumMachine: React.FC<DrumMachineProps> = ({ 
  patternName, 
  onPatternChange, 
  isMuted, 
  onMuteToggle,
  kickSound, onKickSoundChange,
  snareSound, onSnareSoundChange,
  hiHatSound, onHiHatSoundChange,
  clapSound, onClapSoundChange,
  tomSound, onTomSoundChange,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playPreview = useCallback((instrument: 'Kick' | 'Snare' | 'Hi-Hat' | 'Clap' | 'Tom') => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const time = ctx.currentTime;
    switch(instrument) {
      case 'Kick': createKick(ctx, time, kickSound); break;
      case 'Snare': createSnare(ctx, time, snareSound); break;
      case 'Hi-Hat': createHiHat(ctx, time, hiHatSound); break;
      case 'Clap': createClap(ctx, time, clapSound); break;
      case 'Tom': createTom(ctx, time, tomSound); break;
    }
  }, [kickSound, snareSound, hiHatSound, clapSound, tomSound]);

  const instrumentControls = [
    { name: 'Kick', sound: kickSound, onChange: onKickSoundChange, options: KICK_SOUNDS },
    { name: 'Snare', sound: snareSound, onChange: onSnareSoundChange, options: SNARE_SOUNDS },
    { name: 'Hi-Hat', sound: hiHatSound, onChange: onHiHatSoundChange, options: HIHAT_SOUNDS },
    { name: 'Clap', sound: clapSound, onChange: onClapSoundChange, options: CLAP_SOUNDS },
    { name: 'Tom', sound: tomSound, onChange: onTomSoundChange, options: TOM_SOUNDS },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
         <h4 className="text-xl font-semibold text-[var(--text-accent)]">Drum Machine</h4>
         <div className="flex items-center gap-4">
          <div>
            <label htmlFor="pattern" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Drum Pattern</label>
            <select
              id="pattern"
              value={patternName}
              onChange={(e) => onPatternChange(e.target.value)}
              // FIX: Removed invalid 'options' prop from select element. The children <option> elements are used instead.
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] py-2 px-3 rounded-md border border-[var(--border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
              {DRUM_PATTERNS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button 
              onClick={onMuteToggle}
              aria-label={isMuted ? "Unmute Drums" : "Mute Drums"}
              className="self-end flex items-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] py-2 px-3 rounded-md transition-colors"
          >
              {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
              <span>{isMuted ? "Muted" : "On"}</span>
          </button>
         </div>
      </div>
      <div className="mt-4 border-t border-[var(--border-primary)] pt-4">
        <h5 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">Customize Drum Sounds</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {instrumentControls.map(({ name, sound, onChange, options }) => (
            <div key={name} className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-secondary)] space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-lg text-[var(--text-primary)]">{name}</label>
                <button 
                  onClick={() => playPreview(name as any)} 
                  className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label={`Preview ${name} sound`}
                >
                  <SpeakerOnIcon className="h-5 w-5" />
                </button>
              </div>
              <select
                value={sound}
                // FIX: Cast onChange to 'any' to bypass incorrect type inference on the union of onChange handlers, which was resulting in a parameter type of 'never'.
                onChange={(e) => (onChange as any)(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] py-1 px-2 text-sm rounded-md border border-[var(--border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              >
                {(options as readonly string[]).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrumMachine;