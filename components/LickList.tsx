import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lick, Difficulty, BassSound } from '../types';
import { BackIcon, PlayIcon, StopIcon, LoadingIcon } from './icons';
import { createBassNote } from '../audio/audioUtils';
import { transposeLick, KEYS } from '../utils/licks';

interface LickListProps {
  licks: Lick[];
  difficulty: Difficulty;
  onSelectLick: (lick: Lick) => void;
  onBack: () => void;
  onGenerateLick: () => void;
  isGenerating: boolean;
  bassSound: BassSound;
  onBassSoundChange: (sound: BassSound) => void;
  selectedKey: string;
  onKeyChange: (key: string) => void;
}

const LickList: React.FC<LickListProps> = ({ 
  licks, difficulty, onSelectLick, onBack, onGenerateLick, isGenerating, 
  bassSound, onBassSoundChange, selectedKey, onKeyChange 
}) => {
  const [playingLickName, setPlayingLickName] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerIntervalRef = useRef<number | null>(null);
  const scheduledNodesRef = useRef<AudioScheduledSourceNode[]>([]);
  
  const stopPreview = useCallback(() => {
    if (schedulerIntervalRef.current) {
      clearInterval(schedulerIntervalRef.current);
      schedulerIntervalRef.current = null;
    }
    scheduledNodesRef.current.forEach(node => {
        try { node.stop(); } catch(e) {/* already stopped */}
    });
    scheduledNodesRef.current = [];
    setPlayingLickName(null);
  }, []);

  const playPreview = useCallback((lick: Lick) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    setPlayingLickName(lick.name);

    let currentStep = 0;
    const tempo = 100; // Fixed preview tempo
    const is16th = lick.sequence.length > 8;
    const secondsPerStep = is16th ? (60.0 / tempo) / 4 : (60.0 / tempo) / 2;

    const scheduleNote = () => {
      const stepIndex = currentStep % lick.sequence.length;
      const note = lick.sequence[stepIndex];
      const time = ctx.currentTime;
      
      if (note) {
          const nodes = createBassNote(ctx, time, note.midi, bassSound);
          scheduledNodesRef.current.push(...nodes);
      }
      
      currentStep++;
    };

    scheduleNote(); // Play first note immediately
    schedulerIntervalRef.current = window.setInterval(scheduleNote, secondsPerStep * 1000);
  }, [bassSound]);

  const handlePreviewToggle = (e: React.MouseEvent, lick: Lick) => {
    e.stopPropagation();
    if (playingLickName === lick.name) {
      stopPreview();
    } else {
      if (playingLickName) {
        stopPreview();
      }
      playPreview(lick);
    }
  };

  const handleSoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    stopPreview();
    onBassSoundChange(e.target.value as BassSound);
  }

  useEffect(() => {
    return stopPreview;
  }, [stopPreview]);

  const groupedLicks = licks.reduce((acc, lick) => {
    const { category } = lick;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(lick);
    return acc;
  }, {} as Record<Lick['category'], Lick[]>);

  const categoryOrder: Lick['category'][] = ['Warm-up', 'Scale', 'Arpeggio', 'Walking Bass', 'Funk'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center">
            <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full mr-4 transition-colors">
            <BackIcon />
            </button>
            <h2 className="text-4xl font-bold text-purple-300">{difficulty} Exercises</h2>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
            <div className='flex items-center gap-2'>
              <label htmlFor="practiceKey" className="text-gray-300 font-semibold">Practice Key:</label>
              <select
                id="practiceKey"
                value={selectedKey}
                onChange={(e) => onKeyChange(e.target.value)}
                className="bg-gray-700 text-white py-2 px-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {KEYS.map(key => <option key={key} value={key}>{key}</option>)}
              </select>
            </div>
            <select
              id="previewBassSound"
              value={bassSound}
              onChange={handleSoundChange}
              className="bg-gray-700 text-white py-2 px-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="J-Bass">J-Bass</option>
              <option value="P-Bass">P-Bass</option>
              <option value="Muted Pick">Muted Pick</option>
              <option value="Sub Synth">Sub Synth</option>
              <option value="Classic">Classic</option>
              <option value="Electric">Electric</option>
              <option value="Synth">Synth</option>
            </select>
            <button
                onClick={onGenerateLick}
                disabled={isGenerating}
                className="flex items-center justify-center bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
                {isGenerating ? <><LoadingIcon /><span>Generating...</span></> : "✨ Generate New Lick"}
            </button>
        </div>
      </div>

      <div className="space-y-8">
        {categoryOrder.map(category => (
          groupedLicks[category] && groupedLicks[category].length > 0 && (
            <div key={category}>
              <h3 className="text-2xl font-semibold text-purple-400 border-b-2 border-purple-500/30 pb-2 mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedLicks[category].map((lick) => {
                  const displayLick = lick.transposable ? transposeLick(lick, selectedKey) : lick;
                  return (
                    <button
                      key={lick.name}
                      onClick={() => onSelectLick(lick)} // Pass original lick up
                      className="w-full text-left p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-xl text-gray-100">{displayLick.name}</p>
                        <p className="text-sm text-gray-400">{displayLick.artist}</p>
                      </div>
                      <button 
                        onClick={(e) => handlePreviewToggle(e, displayLick)} // Preview transposed lick
                        aria-label={playingLickName === displayLick.name ? "Stop preview" : "Play preview"}
                        className="p-2 rounded-full bg-gray-700 hover:bg-purple-600 transition-colors flex-shrink-0"
                      >
                        {playingLickName === displayLick.name ? <StopIcon className="h-5 w-5"/> : <PlayIcon className="h-5 w-5"/>}
                      </button>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default LickList;
