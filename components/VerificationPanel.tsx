import React, { ComponentType } from 'react';
import { ChevronDownIcon, CheckBadgeIcon } from './icons';

interface Collaborator {
    name: string;
    color: string;
}

interface VerificationPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    title: string;
    icon: ComponentType<{ className?: string }>;
    collaborators: Collaborator[];
}

const VerificationPanel: React.FC<VerificationPanelProps> = ({ isOpen, onToggle, title, icon: Icon, collaborators }) => {
    return (
        <div className="px-2 py-1">
            <button
                onClick={onToggle}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-secondary text-left w-full"
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-text-secondary st-sidebar-icon" />
                    <span className="font-semibold text-sm text-text-main">{title}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''} st-sidebar-icon`} />
            </button>
            {isOpen && (
                <div className="pl-2 pt-2 space-y-2 animate-fade-in-down">
                    {collaborators.map(collab => (
                        <div key={collab.name} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-secondary">
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