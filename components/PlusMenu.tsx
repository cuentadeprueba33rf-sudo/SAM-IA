import React from 'react';
import { MODES } from '../constants';
import type { ModeID } from '../types';

interface PlusMenuProps {
    onAction: (mode: ModeID, accept?: string, capture?: string) => void;
}

const PlusMenu: React.FC<PlusMenuProps> = ({ onAction }) => {
    return (
        <div className="absolute bottom-full mb-3 w-full max-w-lg bg-surface-primary rounded-xl border border-border-subtle shadow-2xl animate-fade-in-up p-2">
            <div className="grid grid-cols-2 gap-2">
                {MODES.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => onAction(mode.id, mode.accept, mode.capture)}
                        className="flex items-center gap-3 text-left p-3 rounded-lg hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        <div className="p-2 bg-surface-secondary rounded-full">
                           <mode.icon className="w-5 h-5 text-accent-blue" />
                        </div>
                        <div>
                            <p className="font-semibold text-text-main text-sm">{mode.title}</p>
                            <p className="text-text-secondary text-xs">{mode.description}</p>
                        </div>
                    </button>
                ))}
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default PlusMenu;