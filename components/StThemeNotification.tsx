import React from 'react';
import { MegaphoneIcon } from './icons';

interface StThemeNotificationProps {
    onDismiss: () => void;
    onDeactivate: () => void;
}

const StThemeNotification: React.FC<StThemeNotificationProps> = ({ onDismiss, onDeactivate }) => {
    return (
        <div className="relative max-w-sm ml-auto mb-2 transition-all duration-300" style={{ animation: 'slide-in-up 0.3s ease-out' }}>
            <div className="bg-surface-primary dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-2 bg-[#E50914]/10 rounded-full mt-1">
                           <MegaphoneIcon className="w-6 h-6 text-[#E50914]" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-text-main">Tema de Stranger Things Activado</h4>
                            <p className="text-sm text-text-secondary mt-1">
                               Se ha aplicado un efecto de neón rojo al cuadro de chat. Puedes desactivarlo en la configuración.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                         <button 
                            onClick={onDeactivate}
                            className="text-sm font-medium text-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-secondary"
                        >
                            Desactivar
                        </button>
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

export default StThemeNotification;