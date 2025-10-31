
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PlayIcon, StopIcon } from './icons';

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

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

    const updatePitch = useCallback(() => {
        if (!analyserRef.current || !bufferRef.current) return;
        
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const buffer = bufferRef.current;
        const sampleRate = audioContextRef.current!.sampleRate;
        
        // Autocorrelation algorithm to find fundamental frequency
        let SIZE = buffer.length;
        let rms = 0;
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) { // not enough signal
             setNoteName('--');
             setFreq(0);
             setCents(0);
             animationFrameRef.current = requestAnimationFrame(updatePitch);
             return;
        }

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
        
        if (maxpos > 0) {
            const T0 = maxpos;
            const freq = sampleRate / T0;
            if (freq > 20 && freq < 1000) { // Reasonable bass guitar range
                const { note, cents } = freqToNote(freq);
                setNoteName(note);
                setCents(cents);
                setFreq(freq);
            }
        } else {
             setNoteName('--');
             setFreq(0);
             setCents(0);
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
    const needleRotation = (centsClamped / 50) * 45; // Max 45 degrees either way
    
    return (
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <div className="relative w-full max-w-xs h-24">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[var(--text-secondary)]"></div>
                <div 
                    className="absolute bottom-4 left-1/2 w-0.5 h-20 bg-[var(--color-advanced)] origin-bottom transition-transform duration-150 ease-linear"
                    style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
                ></div>
                <div className="absolute -bottom-2 left-0 right-0 flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>-50</span>
                    <span>Flat</span>
                    <span>Sharp</span>
                    <span>+50</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-7xl font-bold font-roboto-mono text-[var(--text-accent)]">{noteName}</p>
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
