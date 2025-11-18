
import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, XMarkIcon, SparklesIcon } from './icons';

interface VoiceOrbProps {
    isActive: boolean;
    state: 'LISTENING' | 'RESPONDING' | 'THINKING';
    volume: number; // 0 to 1
    onClose: () => void;
    transcription: string;
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({ isActive, state, volume, onClose, transcription }) => {
    const [position, setPosition] = useState({ x: window.innerWidth - 180, y: window.innerHeight - 180 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isActive) return null;

    let glowColor = 'rgba(88, 86, 214, 0.5)'; // Accent default
    let coreColor = '#5856D6';
    
    if (state === 'RESPONDING') {
        glowColor = 'rgba(59, 130, 246, 0.6)'; // Blue speaking
        coreColor = '#3B82F6';
    } else if (state === 'THINKING') {
         glowColor = 'rgba(255, 255, 255, 0.5)'; // White thinking
         coreColor = '#FFFFFF';
    }

    // Stranger Things override
    if (document.body.classList.contains('stranger-things-theme')) {
        glowColor = 'rgba(229, 9, 20, 0.6)';
        coreColor = '#E50914';
    }

    const scale = 1 + (volume * 0.5);

    return (
        <div 
            className="fixed z-[100] cursor-move select-none flex flex-col items-end pointer-events-auto"
            style={{ left: position.x, top: position.y }}
            onMouseDown={(e) => {
                setIsDragging(true);
                dragOffset.current = {
                    x: e.clientX - position.x,
                    y: e.clientY - position.y
                };
            }}
        >
            {/* Transcription Bubble */}
            {transcription && (
                <div className="mb-2 mr-2 bg-black/60 backdrop-blur-md text-white text-sm px-3 py-2 rounded-xl max-w-[200px] animate-fade-in border border-white/10">
                    {transcription}
                </div>
            )}

            <div className="relative group">
                {/* Close Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute -top-2 -right-2 bg-surface-secondary text-text-secondary rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:text-danger hover:bg-danger/10"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>

                {/* The Orb */}
                <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-100 backdrop-blur-sm border border-white/10"
                    style={{
                        backgroundColor: 'rgba(30, 30, 30, 0.8)',
                        boxShadow: `0 0 ${20 * scale}px ${glowColor}, inset 0 0 10px ${glowColor}`
                    }}
                >
                    <div 
                        className="w-8 h-8 rounded-full transition-all duration-75"
                        style={{
                            backgroundColor: coreColor,
                            transform: `scale(${state === 'LISTENING' ? Math.max(1, scale) : 1})`,
                            opacity: state === 'LISTENING' ? 0.8 : 1
                        }}
                    >
                        {state === 'THINKING' && <SparklesIcon className="w-full h-full text-bg-main animate-spin" />}
                    </div>
                    
                    {/* Ripple Effect */}
                    {state === 'RESPONDING' && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-white/30 animate-ping opacity-20"></div>
                            <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
                        </>
                    )}
                </div>
                
                <div className="absolute -bottom-6 left-0 w-full text-center">
                     <span className="text-xs font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm uppercase tracking-wider">
                        {state === 'LISTENING' ? 'Escuchando' : state === 'THINKING' ? 'Procesando' : 'Hablando'}
                     </span>
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default VoiceOrb;
