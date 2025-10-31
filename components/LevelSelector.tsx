
import React from 'react';
import { Difficulty } from '../types';
import Tuner from './Tuner';
import BeatMaker from './BeatMaker';

interface LevelSelectorProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

const difficultyLevels: { name: Difficulty; description: string; color: string; colorClass: string }[] = [
  { name: 'Beginner', description: 'Start with the fundamentals. Simple patterns and scales.', color: 'var(--color-beginner)', colorClass: 'hover:border-[var(--color-beginner)] hover:shadow-[var(--color-beginner)]/20' },
  { name: 'Intermediate', description: 'Challenge yourself with more complex lines and theory.', color: 'var(--color-intermediate)', colorClass: 'hover:border-[var(--color-intermediate)] hover:shadow-[var(--color-intermediate)]/20' },
  { name: 'Advanced', description: 'Master difficult techniques and advanced concepts.', color: 'var(--color-advanced)', colorClass: 'hover:border-[var(--color-advanced)] hover:shadow-[var(--color-advanced)]/20' },
];

const LevelSelector: React.FC<LevelSelectorProps> = ({ onSelectDifficulty }) => {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2 text-[var(--text-accent)]">Welcome to the Practice Room</h2>
        <p className="text-lg text-[var(--text-secondary)] mb-8">Select your skill level to begin, or use the tools below to warm up.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {difficultyLevels.map(({ name, description, color, colorClass }) => (
            <button
              key={name}
              onClick={() => onSelectDifficulty(name)}
              className={`p-8 bg-[var(--bg-secondary)] rounded-lg border-2 border-[var(--border-primary)] transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-xl ${colorClass}`}
            >
              <h3 className="text-3xl font-bold mb-3" style={{ color }}>{name}</h3>
              <p className="text-[var(--text-secondary)]">{description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-6 border border-[var(--border-primary)]">
            <h3 className="text-3xl font-bold text-[var(--text-accent)] mb-4 text-center">Chromatic Tuner</h3>
            <Tuner />
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-6 border border-[var(--border-primary)]">
             <h3 className="text-3xl font-bold text-[var(--text-accent)] mb-4 text-center">Beat Maker</h3>
            <BeatMaker />
        </div>
      </div>
    </div>
  );
};

export default LevelSelector;
