
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { XMarkIcon, SparklesIcon } from './icons';

export interface VoiceOrbHandle {
    clickElement: (selectorId: string) => Promise<void>;
    pointAtElement: (selectorId: string) => Promise<void>;
    resetPosition: () => void;
}

interface VoiceOrbProps {
    isActive: boolean;
    state: 'LISTENING' | 'RESPONDING' | 'THINKING';
    volume: number; // 0 to 1
    onClose: () => void;
    transcription: string;
}

const VoiceOrb = forwardRef<VoiceOrbHandle, VoiceOrbProps>(({ isActive, state, volume, onClose, transcription }, ref) => {
    const orbRef = useRef<HTMLDivElement>(null);
    // We keep track of position in a ref, not state, to avoid re-renders interrupting animation
    const currentPos = useRef({ x: window.innerWidth - 100, y: window.innerHeight - 150 });
    const isDragging = useRef(false);
    const isAiControlling = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const idleAnimationInstance = useRef<any>(null);

    // Expose methods to parent (App.tsx)
    useImperativeHandle(ref, () => ({
        clickElement: async (selectorId: string) => {
            await interactWithElement(selectorId, 'click');
        },
        pointAtElement: async (selectorId: string) => {
            await interactWithElement(selectorId, 'point');
        },
        resetPosition: () => {
            isAiControlling.current = false;
            startIdleAnimation();
        }
    }));

    // Initial placement
    useEffect(() => {
        if (isActive && orbRef.current) {
            // Set initial position immediately via DOM
            orbRef.current.style.left = `${currentPos.current.x}px`;
            orbRef.current.style.top = `${currentPos.current.y}px`;
            startIdleAnimation();
        }
        return () => stopIdleAnimation();
    }, [isActive]);

    const startIdleAnimation = () => {
        if (typeof window.anime === 'undefined' || !orbRef.current || isDragging.current || isAiControlling.current) return;
        stopIdleAnimation();

        // Pequeño movimiento de "respiración" o flotación
        idleAnimationInstance.current = window.anime({
            targets: orbRef.current,
            translateY: [
                { value: -10, duration: 2000, easing: 'easeInOutQuad' },
                { value: 0, duration: 2000, easing: 'easeInOutQuad' }
            ],
            scale: [
                { value: 1.05, duration: 3000, easing: 'easeInOutSine' },
                { value: 1, duration: 3000, easing: 'easeInOutSine' }
            ],
            loop: true,
            direction: 'alternate',
        });
    };

    const stopIdleAnimation = () => {
        if (idleAnimationInstance.current) {
            idleAnimationInstance.current.pause();
            idleAnimationInstance.current = null;
        }
        // Reset transforms managed by idle animation to avoid stacking issues
        if (orbRef.current) {
            window.anime.set(orbRef.current, { translateY: 0, scale: 1 });
        }
    };

    const interactWithElement = async (selectorId: string, action: 'click' | 'point') => {
        const target = document.getElementById(selectorId);
        if (!target || !orbRef.current || typeof window.anime === 'undefined') {
            console.warn(`VoiceOrb: Target #${selectorId} not found.`);
            return;
        }

        isAiControlling.current = true;
        stopIdleAnimation();

        const rect = target.getBoundingClientRect();
        const orbRect = orbRef.current.getBoundingClientRect();
        
        // Calculate target center relative to viewport
        // We aim slightly offset for pointing, or center for clicking
        const targetX = rect.left + (rect.width / 2) - (orbRect.width / 2);
        const targetY = rect.top + (rect.height / 2) - (orbRect.height / 2);

        // 1. Travel to target
        await window.anime({
            targets: orbRef.current,
            left: targetX,
            top: targetY,
            duration: 600, 
            easing: 'easeOutExpo'
        }).finished;

        // Update internal position ref
        currentPos.current = { x: targetX, y: targetY };

        if (action === 'click') {
            // 2. Simulate Press
            // Make orb pointer-events none so we can click the element underneath
            orbRef.current.style.pointerEvents = 'none';
            
            // Visual press
            await window.anime({
                targets: orbRef.current,
                scale: [1, 0.8],
                duration: 150,
                easing: 'easeInOutSine',
                direction: 'alternate'
            }).finished;

            // Trigger click on underlying element
            target.click();
            
            // Create ripple on target for visual feedback
            createRipple(target, rect);

            // Restore pointer events
            orbRef.current.style.pointerEvents = 'auto';
            
            // Small delay before moving away
            await new Promise(r => setTimeout(r, 200));

        } else {
            // Pointing logic (hover/pulse)
            await window.anime({
                targets: orbRef.current,
                scale: [1, 1.2, 1],
                duration: 800,
            }).finished;
            await new Promise(r => setTimeout(r, 500));
        }

        // Resume idle only if user hasn't grabbed it in the meantime
        if (!isDragging.current) {
            isAiControlling.current = false;
            startIdleAnimation();
        }
    };

    const createRipple = (target: HTMLElement, rect: DOMRect) => {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.width = '0px';
        ripple.style.height = '0px';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '100'; // Ensure visible

        // Handle relative positioning for absolute child
        const originalPos = window.getComputedStyle(target).position;
        if (originalPos === 'static') target.style.position = 'relative';
        
        target.appendChild(ripple);

        window.anime({
            targets: ripple,
            width: Math.max(rect.width, rect.height) * 2.5,
            height: Math.max(rect.width, rect.height) * 2.5,
            opacity: 0,
            duration: 500,
            easing: 'easeOutExpo',
            complete: () => {
                if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
            }
        });
    };

    // --- Mouse Interaction ---

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current && orbRef.current) {
                const newX = e.clientX - dragOffset.current.x;
                const newY = e.clientY - dragOffset.current.y;
                
                orbRef.current.style.left = `${newX}px`;
                orbRef.current.style.top = `${newY}px`;
                currentPos.current = { x: newX, y: newY };
            }
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                isAiControlling.current = false;
                startIdleAnimation();
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    if (!isActive) return null;

    let glowColor = 'rgba(88, 86, 214, 0.5)'; 
    let coreColor = '#5856D6';
    
    if (state === 'RESPONDING') {
        glowColor = 'rgba(59, 130, 246, 0.7)'; 
        coreColor = '#3B82F6';
    } else if (state === 'THINKING') {
         glowColor = 'rgba(255, 255, 255, 0.6)'; 
         coreColor = '#FFFFFF';
    }

    if (document.body.classList.contains('stranger-things-theme')) {
        glowColor = 'rgba(229, 9, 20, 0.7)';
        coreColor = '#E50914';
    }

    const scale = 1 + (volume * 0.4);

    return (
        <div 
            ref={orbRef}
            className="fixed z-[9999] flex flex-col items-center justify-center touch-none select-none"
            style={{ 
                width: '64px',
                height: '64px',
                cursor: isDragging.current ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => {
                stopIdleAnimation();
                isDragging.current = true;
                isAiControlling.current = false;
                if (orbRef.current) {
                    const rect = orbRef.current.getBoundingClientRect();
                    dragOffset.current = {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                    };
                }
            }}
        >
            {/* Transcription Bubble */}
            {transcription && (
                <div className="absolute bottom-full mb-4 bg-black/70 backdrop-blur-md text-white text-sm px-4 py-2 rounded-2xl whitespace-nowrap pointer-events-none animate-fade-in border border-white/10 shadow-xl z-[10000]">
                    {transcription}
                </div>
            )}

            <div className="relative group w-full h-full flex items-center justify-center">
                 {/* Close Button */}
                 <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute -top-6 -right-6 w-8 h-8 flex items-center justify-center bg-surface-secondary text-text-secondary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:text-danger hover:bg-danger/10 pointer-events-auto"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>

                {/* The Orb Core */}
                <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/10"
                    style={{
                        backgroundColor: 'rgba(20, 20, 20, 0.9)',
                        boxShadow: `0 0 ${30 * scale}px ${glowColor}, inset 0 0 20px ${glowColor}`,
                        transition: 'box-shadow 0.1s ease-out, background-color 0.3s ease'
                    }}
                >
                    <div 
                        className="w-10 h-10 rounded-full transition-transform duration-75"
                        style={{
                            backgroundColor: coreColor,
                            transform: `scale(${state === 'LISTENING' ? Math.max(0.6, scale) : 1})`,
                            opacity: state === 'LISTENING' ? 0.8 : 1
                        }}
                    >
                         {state === 'THINKING' && <SparklesIcon className="w-full h-full text-bg-main animate-spin p-1" />}
                    </div>
                </div>
                
                {/* Ripple Effect for Speaking */}
                {state === 'RESPONDING' && (
                    <div className="absolute inset-0 -z-10">
                         <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping" style={{ color: coreColor }}></div>
                    </div>
                )}
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
});

export default VoiceOrb;
