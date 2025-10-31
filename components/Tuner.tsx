import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PlayIcon, StopIcon } from './icons';

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const RMS_THRESHOLD = 0.015; // Increased slightly for less sensitivity to noise
const SMOOTHING_FACTOR = 0.15; // Value between 0 and 1. Lower is smoother.
const NOTE_CONFIDENCE_THRESHOLD = 3; // Require 3 consecutive frames of the same note.
const IN_TUNE_CENTS_THRESHOLD = 5; // Within +/- 5 cents is considered "in tune"

const freqToNote = (freq: number): { note: string, cents: number } => {
    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
    const roundedNoteNum = Math.round(noteNum) + 69;
    const noteName = noteStrings[roundedNoteNum % 12];
    
    const expectedFreq = 440 * Math.pow(2, (roundedNoteNum - 69) / 12);
    const cents = 1200 * Math.log2(freq / expectedFreq);

    return { note: noteName, cents: cents };
};

const Tuner: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [noteName, setNoteName] = useState('--');
    const [cents, setCents] = useState(0);
    const [freq, setFreq] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const bufferRef = useRef<Float32Array | null>(null);

    // New refs for smoothing and stability
    const smoothedCentsRef = useRef(0);
    const lastNoteNameRef = useRef<string | null>(null);
    const noteConfidenceRef = useRef(0);

    const updatePitch = useCallback(() => {
        if (!analyserRef.current || !bufferRef.current || !audioContextRef.current) return;
        
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const buffer = bufferRef.current;
        const sampleRate = audioContextRef.current.sampleRate;
        
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / buffer.length);

        if (rms < RMS_THRESHOLD) { // not enough signal
             setNoteName('--');
             setFreq(0);
             // Gently return needle to center
             smoothedCentsRef.current = SMOOTHING_FACTOR * 0 + (1 - SMOOTHING_FACTOR) * smoothedCentsRef.current;
             setCents(smoothedCentsRef.current);
             noteConfidenceRef.current = 0; // reset confidence
             animationFrameRef.current = requestAnimationFrame(updatePitch);
             return;
        }

        // Autocorrelation algorithm to find fundamental frequency
        let SIZE = buffer.length;
        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++)
            if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < SIZE / 2; i++)
            if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }

        const bufferSlice = buffer.slice(r1, r2);
        SIZE = bufferSlice.length;

        const c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++)
            for (let j = 0; j < SIZE - i; j++)
                c[i] = c[i] + bufferSlice[j] * bufferSlice[j + i];
        
        let d = 0;
        while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        
        let fundamentalFreq = 0;
        if (maxpos > 0) {
            fundamentalFreq = sampleRate / maxpos;
        }
        
        if (fundamentalFreq > 20 && fundamentalFreq < 1000) { // Reasonable bass guitar range
            const { note, cents: rawCents } = freqToNote(fundamentalFreq);

            if (note === lastNoteNameRef.current) {
                noteConfidenceRef.current++;
            } else {
                lastNoteNameRef.current = note;
                noteConfidenceRef.current = 0;
            }

            if (noteConfidenceRef.current >= NOTE_CONFIDENCE_THRESHOLD) {
                setNoteName(note);
                setFreq(fundamentalFreq);
            }
            
            // Cents smoothing (EMA)
            smoothedCentsRef.current = SMOOTHING_FACTOR * rawCents + (1 - SMOOTHING_FACTOR) * smoothedCentsRef.current;
            setCents(smoothedCentsRef.current);

        } else {
             setNoteName('--');
             setFreq(0);
             smoothedCentsRef.current = SMOOTHING_FACTOR * 0 + (1 - SMOOTHING_FACTOR) * smoothedCentsRef.current;
             setCents(smoothedCentsRef.current);
             noteConfidenceRef.current = 0;
        }

        animationFrameRef.current = requestAnimationFrame(updatePitch);
    }, []);
    
    const startTuning = async () => {
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            bufferRef.current = new Float32Array(analyserRef.current.fftSize);
            sourceNodeRef.current.connect(analyserRef.current);
            setIsListening(true);
            updatePitch();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert("Could not access microphone. Please allow microphone access in your browser settings.");
        }
    };

    const stopTuning = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        setIsListening(false);
        setNoteName('--');
        setFreq(0);
        setCents(0);
        smoothedCentsRef.current = 0;
        lastNoteNameRef.current = null;
        noteConfidenceRef.current = 0;
    }, []);

    useEffect(() => {
        return () => stopTuning(); // Cleanup on unmount
    }, [stopTuning]);

    const handleToggleListening = () => {
        if (isListening) {
            stopTuning();
        } else {
            startTuning();
        }
    };

    const centsClamped = Math.max(-50, Math.min(50, cents));
    const needleRotation = (centsClamped / 50) * 60; // Max 60 degrees either way
    const isInTune = Math.abs(cents) < IN_TUNE_CENTS_THRESHOLD;

    const noteNameColor = isInTune ? 'text-green-400' : 'text-[var(--text-accent)]';
    const meterIndicatorColor = isInTune ? 'bg-green-400' : 'bg-[var(--color-advanced)]';
    
    return (
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
             <div className="relative w-full max-w-xs h-32 flex items-center justify-center">
                {/* Background arc */}
                <div className="absolute w-56 h-28 border-[12px] border-solid border-[var(--bg-tertiary)] rounded-t-full border-b-0 top-0"></div>
                {/* "In Tune" green zone */}
                <div className="absolute w-56 h-28 border-[12px] border-solid border-green-400/20 rounded-t-full border-b-0 top-0" style={{ clipPath: 'polygon(45% 0, 55% 0, 55% 100%, 45% 100%)' }}></div>
                
                {/* Center tick mark */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[var(--text-secondary)]"></div>
                
                {/* Needle */}
                <div 
                    className={`absolute bottom-[52px] w-0.5 h-24 origin-bottom transition-transform duration-150 ease-linear ${meterIndicatorColor}`}
                    style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
                >
                    <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-inherit"></div>
                </div>

                {/* Pivot point */}
                <div className="absolute bottom-[44px] left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--bg-secondary)] rounded-full border-2 border-[var(--border-primary)] z-10"></div>

                {/* Cents text */}
                <div className="absolute -bottom-2 text-sm text-[var(--text-secondary)]">
                    {noteName !== '--' ? `${cents.toFixed(1)} cents` : ''}
                </div>
            </div>
            <div className="text-center -mt-4">
                <p className={`text-7xl font-bold font-roboto-mono transition-colors ${noteNameColor}`}>{noteName}</p>
                <p className="text-lg text-[var(--text-secondary)]">{freq > 0 ? `${freq.toFixed(1)} Hz` : '...'}</p>
            </div>
            <button
                onClick={handleToggleListening}
                className="flex items-center justify-center gap-2 w-48 bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] hover:from-[var(--accent-gradient-start)]/90 hover:to-[var(--accent-gradient-end)]/90 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
                {isListening ? <><StopIcon /> Stop Tuning</> : <><PlayIcon /> Start Tuning</>}
            </button>
        </div>
    );
};

export default Tuner;