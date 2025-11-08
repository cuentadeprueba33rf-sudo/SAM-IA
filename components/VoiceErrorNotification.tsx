import React from 'react';
import { ExclamationTriangleIcon } from './icons';

interface VoiceErrorNotificationProps {
    onDismiss: () => void;
}

const VoiceErrorNotification: React.FC<VoiceErrorNotificationProps> = ({ onDismiss }) => {
    return (
        <div className="relative max-w-sm ml-auto mb-2 transition-all duration-300" style={{ animation: 'slide-in-up 0.3s ease-out' }}>
            <div className="bg-surface-primary dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-2 bg-yellow-500/10 rounded-full mt-1">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-text-main">Aviso sobre el Chat de Voz</h4>
                            <p className="text-sm text-text-secondary mt-1">
                                La función de chat en vivo puede presentar errores. Nuestro equipo ya está trabajando para solucionarlos.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-3">
                        <button 
                            onClick={onDismiss}
                            className="text-sm font-semibold text-white bg-accent px-4 py-1.5 rounded-lg hover:opacity-90"
                        >
                            Entendido
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

export default VoiceErrorNotification;