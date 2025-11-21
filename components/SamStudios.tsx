
import React from 'react';
import { ChevronLeftIcon, MagnifyingGlassIcon, PencilSquareIcon, CubeTransparentIcon, BeakerIcon, MapIcon, FilmIcon } from './icons';

interface SamStudiosProps {
    onNavigateBack: () => void;
    onOpenApp: (appId: string) => void;
}

const SamStudios: React.FC<SamStudiosProps> = ({ onNavigateBack, onOpenApp }) => {
    return (
        <div className="flex flex-col h-full w-full bg-bg-main overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border-subtle flex items-center gap-4">
                <button onClick={onNavigateBack} className="p-2 rounded-full hover:bg-surface-secondary transition-colors">
                    <ChevronLeftIcon className="w-6 h-6 text-text-secondary" />
                </button>
                <div className="relative flex-1 max-w-md">
                     <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                     <input 
                        type="text" 
                        placeholder="Buscar en SAM Studios" 
                        className="w-full bg-surface-secondary border border-border-subtle rounded-full pl-10 pr-4 py-2 text-sm focus:ring-accent focus:border-accent outline-none"
                        readOnly
                     />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                    
                    {/* Hero / Featured App */}
                    <div 
                        onClick={() => onOpenApp('echo_realms')}
                        className="mb-12 relative w-full h-64 md:h-80 rounded-3xl overflow-hidden cursor-pointer group shadow-2xl border border-border-subtle"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900 via-purple-900 to-black transition-transform duration-700 group-hover:scale-105"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                        
                        <div className="absolute bottom-0 left-0 p-8 md:p-10 z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-4">
                                <MapIcon className="w-4 h-4" /> Nueva Experiencia
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
                                ECHO REALMS
                            </h2>
                            <p className="text-gray-200 text-lg max-w-xl font-medium drop-shadow-md">
                                Sumérgete en una narrativa infinita donde cada decisión genera un nuevo mundo visual. El juego de rol definitivo potenciado por IA.
                            </p>
                        </div>
                        <div className="absolute top-6 right-6 bg-white text-black font-bold px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                            Jugar Ahora →
                        </div>
                    </div>

                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-text-main">Herramientas Creativas</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* ChronoLense Card */}
                        <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 hover:border-cyan-500 transition-colors cursor-pointer flex flex-col h-full" onClick={() => onOpenApp('chrono_lense')}>
                            <div className="flex items-start gap-4 mb-3">
                                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg">
                                    <FilmIcon className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">ChronoLense</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">Simulador Temporal</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1">
                                Visualiza cualquier lugar en cualquier época con fidelidad histórica.
                            </p>
                        </div>

                        {/* Voxel Toy Box Card */}
                         <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 hover:border-accent transition-colors cursor-pointer flex flex-col h-full relative group overflow-hidden" onClick={() => onOpenApp('voxel_toy_box')}>
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                             <div className="flex items-start gap-4 mb-3 relative z-10">
                                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg shadow-indigo-500/30">
                                    <CubeTransparentIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Voxel Toy Box</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">3D & Física</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1 relative z-10">
                                Construye, destruye y reconstruye modelos 3D.
                            </p>
                        </div>

                        {/* Photosam Card */}
                        <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 hover:border-accent transition-colors cursor-pointer flex flex-col h-full" onClick={() => onOpenApp('photosam')}>
                            <div className="flex items-start gap-4 mb-3">
                                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <PencilSquareIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Photosam</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">Estudio de Imagen</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1">
                                Generación y edición de imágenes avanzada.
                            </p>
                        </div>
                        
                        {/* Logic Lab Card */}
                        <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 hover:border-teal-500 transition-colors cursor-pointer flex flex-col h-full" onClick={() => onOpenApp('logic_lab')}>
                           <div className="flex items-start gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <BeakerIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Logic Lab</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">Prompt Engineering</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1">
                                Diseña y calibra tus propios agentes de IA.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default SamStudios;