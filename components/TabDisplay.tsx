
import React from 'react';

interface TabDisplayProps {
  tablature: string;
}

const TabDisplay: React.FC<TabDisplayProps> = ({ tablature }) => {
  return (
    <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
      <pre className="text-gray-300 font-roboto-mono text-sm md:text-base whitespace-pre">
        <code>{tablature}</code>
      </pre>
    </div>
  );
};

export default TabDisplay;
