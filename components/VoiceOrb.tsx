




import React, { useEffect, useRef } from 'react';
import { XMarkIcon, MicrophoneIcon, SparklesIcon, SpeakerWaveIcon } from './icons';

interface VoiceOrbProps {
    isActive: boolean;
    state: 'LISTENING' | 'RESPONDING' | 'THINKING';
    volume: number;
    onClose: () => void;
    onCloseExplanation?: () => void;
    transcription: string;
    mode: 'default' | 'explaining';
    explanationData?: {
        topic: string;
        points: {title: string, description: string}[];
    } | null;
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({ isActive, state, volume, onClose, onCloseExplanation, transcription, mode, explanationData }) => {
    const orbRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!orbRef.current || !glowRef.current) return;

        // Base scale based on volume
        const baseScale = 1 + (volume * 0.5); 
        
        let scale = baseScale;
        let color = '';
        let glowColor = '';
        let borderColor = '';

        switch (state) {
            case 'LISTENING':
                color = 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';
                glowColor = 'rgba(0, 114, 255, 0.5)';
                borderColor = 'rgba(255, 255, 255, 0.3)';
                break;
            case 'THINKING':
                color = 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)';
                glowColor = 'rgba(161, 140, 209, 0.6)';
                borderColor = 'rgba(255, 255, 255, 0.5)';
                scale = 1.1;
                break;
            case 'RESPONDING':
                color = 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)';
                glowColor = 'rgba(102, 166, 255, 0.6)';
                borderColor = 'rgba(255, 255, 255, 0.4)';
                break;
        }

        orbRef.current.style.transform = `scale(${scale})`;
        orbRef.current.style.background = color;
        orbRef.current.style.borderColor = borderColor;
        glowRef.current.style.boxShadow = `0 0 ${20 + (volume * 50)}px ${glowColor}`;

    }, [volume, state]);

    if (!isActive) return null;

    const isExplaining = mode === 'explaining';

    return (
        <div 
            className={`fixed z-[100] flex flex-col items-center justify-center transition-all duration-700 ease-in-out pointer-events-none`}
            style={{
                inset: isExplaining ? '0 0 0 0' : 'auto 24px 24px auto',
                width: isExplaining ? '100%' : 'auto',
                height: isExplaining ? '100%' : 'auto',
                backgroundColor: isExplaining ? 'rgba(10, 10, 12, 0.9)' : 'transparent',
                backdropFilter: isExplaining ? 'blur(20px)' : 'none',
            }}
        >
            
            {/* Standard Transcription Bubble (Only when NOT explaining) */}
            {!isExplaining && (transcription || state === 'THINKING') && (
                <div className="absolute bottom-24 right-0 mb-2 pointer-events-auto max-w-xs md:max-w-sm bg-surface-primary/90 backdrop-blur-md border border-border-subtle shadow-xl rounded-2xl rounded-br-sm p-4 animate-slide-up origin-bottom-right">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                        {state === 'LISTENING' && <><MicrophoneIcon className="w-3 h-3 animate-pulse" /> Escuchando...</>}
                        {state === 'THINKING' && <><SparklesIcon className="w-3 h-3 animate-spin" /> Pensando...</>}
                        {state === 'RESPONDING' && <><SpeakerWaveIcon className="w-3 h-3" /> SAM</>}
                    </div>
                    <p className="text-text-main text-sm leading-relaxed font-medium">
                         {transcription || (state === 'THINKING' ? "Procesando..." : "...")}
                    </p>
                </div>
            )}

            {/* Holographic Dashboard Mode - Rich Data with Descriptions */}
            {isExplaining && explanationData && (
                <div className="absolute inset-0 flex flex-col items-center pointer-events-auto pt-[32vh] px-6 pb-24 overflow-y-auto custom-scrollbar-thin">
                    
                    {/* Topic Title */}
                    <div className="mb-8 text-center animate-fade-in-up w-full max-w-3xl">
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {explanationData.topic}
                        </h1>
                        <div className="h-1 w-24 bg-accent mx-auto rounded-full shadow-[0_0_10px_rgba(var(--color-accent),0.8)]"></div>
                    </div>

                    {/* Rich Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl animate-fade-in-up delay-100">
                        {explanationData.points.map((point, index) => (
                            <div 
                                key={index} 
                                className="bg-[#1E1E1E]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg hover:bg-[#252525] hover:border-accent/30 transition-all duration-300 flex items-start gap-4 group hover:transform hover:-translate-y-1"
                                style={{ animationDelay: `${index * 150 + 200}ms` }}
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold border border-accent/30 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(var(--color-accent),0.2)] mt-1">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
                                        {point.title}
                                    </h3>
                                    <p className="text-white/70 text-sm leading-relaxed font-medium">
                                        {point.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                     {/* Exit View Button */}
                     <div className="fixed bottom-8 animate-fade-in-up delay-100 z-50">
                        <button 
                            onClick={onCloseExplanation}
                            className="px-6 py-3 bg-surface-secondary/50 backdrop-blur-md border border-white/10 rounded-full text-white font-semibold hover:bg-white/10 transition-colors flex items-center gap-2 shadow-xl"
                        >
                            <XMarkIcon className="w-5 h-5" />
                            Cerrar Vista
                        </button>
                    </div>

                </div>
            )}

            {/* Orb Container */}
            <div className={`relative w-24 h-24 flex items-center justify-center pointer-events-auto group z-50 transition-all duration-700 ${isExplaining ? '-translate-y-[35vh]' : ''}`}>
                
                {/* Close Button (Full Session) */}
                {!isExplaining && (
                    <button 
                        onClick={onClose}
                        className="absolute -top-4 -right-4 bg-surface-secondary text-text-secondary hover:bg-danger hover:text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 transform scale-90 group-hover:scale-100 border border-border-subtle"
                        title="Cerrar sesión de voz"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                )}

                {/* Outer Rings */}
                <div className={`absolute inset-0 rounded-full border-2 border-dashed border-accent/50 scale-125 ${state === 'THINKING' || isExplaining ? 'animate-spin-slow' : 'opacity-0'}`}></div>
                <div className={`absolute inset-0 rounded-full border border-accent/20 scale-150 ${isExplaining ? 'opacity-100' : 'opacity-0'}`}></div>

                {/* Glow Layer */}
                <div 
                    ref={glowRef}
                    className="absolute inset-0 rounded-full transition-all duration-100 ease-out"
                />

                {/* Core Orb */}
                <div 
                    ref={orbRef}
                    className={`w-20 h-20 rounded-full relative z-20 shadow-2xl border-2 transition-all duration-75 ease-out flex items-center justify-center overflow-hidden cursor-pointer ${state === 'THINKING' ? 'animate-pulse-fast' : ''}`}
                    onClick={isExplaining ? undefined : onClose}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-40 rounded-full"></div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up { 
                    from { opacity: 0; transform: translateY(30px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                
                @keyframes slide-up { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .animate-slide-up { animation: slide-up 0.2s ease-out forwards; }

                @keyframes spin-slow { from { transform: scale(1.25) rotate(0deg); } to { transform: scale(1.25) rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }

                @keyframes pulse-fast { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
                .animate-pulse-fast { animation: pulse-fast 1.5s ease-in-out infinite; }

                .delay-100 { animation-delay: 0.1s; }
                
                .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-thin::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); border-radius: 20px; }
                .custom-scrollbar-thin:hover::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.3); }
            `}</style>
        </div>
    );
};

export default VoiceOrb;