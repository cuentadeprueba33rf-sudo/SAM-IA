import React, { useMemo } from 'react';
import { MODES } from '../constants';
import type { Mode, ModeID } from '../types';

interface PlusMenuProps {
    onAction: (mode: ModeID, accept?: string, capture?: string) => void;
}

const PlusMenu: React.FC<PlusMenuProps> = ({ onAction }) => {
    const categorizedModes = useMemo(() => {
        return MODES.filter(mode => !mode.hidden).reduce((acc, mode) => {
            const category = mode.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(mode);
            return acc;
        }, {} as Record<string, Mode[]>);
    }, []);

    // Define the order in which categories should appear
    const categoryOrder: string[] = ['Multimedia', 'Modos de IA', 'Herramientas'];

    return (
        <div className="plus-menu-scroll absolute bottom-full mb-3 w-full max-w-sm bg-surface-primary rounded-2xl border border-border-subtle shadow-2xl animate-fade-in-up p-2 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col">
                {categoryOrder.map(category => (
                    categorizedModes[category] && (
                        <div key={category} className="mb-1 last:mb-0">
                            <h4 className="px-3 pt-2 pb-1 text-xs font-bold uppercase text-text-secondary tracking-wider">{category}</h4>
                            {categorizedModes[category].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => onAction(mode.id, mode.accept, mode.capture)}
                                    className="w-full flex items-center gap-4 text-left p-3 rounded-lg hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                                >
                                    <div className="p-2 bg-surface-secondary rounded-lg">
                                       <mode.icon className="w-6 h-6 text-accent-blue" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-main text-sm">{mode.title}</p>
                                        <p className="text-text-secondary text-xs">{mode.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )
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
                .plus-menu-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .plus-menu-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .plus-menu-scroll::-webkit-scrollbar-thumb {
                    background-color: var(--color-border-subtle);
                    border-radius: 20px;
                }
                .plus-menu-scroll::-webkit-scrollbar-thumb:hover {
                    background-color: var(--color-text-secondary);
                }
            `}</style>
        </div>
    );
};

export default PlusMenu;