
import React, { useEffect, useState } from 'react';
import { GlobalMessage } from '../services/firebase';
import { InformationCircleIcon, ExclamationTriangleIcon, CheckBadgeIcon, XMarkIcon, MegaphoneIcon } from './icons';

interface GlobalNotificationProps {
    message: GlobalMessage;
    onDismiss: () => void;
}

const GlobalNotification: React.FC<GlobalNotificationProps> = ({ message, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to allow animation
        setTimeout(() => setIsVisible(true), 100);
        
        // Auto dismiss after 10 seconds if not urgent
        if (message.type !== 'urgent') {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onDismiss, 500);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onDismiss, 500);
    };

    const styles = {
        info: { bg: 'bg-blue-500', icon: InformationCircleIcon, gradient: 'from-blue-600/90 to-blue-800/90' },
        success: { bg: 'bg-green-500', icon: CheckBadgeIcon, gradient: 'from-green-600/90 to-green-800/90' },
        warning: { bg: 'bg-yellow-500', icon: ExclamationTriangleIcon, gradient: 'from-yellow-600/90 to-yellow-800/90' },
        urgent: { bg: 'bg-red-500', icon: MegaphoneIcon, gradient: 'from-red-600/90 to-red-900/90' },
    };

    const currentStyle = styles[message.type] || styles.info;
    const Icon = currentStyle.icon;

    return (
        <div 
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-md px-4 transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}
        >
            <div className={`relative overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl border border-white/10 bg-gradient-to-r ${currentStyle.gradient} text-white`}>
                
                {/* Glossy Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                
                <div className="p-4 flex items-start gap-4 relative z-10">
                    <div className={`p-2 rounded-xl bg-white/20 shadow-inner backdrop-blur-sm flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 pt-0.5">
                        <h4 className="font-bold text-base leading-tight mb-1 drop-shadow-md">{message.title}</h4>
                        <p className="text-sm text-white/90 font-medium leading-relaxed opacity-90">{message.message}</p>
                        <div className="mt-2 text-[10px] opacity-60 uppercase tracking-wider font-bold">
                            Mensaje del Sistema • SAM IA
                        </div>
                    </div>

                    <button 
                        onClick={handleClose}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalNotification;
