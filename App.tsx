import React, { useState, useCallback, useEffect } from 'react';
import { Lick, Difficulty, BassSound } from './types';
import { PREDEFINED_LICKS } from './constants';
import Header from './components/Header';
import LevelSelector from './components/LevelSelector';
import LickList from './components/LickList';
import PracticeRoom from './components/PracticeRoom';
import { generateLick } from './services/geminiService';
import { transposeLick } from './utils/licks';

type View = 'level' | 'list' | 'practice';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [view, setView] = useState<View>('level');
  const [licks, setLicks] = useState<Lick[]>(PREDEFINED_LICKS);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedLick, setSelectedLick] = useState<Lick | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bassSound, setBassSound] = useState<BassSound>('J-Bass');
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('bass-companion-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (savedTheme === 'dark' || (!savedTheme && prefersDark)) ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bass-companion-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setView('list');
  };

  const handleSelectLick = (lick: Lick) => {
    setSelectedLick(lick);
    setView('practice');
  };

  const handleBack = () => {
    if (view === 'practice') {
      setView('list');
    } else if (view === 'list') {
      setView('level');
      setSelectedDifficulty(null);
    }
  };

  const handleGenerateLick = useCallback(async (difficulty: Difficulty) => {
    setIsGenerating(true);
    try {
      const existingNames = licks.map(l => l.name);
      // It's better to generate licks in a base key and let the user transpose them.
      const newLick = await generateLick(difficulty, existingNames, 'C');
      if (newLick) {
        setLicks(prevLicks => [...prevLicks, newLick]);
      } else {
        alert("Sorry, we couldn't generate a new lick. The model might be busy. Please try again.");
      }
    } catch (error) {
      console.error("Failed to generate lick:", error);
      alert("An error occurred while generating the lick.");
    } finally {
      setIsGenerating(false);
    }
  }, [licks]);

  const renderContent = () => {
    switch (view) {
      case 'level':
        return <LevelSelector onSelectDifficulty={handleSelectDifficulty} />;
      case 'list':
        if (!selectedDifficulty) return null;
        const filteredLicks = licks.filter(lick => lick.difficulty === selectedDifficulty);
        return <LickList 
          licks={filteredLicks} 
          onSelectLick={handleSelectLick} 
          onBack={handleBack} 
          difficulty={selectedDifficulty} 
          onGenerateLick={() => handleGenerateLick(selectedDifficulty)}
          isGenerating={isGenerating}
          bassSound={bassSound}
          onBassSoundChange={setBassSound}
          selectedKey={selectedKey}
          onKeyChange={setSelectedKey}
        />;
      case 'practice':
        if (!selectedLick) return null;
        const lickToPractice = selectedLick.transposable 
            ? transposeLick(selectedLick, selectedKey) 
            : selectedLick;
        return <PracticeRoom 
          lick={lickToPractice} 
          onBack={handleBack} 
          bassSound={bassSound}
          onBassSoundChange={setBassSound}
        />;
      default:
        return <LevelSelector onSelectDifficulty={handleSelectDifficulty} />;
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;