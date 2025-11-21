
import React, { useState } from 'react';
import { ChevronLeftIcon, FilmIcon, ClockIcon, CameraIcon, SparklesIcon } from './icons';
import { generateTimeTravelData, generateImage } from '../services/geminiService';

interface ChronoLenseProps {
    onNavigateBack: () => void;
}

const ChronoLense: React.FC<ChronoLenseProps> = ({ onNavigateBack }) => {
    const [year, setYear] = useState<number>(2024);
    const [location, setLocation] = useState<string>('New York City');
    const [isCapturing, setIsCapturing] = useState(false);
    const [result, setResult] = useState<{ image: string, headline: string, desc: string } | null>(null);

    const handleCapture = async () => {
        setIsCapturing(true);
        setResult(null);
        
        try {
            // 1. Get Data
            const data = await generateTimeTravelData(year, location);
            
            // 2. Get Image
            const image = await generateImage({ 
                prompt: data.visualPrompt, 
                modelName: 'sm-l3' // Premium for best style adaptation
            });

            setResult({
                image: image.data,
                headline: data.headline,
                desc: data.description
            });

        } catch (e) {
            console.error(e);
            // Simple error handling for demo
            alert("Interferencia temporal detectada. Intenta de nuevo.");
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className="relative h-full w-full bg-black overflow-hidden flex flex-col font-sans text-white">
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20">
                <button onClick={onNavigateBack} className="p-2 rounded-full bg-black/20 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-colors">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                    <FilmIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold tracking-widest uppercase">ChronoLense v1.0</span>
                </div>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 relative flex items-center justify-center">
                
                {/* Portal Effect */}
                {!result && (
                    <div className={`absolute inset-0 flex items-center justify-center ${isCapturing ? 'animate-pulse' : ''}`}>
                        <div className="w-[500px] h-[500px] rounded-full border border-white/20 relative animate-spin-slow">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-cyan-500/50"></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-cyan-500/50"></div>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-1 bg-cyan-500/50"></div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-1 bg-cyan-500/50"></div>
                        </div>
                        <div className="w-[300px] h-[300px] rounded-full border border-dashed border-white/10 absolute animate-reverse-spin"></div>
                        
                        {isCapturing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                <div className="text-cyan-400 font-mono text-lg animate-bounce">CALIBRANDO FLUJO TEMPORAL...</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Result Display */}
                {result && (
                    <div className="relative z-10 w-full max-w-4xl h-[70vh] bg-black rounded-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border-8 border-white p-4 transform rotate-1 transition-all duration-500 hover:rotate-0 hover:scale-105">
                        <img src={result.image} alt="Time Travel Result" className="w-full h-full object-cover grayscale-[0.2] contrast-125" />
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-8 pt-24">
                            <div className="font-mono text-xs text-cyan-400 mb-1 tracking-widest uppercase">
                                {location} // {year}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-2 text-white">
                                "{result.headline}"
                            </h2>
                            <p className="text-white/80 font-serif italic max-w-2xl">
                                {result.desc}
                            </p>
                        </div>
                    </div>
                )}

            </div>

            {/* Controls */}
            <div className="bg-[#111] border-t border-white/10 p-6 z-20">
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-center">
                    
                    <div className="flex-1 w-full space-y-2">
                        <label className="flex justify-between text-xs font-bold text-white/50 uppercase">
                            <span>Año Objetivo</span>
                            <span className="text-cyan-400">{year}</span>
                        </label>
                        <input 
                            type="range" 
                            min="1000" 
                            max="3000" 
                            value={year} 
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-[10px] text-white/30 font-mono">
                            <span>1000 AD</span>
                            <span>3000 AD</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Ingresa ubicación (ej. Paris)"
                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                        />
                    </div>

                    <button 
                        onClick={handleCapture}
                        disabled={isCapturing}
                        className="w-16 h-16 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-110 disabled:opacity-50 disabled:scale-100 flex-shrink-0"
                    >
                        {isCapturing ? <ClockIcon className="w-6 h-6 animate-spin" /> : <CameraIcon className="w-6 h-6" />}
                    </button>

                </div>
            </div>

            <style>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                .animate-spin-slow { animation: spin-slow 20s linear infinite; }
                .animate-reverse-spin { animation: reverse-spin 15s linear infinite; }
            `}</style>
        </div>
    );
};

export default ChronoLense;
