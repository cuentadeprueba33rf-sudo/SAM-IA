
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ViewfinderCircleIcon, BoltIcon } from './icons';
import { detectObjectsInFrame } from '../services/geminiService';

interface RealityScannerProps {
    onNavigateBack: () => void;
}

const RealityScanner: React.FC<RealityScannerProps> = ({ onNavigateBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [detections, setDetections] = useState<Array<{ box_2d: number[], label: string }>>([]);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsScanning(true);
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("No se pudo acceder a la cámara para Reality Scanner.");
                onNavigateBack();
            }
        };

        startCamera();

        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [onNavigateBack]);

    useEffect(() => {
        if (!isScanning) return;

        const scanFrame = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Capture frame
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

            try {
                // Send to Gemini
                const results = await detectObjectsInFrame(base64);
                setDetections(results);
            } catch (e) {
                console.error("Detection failed", e);
            }
        };

        // Scan every 2.5 seconds
        intervalRef.current = window.setInterval(scanFrame, 2500);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isScanning]);

    // Draw detections
    const renderOverlay = () => {
        if (!videoRef.current || detections.length === 0) return null;
        
        // Video dimensions might differ from display dimensions, but we use % for overlay
        // Gemini returns 1000x1000 normalized coordinates [ymin, xmin, ymax, xmax]
        
        return detections.map((det, i) => {
            const [ymin, xmin, ymax, xmax] = det.box_2d;
            
            const top = (ymin / 1000) * 100;
            const left = (xmin / 1000) * 100;
            const height = ((ymax - ymin) / 1000) * 100;
            const width = ((xmax - xmin) / 1000) * 100;

            return (
                <div 
                    key={i}
                    className="absolute border-2 border-cyan-400 bg-cyan-400/10 z-10 transition-all duration-500 ease-out"
                    style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`
                    }}
                >
                    <div className="absolute -top-6 left-0 bg-cyan-400 text-black text-xs font-bold px-2 py-0.5 uppercase tracking-wider">
                        {det.label}
                    </div>
                    {/* HUD Corners */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white"></div>
                </div>
            );
        });
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
            {/* Camera View */}
            <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Grid Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                
                {/* Bounding Boxes */}
                {renderOverlay()}

                {/* Scanner Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-scan-line"></div>
            </div>

            {/* UI Layer */}
            <div className="relative z-20 flex flex-col h-full justify-between p-6">
                <div className="flex justify-between items-start">
                    <button onClick={onNavigateBack} className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-cyan-400">
                            <ViewfinderCircleIcon className="w-4 h-4 animate-pulse" />
                            <span className="text-xs font-bold tracking-widest">REALITY SCANNER</span>
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-cyan-500/70">
                            SYSTEM: ONLINE<br/>
                            AI MODEL: SM-I1 VISION<br/>
                            LATENCY: LOW
                        </div>
                    </div>
                </div>

                <div className="self-center mb-8">
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-500/50 flex items-center justify-center animate-ping-slow">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <BoltIcon className="w-6 h-6 text-cyan-400" />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan-line {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scan-line 3s linear infinite;
                }
                @keyframes ping-slow {
                    0% { box-shadow: 0 0 0 0 rgba(6,182,212, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(6,182,212, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(6,182,212, 0); }
                }
                .animate-ping-slow {
                    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default RealityScanner;
