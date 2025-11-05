import React, { useState } from 'react';
import { ChevronDownIcon, CheckBadgeIcon } from './icons';

const collaborators = [
    { name: 'Samuel Casseres', color: '#FFD700' }, // Gold
    { name: 'Junayfer Palmera', color: '#3B82F6' }, // Blue
    { name: 'Danny Casseres', color: '#3B82F6' }, // Blue
    { name: 'Danna Simancas', color: '#3B82F6' }, // Blue
    { name: 'Equipo VERCE', color: '#FFD700' }, // Gold
];

const VerificationPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="px-4 py-2 border-t border-b border-border-subtle">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-secondary text-left w-full"
            >
                <span className="font-semibold text-sm text-text-main">Verificación de Creadores</span>
                <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pl-2 pt-2 space-y-2 animate-fade-in-down">
                    {collaborators.map(collab => (
                        <div key={collab.name} className="flex items-center gap-2 px-2 py-1">
                            <CheckBadgeIcon className="w-5 h-5 flex-shrink-0" fill={collab.color} />
                            <span className="text-sm text-text-main">{collab.name}</span>
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); max-height: 0; }
                    to { opacity: 1; transform: translateY(0); max-height: 500px; }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.3s ease-out;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default VerificationPanel;