import { Lick, DrumPattern, KickSound, SnareSound, HiHatSound, ClapSound, TomSound } from './types';

// String numbers: 0=G, 1=D, 2=A, 3=E
export const PREDEFINED_LICKS: Lick[] = [
  // == BEGINNER ==
  {
    name: "Chromatic Warm-up",
    artist: "Standard Exercise",
    category: 'Warm-up',
    description: "A simple exercise to warm up your fingers and practice moving across strings. Play slowly and focus on clean notes.",
    difficulty: 'Beginner',
    timeSignature: '4/4',
    originalKey: 'E',
    transposable: false,
    sequence: [
      { midi: 29, string: 3, fret: 1 }, { midi: 30, string: 3, fret: 2 }, { midi: 31, string: 3, fret: 3 }, { midi: 32, string: 3, fret: 4 },
      { midi: 34, string: 2, fret: 1 }, { midi: 35, string: 2, fret: 2 }, { midi: 36, string: 2, fret: 3 }, { midi: 37, string: 2, fret: 4 },
    ],
  },
  {
    name: "Major Scale (G)",
    artist: "Music Theory",
    category: 'Scale',
    description: "The G Major scale is a foundational building block for understanding melody and harmony. Practice this pattern until it becomes muscle memory.",
    difficulty: 'Beginner',
    timeSignature: '4/4',
    originalKey: 'G',
    transposable: true,
    sequence: [
      { midi: 31, string: 3, fret: 3 }, { midi: 33, string: 3, fret: 5 },
      { midi: 35, string: 2, fret: 2 }, { midi: 36, string: 2, fret: 3 }, { midi: 38, string: 2, fret: 5 },
      { midi: 40, string: 1, fret: 2 }, { midi: 42, string: 1, fret: 4 }, { midi: 43, string: 1, fret: 5 },
    ],
  },
  {
    name: "Root-Fifth Pattern (G)",
    artist: "Classic Country/Rock",
    category: 'Walking Bass',
    description: "The root-fifth pattern is the backbone of countless songs. This exercise helps lock in your timing and connection with the drummer.",
    difficulty: 'Beginner',
    timeSignature: '4/4',
    originalKey: 'G',
    transposable: false,
    sequence: [
      { midi: 31, string: 3, fret: 3 }, { midi: 31, string: 3, fret: 3 },
      { midi: 35, string: 2, fret: 2 }, { midi: 35, string: 2, fret: 2 },
      { midi: 38, string: 1, fret: 0 }, { midi: 38, string: 1, fret: 0 }, // D string open
      { midi: 35, string: 2, fret: 2 }, { midi: 35, string: 2, fret: 2 },
    ],
  },
   {
    name: "Major Arpeggio (C)",
    artist: "Music Theory",
    category: 'Arpeggio',
    description: "Playing the notes of a chord one by one. This C Major arpeggio (C-E-G) is a fundamental musical concept.",
    difficulty: 'Beginner',
    timeSignature: '4/4',
    originalKey: 'C',
    transposable: true,
    sequence: [
      { midi: 36, string: 2, fret: 3 }, { midi: 40, string: 1, fret: 2 }, { midi: 43, string: 1, fret: 5 }, { midi: 48, string: 0, fret: 5 },
      { midi: 43, string: 1, fret: 5 }, { midi: 40, string: 1, fret: 2 }, { midi: 36, string: 2, fret: 3 }, null,
    ],
  },
  // == INTERMEDIATE ==
  {
    name: "Walking Bass (ii-V-I)",
    artist: "Jazz Standard",
    category: 'Walking Bass',
    description: "A classic ii-V-I progression in C Major (Dm7-G7-Cmaj7). Focus on a smooth, swinging feel.",
    difficulty: 'Intermediate',
    timeSignature: '4/4',
    originalKey: 'C',
    transposable: false,
    sequence: [
      // Dm7
      { midi: 38, string: 2, fret: 5 }, { midi: 41, string: 1, fret: 3 }, { midi: 42, string: 1, fret: 4 }, { midi: 43, string: 1, fret: 5 },
      // G7
      { midi: 35, string: 2, fret: 2 }, { midi: 36, string: 2, fret: 3 }, { midi: 37, string: 2, fret: 4 }, { midi: 31, string: 3, fret: 3 },
      // Cmaj7
      { midi: 40, string: 2, fret: 7 }, { midi: 39, string: 2, fret: 6 }, { midi: 38, string: 2, fret: 5 }, { midi: 37, string: 2, fret: 4 },
      { midi: 33, string: 3, fret: 5 }, { midi: 32, string: 3, fret: 4 }, { midi: 31, string: 3, fret: 3 }, null,
    ],
  },
  {
    name: "Minor Pentatonic (Am)",
    artist: "Blues/Rock Standard",
    category: 'Scale',
    description: "The A minor pentatonic scale is essential for rock, blues, and funk. This two-octave pattern covers a lot of the fretboard.",
    difficulty: 'Intermediate',
    timeSignature: '4/4',
    originalKey: 'Am',
    transposable: true,
    sequence: [
      { midi: 33, string: 3, fret: 5 }, { midi: 36, string: 2, fret: 3 }, { midi: 38, string: 2, fret: 5 }, { midi: 40, string: 1, fret: 2 },
      { midi: 43, string: 1, fret: 5 }, { midi: 45, string: 0, fret: 2 }, { midi: 48, string: 0, fret: 5 }, { midi: 50, string: 0, fret: 7 },
    ],
  },
   {
    name: "Basic Funk Groove",
    artist: "James Brown Style",
    category: 'Funk',
    description: "A simple funk groove focusing on 16th note rests and syncopation. The key is feeling the 'one'.",
    difficulty: 'Intermediate',
    timeSignature: '4/4',
    originalKey: 'G',
    transposable: false,
    sequence: [
      { midi: 31, string: 3, fret: 3 }, null, null, null, { midi: 31, string: 3, fret: 3 }, null, { midi: 43, string: 1, fret: 5 }, null,
      null, { midi: 31, string: 3, fret: 3 }, { midi: 36, string: 2, fret: 3 }, { midi: 37, string: 2, fret: 4 }, { midi: 38, string: 2, fret: 5 }, null, null, null,
    ],
  },
  {
    name: "12-Bar Blues Walk (A)",
    artist: "Blues Standard",
    category: 'Walking Bass',
    description: "A simple walking bass line over the first four bars of a standard 12-bar blues in the key of A.",
    difficulty: 'Intermediate',
    timeSignature: '4/4',
    originalKey: 'A',
    transposable: false,
    sequence: [
      { midi: 33, string: 2, fret: 0 }, { midi: 33, string: 2, fret: 0 }, { midi: 35, string: 2, fret: 2 }, { midi: 35, string: 2, fret: 2 },
      { midi: 36, string: 2, fret: 3 }, { midi: 36, string: 2, fret: 3 }, { midi: 37, string: 2, fret: 4 }, { midi: 37, string: 2, fret: 4 },
      { midi: 38, string: 1, fret: 0 }, { midi: 38, string: 1, fret: 0 }, { midi: 40, string: 1, fret: 2 }, { midi: 40, string: 1, fret: 2 },
      { midi: 41, string: 1, fret: 3 }, { midi: 41, string: 1, fret: 3 }, { midi: 40, string: 1, fret: 2 }, { midi: 40, string: 1, fret: 2 },
    ],
  },
  // == ADVANCED ==
  {
    name: "Slap & Pop Octaves",
    artist: "Funk Essentials",
    category: 'Funk',
    description: "A fundamental slap bass exercise. Use your thumb to slap the E string and your index or middle finger to pop the D string.",
    difficulty: 'Advanced',
    timeSignature: '4/4',
    originalKey: 'G',
    transposable: false,
    sequence: [
      { midi: 31, string: 3, fret: 3 }, { midi: 43, string: 1, fret: 5 }, { midi: 31, string: 3, fret: 3 }, { midi: 43, string: 1, fret: 5 },
      { midi: 31, string: 3, fret: 3 }, { midi: 43, string: 1, fret: 5 }, { midi: 31, string: 3, fret: 3 }, { midi: 43, string: 1, fret: 5 },
    ],
  },
  {
    name: "Jaco 16th Note Groove",
    artist: "Jaco Pastorius Style",
    category: 'Funk',
    description: "A syncopated 16th note groove focusing on ghost notes and rhythmic precision, inspired by the legendary Jaco Pastorius.",
    difficulty: 'Advanced',
    timeSignature: '4/4',
    originalKey: 'C',
    transposable: false,
    sequence: [
      null, { midi: 43, string: 0, fret: 0 }, { midi: 45, string: 0, fret: 2 }, null, { midi: 48, string: 0, fret: 5 }, null, { midi: 48, string: 0, fret: 5 }, { midi: 50, string: 0, fret: 7 },
      { midi: 48, string: 0, fret: 5 }, null, { midi: 45, string: 0, fret: 2 }, null, null, null, null, null,
    ],
  },
  {
    name: "Tapping Arpeggio (Am)",
    artist: "Modern Technique",
    category: 'Arpeggio',
    description: "A two-handed tapping exercise playing an A minor arpeggio across multiple octaves. Use your fretting hand for the low notes and tapping hand for high notes.",
    difficulty: 'Advanced',
    timeSignature: '4/4',
    originalKey: 'Am',
    transposable: true,
    sequence: [
      { midi: 33, string: 3, fret: 5 }, { midi: 40, string: 1, fret: 2 }, { midi: 45, string: 0, fret: 2 }, // Fretting hand
      { midi: 48, string: 0, fret: 5 }, // Fretting hand
      { midi: 52, string: 0, fret: 9 }, // Tapping hand
      { midi: 57, string: 0, fret: 14 }, // Tapping hand
      { midi: 52, string: 0, fret: 9 }, // Pull-off
      { midi: 45, string: 0, fret: 2 }, // Pull-off
    ],
  },
];

