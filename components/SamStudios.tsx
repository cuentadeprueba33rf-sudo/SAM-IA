import React from 'react';
import { CodeBracketSquareIcon, ChevronLeftIcon, MagnifyingGlassIcon } from './icons';

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
                        {/* Canvas Dev Pro Card */}
                        <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 hover:border-accent transition-colors cursor-pointer flex flex-col h-full" onClick={() => onOpenApp('canvas_dev_pro')}>
                            <div className="flex items-start gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-[#1e1e1e] flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <CodeBracketSquareIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Canvas Dev Pro</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">Por Equipo VERCE</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 flex-1">
                                Un entorno de desarrollo integrado con IA para generar, visualizar y editar componentes web en tiempo real.
                            </p>
                             <div className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded w-fit">
                                4.9 ★ - Developer Tool
                            </div>
                        </div>

                        {/* Placeholder for future apps to fill the grid look */}
                        <div className="bg-surface-primary border border-border-subtle rounded-xl p-4 opacity-50 cursor-not-allowed flex flex-col h-full">
                            <div className="flex items-start gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                                    <div className="w-6 h-6 bg-border-subtle rounded-sm"></div>
                                </div>
                                <div>
                                    <div className="h-5 w-32 bg-surface-secondary rounded mb-1"></div>
                                    <div className="h-3 w-20 bg-surface-secondary rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-2 mb-4 flex-1">
                                <div className="h-3 w-full bg-surface-secondary rounded"></div>
                                <div className="h-3 w-5/6 bg-surface-secondary rounded"></div>
                            </div>
                             <div className="text-xs font-medium text-text-secondary">
                                Próximamente
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