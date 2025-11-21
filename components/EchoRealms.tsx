
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, MapIcon, HeartIcon, BookOpenIcon, SparklesIcon } from './icons';
import { generateStoryTurn, generateImage } from '../services/geminiService';

interface EchoRealmsProps {
    onNavigateBack: () => void;
}

type GameState = 'MENU' | 'PLAYING' | 'LOADING' | 'ERROR';

const WORLDS = [
    { id: 'cyberpunk', name: 'Neon City', desc: 'Alta tecnología, baja vida. Hackers y megacorporaciones.', color: 'text-cyan-400', bg: 'from-cyan-900 to-purple-900' },
    { id: 'fantasy', name: 'Eldoria', desc: 'Magia antigua, dragones y reinos olvidados.', color: 'text-amber-400', bg: 'from-amber-900 to-emerald-900' },
    { id: 'horror', name: 'Abyss', desc: 'Terror cósmico en el espacio profundo.', color: 'text-red-500', bg: 'from-gray-900 to-black' },
    { id: 'postapoc', name: 'Rustlands', desc: 'Sobrevive en un páramo nuclear.', color: 'text-orange-400', bg: 'from-orange-900 to-stone-900' }
];

const EchoRealms: React.FC<EchoRealmsProps> = ({ onNavigateBack }) => {
    const [gameState, setGameState] = useState<GameState>('MENU');
    const [selectedWorld, setSelectedWorld] = useState(WORLDS[0]);
    const [narrative, setNarrative] = useState('');
    const [choices, setChoices] = useState<string[]>([]);
    const [sceneImage, setSceneImage] = useState<string | null>(null);
    const [history, setHistory] = useState<{ role: string, text: string }[]>([]);
    
    // Init Game
    const startGame = async () => {
        setGameState('LOADING');
        setHistory([]);
        await processTurn("Inicia la historia. Despierto en una situación interesante.");
    };

    const processTurn = async (action: string) => {
        setGameState('LOADING');
        try {
            // 1. Generate Text & Choices
            const turnData = await generateStoryTurn(selectedWorld.id, history, action);
            
            setNarrative(turnData.narrative);
            setChoices(turnData.choices);
            
            // Update History
            const newHistory = [
                ...history,
                { role: 'user', text: action },
                { role: 'model', text: turnData.narrative }
            ];
            setHistory(newHistory.slice(-6)); // Keep last 6 turns for context

            // 2. Generate Image in background (visual update)
            // We trigger this but don't block the text display entirely if possible, 
            // but for simplicity in this version we await to show the full "scene".
            try {
                const image = await generateImage({ 
                    prompt: turnData.visualPrompt, 
                    modelName: 'sm-l3' // Use premium model for best results
                });
                setSceneImage(image.data);
            } catch (e) {
                console.error("Image gen failed", e);
                // Fallback or keep previous image
            }

            setGameState('PLAYING');

        } catch (e) {
            console.error(e);
            setGameState('ERROR');
        }
    };

    if (gameState === 'MENU') {
        return (
            <div className="relative w-full h-full bg-black text-white overflow-hidden font-sans">
                {/* Animated Background Mesh */}
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedWorld.bg} opacity-50 transition-colors duration-1000`}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                <div className="relative z-10 flex flex-col h-full p-8">
                    <button onClick={onNavigateBack} className="self-start p-2 hover:bg-white/10 rounded-full transition-colors mb-8">
                        <ChevronLeftIcon className="w-8 h-8" />
                    </button>

                    <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            ECHO REALMS
                        </h1>
                        <p className="text-xl text-gray-400 mb-12 max-w-lg">
                            Narrativa infinita generada por IA. Cada elección crea un nuevo universo visual y textual.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                            {WORLDS.map(world => (
                                <button
                                    key={world.id}
                                    onClick={() => setSelectedWorld(world)}
                                    className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${selectedWorld.id === world.id ? `border-white bg-white/10 scale-105 shadow-2xl` : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                                >
                                    <h3 className={`text-2xl font-bold mb-2 ${world.color}`}>{world.name}</h3>
                                    <p className="text-sm text-gray-300">{world.desc}</p>
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={startGame}
                            className="w-full md:w-auto px-12 py-6 bg-white text-black font-black text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] self-start flex items-center gap-4"
                        >
                            <SparklesIcon className="w-6 h-6" />
                            INICIAR VIAJE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black text-white overflow-hidden">
            {/* Immersive Background */}
            <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
                {sceneImage ? (
                    <>
                        <img src={sceneImage} alt="Scene" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                    </>
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${selectedWorld.bg}`}></div>
                )}
            </div>

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={() => setGameState('MENU')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeftIcon className="w-6 h-6" />
                    <span className="font-bold tracking-widest text-sm">SALIR</span>
                </button>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <HeartIcon className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold">100%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <MapIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold">{selectedWorld.name}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="absolute inset-x-0 bottom-0 top-20 z-10 flex flex-col justify-end p-6 md:p-12 lg:p-20 max-w-5xl mx-auto">
                
                {gameState === 'LOADING' ? (
                    <div className="flex flex-col items-center justify-center h-full animate-pulse">
                        <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin mb-8"></div>
                        <p className="text-2xl font-light tracking-widest uppercase text-center">Generando Realidad...</p>
                        <p className="text-sm text-gray-500 mt-2">Consultando al Oráculo SM-l3</p>
                    </div>
                ) : (
                    <div className="animate-fade-in-up">
                        {/* Story Text */}
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl mb-8 shadow-2xl">
                            <BookOpenIcon className="w-8 h-8 text-white/50 mb-4" />
                            <p className="text-xl md:text-2xl leading-relaxed font-medium text-gray-100 font-serif">
                                {narrative}
                            </p>
                        </div>

                        {/* Choices */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {choices.map((choice, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => processTurn(choice)}
                                    className="group relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/40 backdrop-blur-md rounded-xl text-left transition-all duration-200 hover:-translate-y-1"
                                >
                                    <span className="absolute top-4 right-4 text-xs font-bold text-white/20 group-hover:text-white/60">0{idx + 1}</span>
                                    <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                                        {choice}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};

export default EchoRealms;