export const DRUM_PATTERNS: DrumPattern[] = [
  // Sequence order: [kick, snare, hi-hat, clap, tom]
  {
    name: "Rock Beat",
    sequence: [
      [1, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0],
      [1, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [0, 0, 1, 0, 1],
    ]
  },
  {
    name: "Funk Groove",
    sequence: [
      [1, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 1, 0, 1, 0], [1, 0, 1, 0, 0],
      [0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [1, 0, 0, 0, 0], [0, 0, 1, 0, 1],
    ]
  },
  {
    name: "Swing Beat",
    sequence: [
      [1, 0, 1, 0, 0], [0, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 1], [0, 0, 1, 0, 0], [1, 0, 1, 0, 0], [0, 0, 0, 0, 0],
    ]
  },
  {
    name: "Shuffle",
    sequence: [
      [1, 0, 1, 0, 0], [0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0],
      [1, 0, 1, 0, 0], [0, 0, 0, 0, 1], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0],
    ]
  },
  {
    name: "Disco",
    sequence: [
      [1, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 1, 0, 1, 0], [0, 0, 1, 0, 0],
      [1, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 1, 0, 1, 0], [0, 0, 1, 0, 0],
    ]
  },
  {
    name: "Hip-Hop",
    sequence: [
      [1, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0], [1, 0, 1, 0, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 1],
    ]
  },
  {
    name: "Metronome",
    sequence: [
      [0, 1, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0],
    ]
  }
];

export const KICK_SOUNDS: KickSound[] = ['Acoustic', '808', 'Rock', 'Thump'];
export const SNARE_SOUNDS: SnareSound[] = ['Acoustic', '808', 'Brush', 'Tight'];
export const HIHAT_SOUNDS: HiHatSound[] = ['Acoustic', '808', 'Bright'];
export const CLAP_SOUNDS: ClapSound[] = ['Acoustic', '808'];
export const TOM_SOUNDS: TomSound[] = ['Acoustic Low', 'Acoustic Mid', 'Acoustic High', 'Electro'];