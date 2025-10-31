export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type BassSound = 'J-Bass' | 'P-Bass' | 'Muted Pick' | 'Sub Synth' | 'Classic' | 'Electric' | 'Synth';

// Individual drum sound types for mix-and-match kits
export type KickSound = 'Acoustic' | '808' | 'Rock' | 'Thump';
export type SnareSound = 'Acoustic' | '808' | 'Brush' | 'Tight';
export type HiHatSound = 'Acoustic' | '808' | 'Bright';
export type ClapSound = 'Acoustic' | '808';
export type TomSound = 'Acoustic Low' | 'Acoustic Mid' | 'Acoustic High' | 'Electro';


export type TimeSignature = '4/4' | '3/4' | '7/4';

export interface Note {
  midi: number;
  string: number;
  fret: number;
}

export interface Lick {
  name: string;
  artist: string;
  category: 'Warm-up' | 'Scale' | 'Arpeggio' | 'Walking Bass' | 'Funk';
  description: string;
  difficulty: Difficulty;
  timeSignature: TimeSignature;
  originalKey: string;
  transposable: boolean;
  sequence: (Note | null)[];
}

export interface DrumPattern {
  name: string;
  sequence: number[][];
}