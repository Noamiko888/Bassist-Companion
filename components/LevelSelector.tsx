import React from 'react';
import { Difficulty } from '../types';

interface LevelSelectorProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

const difficultyLevels: { name: Difficulty; description: string; color: string }[] = [
  { name: 'Beginner', description: 'Start with the fundamentals. Simple patterns and scales.', color: 'border-green-500 hover:bg-green-500/20' },
  { name: 'Intermediate', description: 'Challenge yourself with more complex lines and theory.', color: 'border-yellow-500 hover:bg-yellow-500/20' },
  { name: 'Advanced', description: 'Master difficult techniques and advanced concepts.', color: 'border-red-500 hover:bg-red-500/20' },
];

const LevelSelector: React.FC<LevelSelectorProps> = ({ onSelectDifficulty }) => {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold mb-2 text-purple-300">Welcome to the Practice Room</h2>
      <p className="text-lg text-gray-400 mb-8">Select your skill level to begin.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {difficultyLevels.map(({ name, description, color }) => (
          <button
            key={name}
            onClick={() => onSelectDifficulty(name)}
            className={`p-8 bg-gray-800 rounded-lg border-2 ${color} transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-purple-500/30`}
          >
            <h3 className="text-3xl font-bold mb-3">{name}</h3>
            <p className="text-gray-300">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LevelSelector;
