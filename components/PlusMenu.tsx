
import React, { useState } from 'react';
import { MODES } from './constants';
import type { Mode, ModeID, Settings } from '../types';

interface PlusMenuProps {
    onAction: (mode: ModeID, accept?: string, capture?: string) => void;
    settings: Settings;
}

const PlusMenu: React.FC<PlusMenuProps> = ({ onAction, settings }) => {
    const gridModes = MODES.filter(mode => mode.id !== 'voice');
    const [hoveredMode, setHoveredMode] = useState<Mode | null>(null);

    const radius = 120; // The radius of the arc
    const startAngle = -140; // The starting angle in degrees
    const endAngle = -40; // The ending angle in degrees
    const angleRange = endAngle - startAngle;

    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-20 w-80 h-40 pointer-events-none flex items-end justify-center">
            <div className="relative w-full h-full pointer-events-auto">
                {/* Info Display Card */}
                <div className={`absolute bottom-[-2.5rem] left-1/2 -translate-x-1/2 w-56 p-4 bg-surface-primary/80 backdrop-blur-xl border border-border-subtle rounded-xl shadow-2xl transition-all duration-300 ease-in-out ${hoveredMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="text-center">
                        <p className="font-bold text-text-main text-sm mb-1">{hoveredMode?.title || 'Selecciona un modo'}</p>
                        <p className="text-text-secondary text-xs h-8">{hoveredMode?.description || 'Pasa el cursor sobre un icono'}</p>
                    </div>
                </div>

                {/* Arc Items */}
                {gridModes.map((mode, index) => {
                    const totalItems = gridModes.length;
                    const angle = startAngle + (totalItems > 1 ? (index / (totalItems - 1)) * angleRange : angleRange / 2);
                    const radians = angle * (Math.PI / 180);
                    const x = radius * Math.cos(radians);
                    const y = radius * Math.sin(radians);
                    const Icon = mode.icon;

                    return (
                        <button
                            key={mode.id}
                            id={`btn-mode-${mode.id}`}
                            onClick={() => onAction(mode.id, mode.accept, mode.capture)}
                            onMouseEnter={() => setHoveredMode(mode)}
                            onMouseLeave={() => setHoveredMode(null)}
                            className={`absolute bottom-0 left-1/2 w-14 h-14 bg-surface-primary/80 backdrop-blur-md rounded-full border border-border-subtle shadow-lg flex items-center justify-center transition-all duration-300 ease-out hover:!scale-110 hover:!border-accent hover:shadow-accent/30 ${
                                mode.disabled ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                            style={{
                                transform: `translate(-50%, 0) translate(${x}px, ${y}px) scale(0)`,
                                animation: `arc-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.04}s forwards`
                            }}
                            disabled={mode.disabled}
                        >
                            <Icon className="w-6 h-6 text-text-secondary group-hover:text-accent" />
                        </button>
                    );
                })}
            </div>
            <style>{`
                @keyframes arc-in {
                    from { transform: translate(-50%, 0) translate(0, 0) scale(0); opacity: 0; }
                    to { transform: var(--transform-result); opacity: 1; scale: 1; }
                }
                button {
                    --transform-result: translate(-50%, 0) translate(var(--x), var(--y)) scale(1);
                    --x: 0px;
                    --y: 0px;
                }
            `}</style>
            <script dangerouslySetInnerHTML={{__html: `
                document.querySelectorAll('.absolute.bottom-0.left-1\\/2').forEach(btn => {
                    const style = btn.getAttribute('style');
                    const match = style.match(/translate\\(([^,]+), ([^)]+)\\)/);
                    if (match) {
                        btn.style.setProperty('--x', match[1]);
                        btn.style.setProperty('--y', match[2]);
                        btn.style.animation = \`arc-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) \${btn.style.animationDelay} forwards\`;
                    }
                });
            `}} />
        </div>
    );
};

export default PlusMenu;
