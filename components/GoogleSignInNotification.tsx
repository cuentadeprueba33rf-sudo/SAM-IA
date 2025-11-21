
import React from 'react';
import { SparklesIcon, UsersIcon } from './icons';

interface GoogleSignInNotificationProps {
    onDismiss: () => void;
    onSignIn: () => void;
}

const GoogleSignInNotification: React.FC<GoogleSignInNotificationProps> = ({ onDismiss, onSignIn }) => {
    return (
        <div className="relative max-w-sm ml-auto mb-2 transition-all duration-300" style={{ animation: 'slide-in-up 0.3s ease-out' }}>
            <div className="bg-surface-primary dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-4">
                         <div className="flex-shrink-0 p-2 bg-blue-500/10 rounded-full mt-1">
                           <SparklesIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-text-main">Más Inteligencia con Google</h4>
                            <p className="text-sm text-text-secondary mt-1">
                               Accede con tu cuenta de Google para sincronizar tus chats y desbloquear el máximo potencial de SAM.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                         <button 
                            onClick={onDismiss}
                            className="text-sm font-medium text-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-secondary"
                        >
                            Ahora no
                        </button>
                        <button 
                            onClick={onSignIn}
                            className="text-sm font-semibold text-white bg-blue-600 px-4 py-1.5 rounded-lg hover:opacity-90 shadow-lg shadow-blue-500/20"
                        >
                            Acceder
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

export default GoogleSignInNotification;
