import React, { useState, useEffect } from 'react';
import { AcademicCapIcon, XMarkIcon } from './icons';

interface FeatureNotificationProps {
    onDismiss: () => void;
    onDismissPermanently: () => void;
}

const FeatureNotification: React.FC<FeatureNotificationProps> = ({ onDismiss, onDismissPermanently }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = (permanent = false) => {
        setIsExiting(true);
        setTimeout(() => {
            if (permanent) {
                onDismissPermanently();
            } else {
                onDismiss();
            }
        }, 300);
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
            handleDismiss(false);
        }, 10000); // Auto-dismiss after 10 seconds

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`relative max-w-sm ml-auto mb-2 transition-all duration-300 ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ animation: 'slide-in-up 0.3s ease-out' }}>
            <div className="bg-surface-primary dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-4">
                         <div className="flex-shrink-0 p-2 bg-accent/10 rounded-full mt-1">
                           <AcademicCapIcon className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-text-main">¡Nuevo Modo: Compositor de Ensayos!</h4>
                            <p className="text-sm text-text-secondary mt-1">
                                Genera ensayos de nivel universitario, desde el esquema hasta las referencias, directamente en el chat.
                            </p>
                        </div>
                         <button onClick={() => handleDismiss(false)} className="-mt-2 -mr-2 p-2 rounded-full hover:bg-surface-secondary">
                            <XMarkIcon className="w-5 h-5 text-text-secondary"/>
                        </button>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                         <button 
                            onClick={() => handleDismiss(true)}
                            className="text-sm font-medium text-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-secondary"
                        >
                            No recordarme esto
                        </button>
                        <button 
                            onClick={() => handleDismiss(false)}
                            className="text-sm font-semibold text-white bg-accent px-4 py-1.5 rounded-lg hover:opacity-90"
                        >
                            ¡Genial!
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