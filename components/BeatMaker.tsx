
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon } from './icons';
import { createKick, createSnare, createHiHat } from '../audio/audioUtils';

const initialGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0], // Hi-Hat
    [0, 0, 1, 0, 0, 0, 1, 0], // Snare
    [1, 0, 0, 0, 1, 0, 0, 0], // Kick
];

const instrumentNames = ['Hi-Hat', 'Snare', 'Kick'];

const BeatMaker: React.FC = () => {
    const [grid, setGrid] = useState(initialGrid);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tempo, setTempo] = useState(120);
    const [currentStep, setCurrentStep] = useState<number | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const schedulerTimerRef = useRef<number | null>(null);
    const nextNoteTimeRef = useRef(0.0);
    const stepRef = useRef(0);

    const toggleCell = (row: number, col: number) => {
        if(isPlaying) return;
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = newGrid[row][col] === 1 ? 0 : 1;
        setGrid(newGrid);
    };

    const scheduler = useCallback(() => {
        const ctx = audioContextRef.current!;
        const scheduleAheadTime = 0.1;

        while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
            const time = nextNoteTimeRef.current;
            
            // Schedule sounds
            if (grid[0][stepRef.current] === 1) createHiHat(ctx, time);
            if (grid[1][stepRef.current] === 1) createSnare(ctx, time);
            if (grid[2][stepRef.current] === 1) createKick(ctx, time);
            
            // Update UI
            const step = stepRef.current;
            setTimeout(() => setCurrentStep(step), (time - ctx.currentTime) * 1000);

            // Advance scheduler
            const secondsPerStep = (60.0 / tempo) / 2; // 8th notes
            nextNoteTimeRef.current += secondsPerStep;
            stepRef.current = (stepRef.current + 1) % 8;
        }
    }, [grid, tempo]);

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
    }, [tempo, grid, start, stop]);

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="w-full space-y-2">
                {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2">
                        <span className="w-16 text-sm text-right text-[var(--text-secondary)] font-semibold">{instrumentNames[rowIndex]}</span>
                        <div className="flex-1 grid grid-cols-8 gap-2">
                            {row.map((cell, colIndex) => (
                                <button
                                    key={colIndex}
                                    onClick={() => toggleCell(rowIndex, colIndex)}
                                    className={`aspect-square rounded-md transition-all duration-150
                                        ${cell === 1 ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)]'}
                                        ${currentStep === colIndex ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--text-accent)]' : ''}
                                    `}
                                    aria-label={`Toggle ${instrumentNames[rowIndex]} at step ${colIndex + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
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
