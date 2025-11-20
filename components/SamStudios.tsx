
import React from 'react';
import { ChevronLeftIcon, MagnifyingGlassIcon, PencilSquareIcon, CubeTransparentIcon, BeakerIcon } from './icons';

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
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main mb-2">Featured</h2>
                        <p className="text-text-secondary">Selecciones principales de esta semana</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Voxel Toy Box Card */}
                         <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 hover:border-accent transition-colors cursor-pointer flex flex-col h-full relative group overflow-hidden" onClick={() => onOpenApp('voxel_toy_box')}>
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                             <div className="flex items-start gap-4 mb-3 relative z-10">
                                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg shadow-indigo-500/30">
                                    <CubeTransparentIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Voxel Toy Box</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">Por SAM Studios</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1 relative z-10">
                                Construye, destruye y reconstruye modelos 3D con física. Usa la IA para generar nuevas creaciones.
                            </p>
                             <div className="relative z-10 text-xs font-medium text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded w-fit flex items-center gap-1">
                                <span>✨ Powered by AI</span>
                            </div>
                        </div>

                        {/* Photosam Card */}
                        <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 hover:border-accent transition-colors cursor-pointer flex flex-col h-full" onClick={() => onOpenApp('photosam')}>
                            <div className="flex items-start gap-4 mb-3">
                                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <PencilSquareIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Photosam</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">Por SAM Studios</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1">
                                Un editor y generador de imágenes avanzado con IA para dar vida a tus ideas.
                            </p>
                             <div className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded w-fit">
                                5.0 ★ - Creative Tool
                            </div>
                        </div>
                        
                        {/* Logic Lab Card */}
                        <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 hover:border-teal-500 transition-colors cursor-pointer flex flex-col h-full" onClick={() => onOpenApp('logic_lab')}>
                           <div className="flex items-start gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <BeakerIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Logic Lab</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">Por SAM Studios</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1">
                                Laboratorio de ingeniería de prompts. Diseña, prueba y calibra tus propios agentes de IA.
                            </p>
                             <div className="text-xs font-medium text-teal-500 bg-teal-500/10 px-2 py-1 rounded w-fit">
                                Developer Tool
                            </div>
                        </div>

                        {/* Image Editor AI Card (Coming Soon) */}
                        <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 opacity-50 cursor-not-allowed flex flex-col h-full">
                           <div className="flex items-start gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <PencilSquareIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Image Editor AI</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">Por SAM Studios</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1">
                                Potente editor de imágenes con herramientas de IA para retoques profesionales.
                            </p>
                             <div className="text-xs font-medium text-text-secondary bg-surface-secondary px-2 py-1 rounded w-fit">
                                Coming Soon
                            </div>
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
