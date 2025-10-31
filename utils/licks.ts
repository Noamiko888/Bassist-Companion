import { Lick, Note, TimeSignature } from '../types';

export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const KEY_MIDI_MAP: { [key: string]: number } = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

// Simplified map for minor keys relative to their major equivalent root
const MINOR_KEY_MIDI_MAP: { [key: string]: number } = {
    'Am': 9, 'A#m': 10, 'Bbm': 10, 'Bm': 11, 'Cm': 0, 'C#m': 1, 'Dm': 2,
    'D#m': 3, 'Ebm': 3, 'Em': 4, 'Fm': 5, 'F#m': 6, 'Gm': 7, 'G#m': 8,
};

const getRootMidi = (key: string): number | null => {
    if (key.endsWith('m')) {
        return MINOR_KEY_MIDI_MAP[key] ?? null;
    }
    return KEY_MIDI_MAP[key] ?? null;
}

export const transposeLick = (lick: Lick, targetKey: string): Lick => {
    if (!lick.transposable) return lick;

    const originalRootMidi = getRootMidi(lick.originalKey);
    const targetRootMidi = getRootMidi(targetKey);

    if (originalRootMidi === null || targetRootMidi === null) {
        console.error("Invalid key for transposition", lick.originalKey, targetKey);
        return lick;
    }

    const semitoneShift = targetRootMidi - originalRootMidi;
    if (semitoneShift === 0) return lick;

    const newSequence = lick.sequence.map(note => {
        if (!note) return null;
        const newMidi = note.midi + semitoneShift;
        const newFret = note.fret + semitoneShift;
        // Basic check to prevent unplayable frets (e.g., negative)
        if (newFret < 0 || newFret > 24) {
            // A more advanced implementation could shift notes to other strings.
            // For now, we'll just return the original lick if transposition is unplayable.
            // This is a simplistic safeguard.
            console.warn(`Transposition for note ${note.midi} to key ${targetKey} results in unplayable fret ${newFret}.`);
            return note; // returning original note in this case
        }
        return { ...note, midi: newMidi, fret: newFret };
    });

    const newName = lick.name.replace(/\([A-Ga-g#bm]+\)/, `(${targetKey})`);

    return {
        ...lick,
        name: newName,
        sequence: newSequence,
    };
};

export const generateTablature = (sequence: (Note | null)[], timeSignature: TimeSignature): string => {
    if (!sequence || sequence.length === 0) return '';
    
    const is16th = sequence.length > 8 && sequence.length > (timeSignature === '4/4' ? 8 : 6);
    const stepsPerBar = is16th ? 16 : 8;

    const bars: (Note | null)[][] = [];
    for (let i = 0; i < sequence.length; i += stepsPerBar) {
        bars.push(sequence.slice(i, i + stepsPerBar));
    }

    const fullTabLines = bars.map(bar => {
        const stepColumns: { G: string, D: string, A: string, E: string }[] = [];
        for (let i = 0; i < bar.length; i++) {
            const note = bar[i];
            let column = { G: '-', D: '-', A: '-', E: '-' };
            if (note) {
                if (note.string === 0) column.G = String(note.fret);
                if (note.string === 1) column.D = String(note.fret);
                if (note.string === 2) column.A = String(note.fret);
                if (note.string === 3) column.E = String(note.fret);
            }
            stepColumns.push(column);
        }

        const paddings = stepColumns.map(col => 
            Math.max(col.G.length, col.D.length, col.A.length, col.E.length, 1)
        );

        let G = 'G|';
        let D = 'D|';
        let A = 'A|';
        let E = 'E|';

        stepColumns.forEach((col, i) => {
            const pad = paddings[i];
            G += col.G.padEnd(pad, '-');
            D += col.D.padEnd(pad, '-');
            A += col.A.padEnd(pad, '-');
            E += col.E.padEnd(pad, '-');
        });

        return [G + '|', D + '|', A + '|', E + '|'].join('\n');
    });

    return fullTabLines.join('\n\n');
};
