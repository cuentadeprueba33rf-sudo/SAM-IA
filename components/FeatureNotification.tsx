import React from 'react';
import { UsersIcon } from './icons';

interface FeatureNotificationProps {
    onDismissPermanently: () => void;
    onShowCollaborator: () => void;
}

const FeatureNotification: React.FC<FeatureNotificationProps> = ({ onDismissPermanently, onShowCollaborator }) => {
    return (
        <div className="relative max-w-sm ml-auto mb-2 transition-all duration-300" style={{ animation: 'slide-in-up 0.3s ease-out' }}>
            <div className="bg-surface-primary dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-4">
                         <div className="flex-shrink-0 p-2 bg-accent/10 rounded-full mt-1">
                           <UsersIcon className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-text-main">¡El equipo crece!</h4>
                            <p className="text-sm text-text-secondary mt-1">
                                Damos la bienvenida a Danny Casseres, Danna Simancas y al equipo de VERCE al desarrollo de SAM.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                         <button 
                            onClick={onDismissPermanently}
                            className="text-sm font-medium text-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-secondary"
                        >
                            Cerrar
                        </button>
                        <button 
                            onClick={onShowCollaborator}
                            className="text-sm font-semibold text-white bg-accent px-4 py-1.5 rounded-lg hover:opacity-90"
                        >
                            Ver
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes slide-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default FeatureNotification;