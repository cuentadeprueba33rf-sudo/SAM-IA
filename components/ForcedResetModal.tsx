import React from 'react';
import { ExclamationTriangleIcon } from './icons';

interface ForcedResetModalProps {
    onConfirm: () => void;
}

const ForcedResetModal: React.FC<ForcedResetModalProps> = ({ onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
            <div 
                className="bg-surface-primary rounded-2xl max-w-md w-full shadow-2xl border border-border-subtle flex flex-col p-8 text-center" 
            >
                <div className="mx-auto bg-yellow-500/10 p-3 rounded-full w-fit mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                </div>
                
                <h3 className="text-xl font-bold text-text-main">Actualización Importante Requerida</h3>
                
                <p className="text-text-secondary my-4">
                    Pedimos disculpas por las molestias. Para asegurar que recibas las últimas mejoras y correcciones de errores, es necesario restablecer los datos de la aplicación en tu navegador.
                </p>
                <p className="text-sm text-text-secondary">
                    Esta acción borrará tus chats actuales, pero es esencial para el correcto funcionamiento de SAM. <strong>Esta es una medida única.</strong>
                </p>

                <button 
                    onClick={onConfirm}
                    className="mt-8 w-full bg-accent text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                    Restablecer y Continuar
                </button>
            </div>
        </div>
    );
};

export default ForcedResetModal;
