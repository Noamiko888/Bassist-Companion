export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type TimeSignature = '4/4' | '3/4' | '7/4';
export type BassSound = 'Classic' | 'Electric' | 'Synth' | 'P-Bass' | 'J-Bass' | 'Muted Pick' | 'Sub Synth';

export interface Note {
  midi: number;
  string: number; // 0=G, 1=D, 2=A, 3=E
  fret: number;
}

export interface Lick {
  name: string;
  artist: string; // Using this field for 'Author' or 'Style' now
  category: 'Warm-up' | 'Scale' | 'Arpeggio' | 'Walking Bass' | 'Funk';
  description: string;
  difficulty: Difficulty;
  timeSignature: TimeSignature;
  sequence: (Note | null)[]; // Array of structured notes, null is a rest.
  originalKey: string; // e.g., 'C', 'G', 'Am'
  transposable: boolean;
}

export interface DrumPattern {
  name: string;
  sequence: number[][];
}
