
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-4xl md:text-5xl font-bold text-center tracking-wider text-purple-400 uppercase">
          Bassist Companion
        </h1>
      </div>
    </header>
  );
};

export default Header;
