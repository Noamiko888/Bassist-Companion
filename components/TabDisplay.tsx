import React from 'react';

interface TabDisplayProps {
  tablature: string;
}

const TabDisplay: React.FC<TabDisplayProps> = ({ tablature }) => {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg overflow-x-auto border border-[var(--border-primary)]">
      <pre className="text-[var(--text-secondary)] font-roboto-mono text-sm md:text-base whitespace-pre">
        <code>{tablature}</code>
      </pre>
    </div>
  );
};

export default TabDisplay;