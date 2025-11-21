
import React, { useRef, useState } from 'react';
import { ChevronLeftIcon, MagnifyingGlassIcon, PencilSquareIcon, CubeTransparentIcon, BeakerIcon, MapIcon, FilmIcon, SparklesIcon } from './icons';

interface SamStudiosProps {
    onNavigateBack: () => void;
    onOpenApp: (appId: string) => void;
}

const TiltCard: React.FC<{ children: React.ReactNode, onClick: () => void, className?: string }> = ({ children, onClick, className }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('');
    const [shine, setShine] = useState('');

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        
        // Enhanced tilt range for "Splendor" feel
        const tiltX = (0.5 - y) * 25; 
        const tiltY = (x - 0.5) * 25;

        setTransform(`perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.05, 1.05, 1.05)`);
        
        // Dynamic holographic shine
        setShine(`
            radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.2) 0%, transparent 50%),
            linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)
        `);
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
        setShine('');
    };

    return (
        <div 
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative transition-all duration-300 ease-out transform ${className}`}
            style={{ transform, transformStyle: 'preserve-3d' }}
        >
            <div 
                className="absolute inset-0 rounded-3xl pointer-events-none z-20 transition-opacity duration-300" 
                style={{ background: shine, mixBlendMode: 'overlay', opacity: shine ? 1 : 0 }} 
            />
            <div className="relative z-10 h-full flex flex-col">
                {children}
            </div>
        </div>
    );
};

const SamStudios: React.FC<SamStudiosProps> = ({ onNavigateBack, onOpenApp }) => {
    return (
        <div className="flex flex-col h-full w-full bg-bg-main overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border-subtle flex items-center gap-4 bg-surface-primary/80 backdrop-blur-md z-10 sticky top-0">
                <button onClick={onNavigateBack} className="p-2 rounded-full hover:bg-surface-secondary transition-colors">
                    <ChevronLeftIcon className="w-6 h-6 text-text-secondary" />
                </button>
                <div className="relative flex-1 max-w-md">
                     <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                     <input 
                        type="text" 
                        placeholder="Buscar en SAM Studios" 
                        className="w-full bg-surface-secondary border border-border-subtle rounded-full pl-10 pr-4 py-2 text-sm focus:ring-accent focus:border-accent outline-none transition-all"
                        readOnly
                     />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-bg-main to-bg-main">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Featured Hero Section */}
                    <div 
                        onClick={() => onOpenApp('echo_realms')}
                        className="mb-16 relative w-full h-[500px] rounded-[3rem] overflow-hidden cursor-pointer group shadow-2xl border border-white/10 transform transition-all duration-500 hover:shadow-accent/30 hover:scale-[1.01]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-black transition-transform duration-700 group-hover:scale-110"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-screen"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                        
                        <div className="absolute bottom-0 left-0 p-12 md:p-20 z-10 w-full">
                            <div className="flex items-center justify-between w-full">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-6 shadow-lg animate-pulse">
                                        <MapIcon className="w-4 h-4 text-cyan-400" /> Experiencia Inmersiva
                                    </div>
                                    <h2 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                        ECHO REALMS
                                    </h2>
                                    <p className="text-gray-200 text-xl md:text-2xl max-w-2xl font-medium drop-shadow-md leading-relaxed border-l-4 border-cyan-400 pl-6">
                                        Donde tus palabras forjan universos. <br/>Narrativa infinita, visuales generativos.
                                    </p>
                                </div>
                                <div className="hidden lg:flex">
                                     <div className="bg-white text-black font-black px-8 py-4 rounded-full text-lg transition-all transform translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 duration-500 shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center gap-3 hover:scale-110">
                                        <SparklesIcon className="w-6 h-6" />
                                        Jugar Ahora
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10 flex items-center gap-4">
                        <div className="h-10 w-1.5 bg-gradient-to-b from-accent to-purple-600 rounded-full"></div>
                        <div>
                            <h2 className="text-3xl font-black text-text-main tracking-tight">Suite Creativa</h2>
                            <p className="text-text-secondary text-lg">Herramientas de próxima generación impulsadas por SM-I3.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-20">
                        {/* ChronoLense Card */}
                        <TiltCard onClick={() => onOpenApp('chrono_lense')} className="bg-surface-primary border border-border-subtle rounded-[2rem] p-8 hover:border-cyan-500/50 transition-colors cursor-pointer flex flex-col h-[320px] shadow-xl hover:shadow-cyan-500/20 group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center mb-6 border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                <FilmIcon className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h3 className="font-black text-text-main text-2xl mb-2 group-hover:text-cyan-500 transition-colors">ChronoLense</h3>
                            <p className="text-xs font-bold text-cyan-500/80 uppercase tracking-wider mb-4">Simulador Temporal</p>
                            <p className="text-base text-text-secondary leading-relaxed">
                                Viaja a cualquier época. Visualiza el pasado o el futuro con fidelidad histórica.
                            </p>
                        </TiltCard>

                        {/* Voxel Toy Box Card */}
                         <TiltCard onClick={() => onOpenApp('voxel_toy_box')} className="bg-surface-primary border border-border-subtle rounded-[2rem] p-8 hover:border-indigo-500/50 transition-colors cursor-pointer flex flex-col h-[320px] shadow-xl hover:shadow-indigo-500/20 group">
                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center mb-6 border border-white/10 shadow-2xl shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                                <CubeTransparentIcon className="w-9 h-9 text-white" />
                            </div>
                            <h3 className="font-black text-text-main text-2xl mb-2 group-hover:text-indigo-500 transition-colors">Voxel Toy Box</h3>
                            <p className="text-xs font-bold text-indigo-500/80 uppercase tracking-wider mb-4">Motor Físico 3D</p>
                            <p className="text-base text-text-secondary leading-relaxed">
                                Construye, destruye y reconstruye modelos con un motor de partículas real.
                            </p>
                        </TiltCard>

                        {/* Photosam Card */}
                        <TiltCard onClick={() => onOpenApp('photosam')} className="bg-surface-primary border border-border-subtle rounded-[2rem] p-8 hover:border-purple-500/50 transition-colors cursor-pointer flex flex-col h-[320px] shadow-xl hover:shadow-purple-500/20 group">
                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-6 border border-white/10 shadow-2xl shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                <PencilSquareIcon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-black text-text-main text-2xl mb-2 group-hover:text-purple-500 transition-colors">Photosam</h3>
                            <p className="text-xs font-bold text-purple-500/80 uppercase tracking-wider mb-4">Estudio de Imagen</p>
                            <p className="text-base text-text-secondary leading-relaxed">
                                Generación y edición de imágenes avanzada con mezcla de ingredientes.
                            </p>
                        </TiltCard>
                        
                        {/* Logic Lab Card */}
                        <TiltCard onClick={() => onOpenApp('logic_lab')} className="bg-surface-primary border border-border-subtle rounded-[2rem] p-8 hover:border-teal-500/50 transition-colors cursor-pointer flex flex-col h-[320px] shadow-xl hover:shadow-teal-500/20 group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-6 border border-white/10 shadow-2xl shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                                <BeakerIcon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-black text-text-main text-2xl mb-2 group-hover:text-teal-500 transition-colors">Logic Lab</h3>
                            <p className="text-xs font-bold text-teal-500/80 uppercase tracking-wider mb-4">Prompt Engineering</p>
                            <p className="text-base text-text-secondary leading-relaxed">
                                Diseña, calibra y simula tus propios agentes de IA en un entorno controlado.
                            </p>
                        </TiltCard>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.4s ease-out; }
            `}</style>
        </div>
    );
};

export default SamStudios;
