
import React, { useImperativeHandle, forwardRef, useRef, useState } from 'react';

export interface GhostCursorHandle {
    click: (selectorId: string, options?: { delay?: number }) => Promise<void>;
    scroll: (selectorId: string, direction: 'up' | 'down', amount?: number) => Promise<void>;
}

const GhostCursor = forwardRef<GhostCursorHandle, {}>((props, ref) => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useImperativeHandle(ref, () => ({
        click: async (selectorId: string, options: { delay?: number } = {}) => {
            const target = document.getElementById(selectorId);
            if (!target || !cursorRef.current || typeof window.anime === 'undefined') {
                console.warn(`GhostCursor: Target #${selectorId} not found or anime.js missing.`);
                return;
            }

            setIsVisible(true);
            const rect = target.getBoundingClientRect();
            
            // Randomize slightly to look human
            const randomX = Math.random() * (rect.width / 2) - (rect.width / 4);
            const randomY = Math.random() * (rect.height / 2) - (rect.height / 4);
            const targetX = rect.left + (rect.width / 2) + randomX;
            const targetY = rect.top + (rect.height / 2) + randomY;

            // Move cursor
            await window.anime({
                targets: cursorRef.current,
                left: targetX,
                top: targetY,
                duration: 800,
                easing: 'easeOutQuart'
            }).finished;

            // Simulate Tap animation
            await window.anime({
                targets: cursorRef.current,
                scale: [1, 0.8],
                opacity: [0.8, 1],
                duration: 150,
                easing: 'easeInOutSine',
                direction: 'alternate'
            }).finished;

            // Create Ripple Effect on target (Visual feedback)
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.left = `${rect.width / 2 + randomX}px`;
            ripple.style.top = `${rect.height / 2 + randomY}px`;
            ripple.style.width = '0px';
            ripple.style.height = '0px';
            ripple.style.borderRadius = '50%';
            ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            ripple.style.pointerEvents = 'none';
            ripple.style.transform = 'translate(-50%, -50%)';
            target.style.position = target.style.position === 'static' ? 'relative' : target.style.position;
            target.style.overflow = 'hidden';
            target.appendChild(ripple);

            window.anime({
                targets: ripple,
                width: '200px',
                height: '200px',
                opacity: 0,
                duration: 500,
                easing: 'easeOutExpo',
                complete: () => ripple.remove()
            });

            // Actual Click Trigger
            target.click();

            if (options.delay) {
                await new Promise(resolve => setTimeout(resolve, options.delay));
            }
        },
        scroll: async (selectorId: string, direction: 'up' | 'down', amount = 300) => {
            const target = document.getElementById(selectorId);
            if (!target) return;
            
            target.scrollBy({
                top: direction === 'down' ? amount : -amount,
                behavior: 'smooth'
            });
            
            // Optional: Move cursor to scrollbar area visual cue
        }
    }));

    return (
        <div 
            ref={cursorRef}
            className={`fixed z-[9999] pointer-events-none transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: '50%', top: '50%', width: '24px', height: '24px', marginTop: '-12px', marginLeft: '-12px' }}
        >
            {/* Cursor Visual - A subtle glowing touch point */}
            <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
        </div>
    );
});

export default GhostCursor;
