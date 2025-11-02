import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, ArrowPathIcon } from './icons';

interface CameraCaptureModalProps {
    onClose: () => void;
    onCapture: (dataUrl: string | null) => void;
    initialFacingMode: 'user' | 'environment';
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onClose, onCapture, initialFacingMode }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    const cleanupStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoInputs = devices.filter(device => device.kind === 'videoinput');
                setHasMultipleCameras(videoInputs.length > 1);
            });

        const startStream = async () => {
            cleanupStream();
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: { exact: facingMode } } 
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                // Fallback for devices that don't support exact facingMode
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    streamRef.current = stream;
                     if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (finalErr) {
                     console.error("Fallback camera access failed:", finalErr);
                    alert("No se pudo acceder a la cámara. Por favor, revisa los permisos en tu navegador.");
                    onClose();
                }
            }
        };

        startStream();

        return () => {
            cleanupStream();
        };
    }, [facingMode, onClose, cleanupStream]);

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState >= video.HAVE_METADATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                 if (facingMode === 'user') {
                    context.translate(video.videoWidth, 0);
                    context.scale(-1, 1);
                }
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                onCapture(dataUrl);
            }
        } else {
             console.error("Video not ready for capture");
             onCapture(null);
        }
    };
    
    const handleFlipCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-fade-in">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
            ></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            <div className="absolute top-4 right-4">
                <button
                    onClick={onClose}
                    className="bg-black/40 text-white rounded-full p-3 hover:bg-black/60 transition-colors backdrop-blur-sm"
                    aria-label="Cerrar cámara"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full flex justify-center items-center gap-16">
                <div className="w-20 h-20"></div>
                <button
                    onClick={handleCapture}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-black/20 focus:outline-none focus:ring-4 focus:ring-white/50"
                    aria-label="Tomar foto"
                >
                    <div className="w-[68px] h-[68px] bg-white rounded-full active:bg-gray-300 transition-colors"></div>
                </button>
                {hasMultipleCameras ? (
                    <button
                        onClick={handleFlipCamera}
                        className="w-20 h-20 flex items-center justify-center bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm"
                        aria-label="Cambiar cámara"
                    >
                        <ArrowPathIcon className="w-8 h-8" />
                    </button>
                ) : (
                    <div className="w-20 h-20"></div>
                )}
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

export default CameraCaptureModal;