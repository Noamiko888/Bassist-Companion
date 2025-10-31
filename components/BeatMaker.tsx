import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon } from './icons';
import { createKick, createSnare, createHiHat, createClap, createTom } from '../audio/audioUtils';
import { KickSound, SnareSound, HiHatSound, ClapSound, TomSound } from '../types';
import { DRUM_PATTERNS, KICK_SOUNDS, SNARE_SOUNDS, HIHAT_SOUNDS, CLAP_SOUNDS, TOM_SOUNDS } from '../constants';

const initialGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0], // Hi-Hat
    [0, 0, 0, 0, 0, 0, 0, 0], // Clap
    [0, 0, 1, 0, 0, 0, 1, 0], // Snare
    [0, 0, 0, 0, 0, 0, 0, 0], // Tom
    [1, 0, 0, 0, 1, 0, 0, 0], // Kick
];

const instrumentNames = ['Hi-Hat', 'Clap', 'Snare', 'Tom', 'Kick'];

const BeatMaker: React.FC = () => {
    const [grid, setGrid] = useState(initialGrid);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tempo, setTempo] = useState(120);
    const [currentStep, setCurrentStep] = useState<number | null>(null);

    // Individual drum sound states
    const [kickSound, setKickSound] = useState<KickSound>('Acoustic');
    const [snareSound, setSnareSound] = useState<SnareSound>('Acoustic');
    const [hiHatSound, setHiHatSound] = useState<HiHatSound>('Acoustic');
    const [clapSound, setClapSound] = useState<ClapSound>('Acoustic');
    const [tomSound, setTomSound] = useState<TomSound>('Acoustic Mid');
    const [volumes, setVolumes] = useState([0.7, 0.7, 0.8, 0.6, 1.0]); // Hi-Hat, Clap, Snare, Tom, Kick

    const audioContextRef = useRef<AudioContext | null>(null);
    const schedulerTimerRef = useRef<number | null>(null);
    const nextNoteTimeRef = useRef(0.0);
    const stepRef = useRef(0);

    const gridRef = useRef(grid);
    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    const playDrumSound = useCallback((instrumentIndex: number) => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        
        const time = ctx.currentTime;
        const volume = volumes[instrumentIndex];

        switch (instrumentIndex) {
            case 0: createHiHat(ctx, time, hiHatSound, volume); break;
            case 1: createClap(ctx, time, clapSound, volume); break;
            case 2: createSnare(ctx, time, snareSound, volume); break;
            case 3: createTom(ctx, time, tomSound, volume); break;
            case 4: createKick(ctx, time, kickSound, volume); break;
            default: break;
        }
    }, [volumes, kickSound, snareSound, hiHatSound, clapSound, tomSound]);

    const soundControls = [
      { sound: hiHatSound, setSound: setHiHatSound, options: HIHAT_SOUNDS },
      { sound: clapSound, setSound: setClapSound, options: CLAP_SOUNDS },
      { sound: snareSound, setSound: setSnareSound, options: SNARE_SOUNDS },
      { sound: tomSound, setSound: setTomSound, options: TOM_SOUNDS },
      { sound: kickSound, setSound: setKickSound, options: KICK_SOUNDS },
    ];

    const toggleCell = (row: number, col: number) => {
        setGrid(currentGrid => {
            const newGrid = currentGrid.map(r => [...r]);
            newGrid[row][col] = newGrid[row][col] === 1 ? 0 : 1;
            return newGrid;
        });
    };
    
    const handleVolumeChange = (rowIndex: number, newVolume: number) => {
        setVolumes(currentVolumes => {
            const newVolumes = [...currentVolumes];
            newVolumes[rowIndex] = newVolume;
            return newVolumes;
        });
    };

    const handlePatternChange = (patternName: string) => {
        if (patternName === "") {
            setGrid(initialGrid.map(row => row.map(() => 0))); // Clear grid
            return;
        }
        const pattern = DRUM_PATTERNS.find(p => p.name === patternName);
        if (!pattern) return;
        
        const newGrid = initialGrid.map(r => [...r].fill(0));
        
        for (let i = 0; i < 8; i++) {
            const step = pattern.sequence[i] || [0,0,0,0,0];
            // Pattern order: [kick, snare, hi-hat, clap, tom]
            // Grid order: [Hi-Hat, Clap, Snare, Tom, Kick]
            newGrid[4][i] = step[0]; // Kick
            newGrid[2][i] = step[1]; // Snare
            newGrid[0][i] = step[2]; // Hi-hat
            newGrid[1][i] = step[3]; // Clap
            newGrid[3][i] = step[4]; // Tom
        }
        setGrid(newGrid);
    };

    const scheduler = useCallback(() => {
        const ctx = audioContextRef.current!;
        const scheduleAheadTime = 0.1;
        const currentGrid = gridRef.current; 

        while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
            const time = nextNoteTimeRef.current;
            
            // Grid order: [Hi-Hat, Clap, Snare, Tom, Kick]
            if (currentGrid[0][stepRef.current] === 1) createHiHat(ctx, time, hiHatSound, volumes[0]);
            if (currentGrid[1][stepRef.current] === 1) createClap(ctx, time, clapSound, volumes[1]);
            if (currentGrid[2][stepRef.current] === 1) createSnare(ctx, time, snareSound, volumes[2]);
            if (currentGrid[3][stepRef.current] === 1) createTom(ctx, time, tomSound, volumes[3]);
            if (currentGrid[4][stepRef.current] === 1) createKick(ctx, time, kickSound, volumes[4]);
            
            const step = stepRef.current;
            setTimeout(() => setCurrentStep(step), (time - ctx.currentTime) * 1000);

            const secondsPerStep = (60.0 / tempo) / 2; // 8th notes
            nextNoteTimeRef.current += secondsPerStep;
            stepRef.current = (stepRef.current + 1) % 8;
        }
    }, [tempo, volumes, kickSound, snareSound, hiHatSound, clapSound, tomSound]);

    const start = useCallback(() => {
        if (!audioContextRef.current) {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        stepRef.current = 0;
        nextNoteTimeRef.current = ctx.currentTime + 0.1;
        scheduler();
        schedulerTimerRef.current = window.setInterval(scheduler, 25);
    }, [scheduler]);

    const stop = useCallback(() => {
        if (schedulerTimerRef.current) {
            clearInterval(schedulerTimerRef.current);
            schedulerTimerRef.current = null;
        }
        setCurrentStep(null);
    }, []);

    useEffect(() => {
        if (isPlaying) {
            start();
        } else {
            stop();
        }
        return () => stop();
    }, [isPlaying, start, stop]);
    
    useEffect(() => {
        if (isPlaying) {
            stop();
            start();
        }
    }, [tempo, volumes, kickSound, snareSound, hiHatSound, clapSound, tomSound, start, stop]);

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="w-full">
                <select
                    onChange={(e) => handlePatternChange(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] py-2 px-3 rounded-md border border-[var(--border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                >
                    <option value="">Load Preset...</option>
                    {DRUM_PATTERNS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
            </div>
            <div className="w-full space-y-2">
                {grid.map((row, rowIndex) => {
                    const { sound, setSound, options } = soundControls[rowIndex];
                    return (
                        <div key={rowIndex} className="flex items-center gap-4 p-2 rounded-lg bg-[var(--bg-tertiary)]/50">
                            <div className="w-32 flex-shrink-0 space-y-2">
                                <button
                                    onClick={() => playDrumSound(rowIndex)}
                                    className="font-bold text-lg text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors w-full text-left"
                                    aria-label={`Preview ${instrumentNames[rowIndex]} sound`}
                                >
                                    {instrumentNames[rowIndex]}
                                </button>
                                <select
                                    value={sound}
                                    onChange={e => setSound(e.target.value as any)}
                                    className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm p-1 rounded border border-[var(--border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {(options as readonly string[]).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <input
                                    type="range"
                                    min="0"
                                    max="1.2"
                                    step="0.05"
                                    value={volumes[rowIndex]}
                                    onChange={(e) => handleVolumeChange(rowIndex, Number(e.target.value))}
                                    className="w-full"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`${instrumentNames[rowIndex]} volume`}
                                />
                            </div>

                            <div className="flex-1 grid grid-cols-8 gap-2">
                                {row.map((cell, colIndex) => (
                                    <button
                                        key={colIndex}
                                        onClick={() => toggleCell(rowIndex, colIndex)}
                                        className={`aspect-square rounded-md transition-all duration-150 cursor-pointer
                                            ${cell === 1 ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)]'}
                                            ${currentStep === colIndex ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--text-accent)]' : ''}
                                        `}
                                        aria-label={`Toggle ${instrumentNames[rowIndex]} at step ${colIndex + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between w-full pt-2">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center justify-center gap-2 w-28 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                 <div className="flex items-center gap-2">
                    <span className="font-roboto-mono text-lg">{tempo} BPM</span>
                    <input
                        type="range"
                        min="60"
                        max="180"
                        value={tempo}
                        onChange={(e) => setTempo(Number(e.target.value))}
                        className="w-32"
                    />
                </div>
            </div>
        </div>
    );
};

export default BeatMaker;