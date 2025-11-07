import React from 'react';
import { SparklesIcon } from './icons';

interface PremiumNotificationProps {
    onDismiss: () => void;
    onGoToSettings: () => void;
}

const PremiumNotification: React.FC<PremiumNotificationProps> = ({ onDismiss, onGoToSettings }) => {
    return (
        <div className="relative bg-surface-primary rounded-xl shadow-lg border border-border-subtle overflow-hidden animate-fade-in-up">
            <div className="p-4">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 bg-accent/10 rounded-full mt-1">
                        <SparklesIcon className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-text-main">Desbloquea el Modelo SM-I3</h4>
                        <p className="text-sm text-text-secondary mt-1">
                            Activa el modo premium con tu código de acceso para obtener respuestas más elaboradas, chat de voz y más.
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                    <button 
                        onClick={onDismiss}
                        className="text-sm font-medium text-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-secondary"
                    >
                        Cerrar
                    </button>
                    <button 
                        onClick={onGoToSettings}
                        className="text-sm font-semibold text-white bg-accent px-4 py-1.5 rounded-lg hover:opacity-90"
                    >
                        Ver en Configuración
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                 .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PremiumNotification;