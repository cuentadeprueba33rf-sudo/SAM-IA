
import React from 'react';
import { MODES } from '../constants';
import type { ModeID, Settings } from '../types';

interface PlusMenuProps {
    onAction: (mode: ModeID, accept?: string, capture?: string) => void;
    settings: Settings;
}

const PlusMenu: React.FC<PlusMenuProps> = ({ onAction, settings }) => {
    // Filter out voice as it has its own dedicated button in the main UI
    const visibleModes = MODES.filter(mode => mode.id !== 'voice');

    return (
        <div className="absolute bottom-full left-0 mb-3 w-72 sm:w-80 bg-surface-primary/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] p-2 animate-scale-in z-50 origin-bottom-left overflow-hidden">
            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar-thin">
                {visibleModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => onAction(mode.id, mode.accept, mode.capture)}
                            disabled={mode.disabled}
                            className={`
                                group flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border border-transparent
                                ${mode.disabled 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-surface-secondary hover:border-border-subtle/50 hover:shadow-sm active:scale-[0.98]'
                                }
                            `}
                        >
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors border border-border-subtle/30
                                ${mode.disabled ? 'bg-gray-100 dark:bg-gray-800' : 'bg-surface-secondary group-hover:bg-accent/10 group-hover:border-accent/20'}
                            `}>
                                <Icon className={`w-5 h-5 transition-colors ${mode.disabled ? 'text-gray-400' : 'text-text-secondary group-hover:text-accent'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-text-main group-hover:text-accent transition-colors truncate">
                                    {mode.title}
                                </div>
                                <div className="text-[11px] text-text-secondary leading-tight truncate opacity-80 group-hover:opacity-100">
                                    {mode.description}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            <style>{`
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
                
                .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-thin::-webkit-scrollbar-thumb { background-color: var(--color-border-subtle); border-radius: 20px; }
            `}</style>
        </div>
    );
};

export default PlusMenu;
