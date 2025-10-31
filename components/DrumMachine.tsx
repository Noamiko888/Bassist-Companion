import React from 'react';
import { DRUM_PATTERNS } from '../constants';
import { SpeakerOnIcon, SpeakerOffIcon } from './icons';

interface DrumMachineProps {
  patternName: string;
  onPatternChange: (name: string) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const DrumMachine: React.FC<DrumMachineProps> = ({ patternName, onPatternChange, isMuted, onMuteToggle }) => {
  return (
    <div>
      <div className="flex items-center justify-between">
         <h4 className="text-xl font-semibold text-purple-300">Drum Machine</h4>
         <button 
            onClick={onMuteToggle}
            aria-label={isMuted ? "Unmute Drums" : "Mute Drums"}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-md transition-colors"
         >
            {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            <span>{isMuted ? "Muted" : "On"}</span>
         </button>
      </div>
      <div className="mt-2">
          <label htmlFor="pattern" className="sr-only">Drum Pattern</label>
          <select
            id="pattern"
            value={patternName}
            onChange={(e) => onPatternChange(e.target.value)}
            className="w-full bg-gray-700 text-white py-2 px-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {DRUM_PATTERNS.map((pattern) => (
              <option key={pattern.name} value={pattern.name}>
                {pattern.name}
              </option>
            ))}
          </select>
      </div>
    </div>
  );
};

export default DrumMachine;
