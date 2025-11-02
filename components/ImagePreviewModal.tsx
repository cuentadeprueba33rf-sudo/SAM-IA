import React from 'react';
import type { Attachment } from '../types';
import { XMarkIcon, ArrowDownTrayIcon } from './icons';

interface ImagePreviewModalProps {
    image: Attachment | null;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ image, onClose }) => {
    if (!image) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = image.data;
        link.download = image.name || 'generated-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" 
            onClick={onClose}
        >
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <img 
                    src={image.data} 
                    alt={image.name} 
                    className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" 
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button 
                        onClick={handleDownload} 
                        className="flex items-center gap-2 bg-gray-900/50 text-white px-5 py-2.5 rounded-full hover:bg-gray-900/70 transition-colors backdrop-blur-sm border border-white/20"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span className="font-semibold">Descargar</span>
                    </button>
                </div>
                 <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-gray-900/50 text-white rounded-full p-2.5 hover:bg-gray-900/70 transition-colors backdrop-blur-sm border border-white/20"
                    aria-label="Cerrar vista previa"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ImagePreviewModal;