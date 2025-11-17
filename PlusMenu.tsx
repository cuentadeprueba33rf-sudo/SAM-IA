import React from 'react';
import { MODES } from './constants';
import type { ModeID, Settings } from '../types';

interface PlusMenuProps {
    onAction: (mode: ModeID, accept?: string, capture?: string) => void;
    settings: Settings;
}

const PlusMenu: React.FC<PlusMenuProps> = ({ onAction, settings }) => {
    // Exclude voice mode from the grid, as it will be handled by a dedicated button
    const gridModes = MODES.filter(mode => mode.id !== 'voice');
    const voiceMode = MODES.find(m => m.id === 'voice');
    
    // This should always be found, but good practice to check
    if (!voiceMode) return null; 

    const VoiceIcon = voiceMode.icon;

    return (
        <div className="absolute bottom-full mb-3 w-full max-w-lg bg-surface-primary rounded-xl border border-border-subtle shadow-2xl animate-fade-in-up p-2">
            <div className="grid grid-cols-2 gap-2">
                {gridModes.map((mode) => {
                    const Icon = mode.icon; // Assign component to a capitalized variable
                    return (
                        <button
                            key={mode.id}
                            onClick={() => onAction(mode.id, mode.accept, mode.capture)}
                            className={`flex items-center gap-3 text-left p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
                                mode.disabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-surface-secondary'
                            }`}
                            disabled={mode.disabled}
                        >
                            <div className="p-2 bg-surface-secondary rounded-full">
                               <Icon className="w-5 h-5 text-accent-blue" />
                            </div>
                            <div>
                                <p className="font-semibold text-text-main text-sm">{mode.title}</p>
                                <p className="text-text-secondary text-xs">{mode.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="p-1">
                 <button
                    key="voice"
                    onClick={() => onAction('voice')}
                    className={`flex w-full items-center gap-3 text-left p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:bg-surface-secondary`}
                >
                    <div className="p-2 bg-surface-secondary rounded-full">
                        <VoiceIcon className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div>
                        <p className="font-semibold text-text-main text-sm">Voz</p>
                        <p className="text-text-secondary text-xs">
                             Habla con SAM en tiempo real
                        </p>
                    </div>
                </button>
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