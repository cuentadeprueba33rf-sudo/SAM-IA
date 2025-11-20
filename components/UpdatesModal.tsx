
import React from 'react';
import { XMarkIcon, SparklesIcon, CheckIcon, ClockIcon } from './icons';

interface UpdatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const updates = [
  {
    version: "v1.5.0",
    date: "27 de Octubre, 2024",
    badge: "Navidad",
    highlight: true,
    changes: [
      "¡Pre-inscripción para SM-l3.9! Asegura tu acceso al modelo más potente para esta Navidad.",
      "Nueva interfaz 'Voice Orb' con efectos visuales y mapa conceptual holográfico.",
      "Rediseño completo de Ajustes, Insights y Novedades.",
      "Photosam: Ahora con soporte para ingredientes múltiples y estilos predefinidos.",
    ],
  },
  {
    version: "v1.4.0",
    date: "23 de Julio, 2024",
    changes: [
      "¡Desbloqueo del Modelo Premium SM-I3! Activa el modo premium en la configuración.",
      "Chat de voz en tiempo real (Live API) con latencia ultrabaja.",
      "Soporte completo para HTML, CSS, y JavaScript en el generador de código.",
    ],
  },
  {
    version: "v1.3.0",
    date: "22 de Julio, 2024",
    changes: [
      "Panel de Configuración organizado por categorías.",
      "Separación de Creadores y Colaboradores en el panel lateral.",
    ],
  },
  {
    version: "v1.2.0",
    date: "15 de Julio, 2024",
    changes: [
      "Indicador de búsqueda web y visualización de fuentes.",
      "Rediseño de la interfaz con cabecera flotante.",
    ],
  },
];

const UpdatesModal: React.FC<UpdatesModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-surface-primary rounded-3xl max-w-2xl w-full shadow-2xl animate-scale-in border border-border-subtle max-h-[85vh] flex flex-col overflow-hidden relative" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-accent to-accent-blue p-8 pb-12 text-white relative overflow-hidden shrink-0">
                     <div className="absolute -right-10 -top-10 opacity-20">
                         <SparklesIcon className="w-48 h-48" />
                     </div>
                     <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors z-10">
                        <XMarkIcon className="w-5 h-5 text-white" />
                    </button>
                    <h2 className="text-3xl font-black tracking-tight relative z-10">Novedades</h2>
                    <p className="text-white/80 mt-2 relative z-10">Descubre lo último en SAM IA.</p>
                </div>
                
                <main className="flex-1 overflow-y-auto p-0 bg-surface-primary -mt-6 rounded-t-3xl relative z-20">
                    <div className="p-8 space-y-8">
                        {updates.map((update, index) => (
                            <div key={update.version} className="relative pl-8 border-l-2 border-border-subtle last:border-0 pb-8 last:pb-0 group">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-surface-primary ${index === 0 ? 'bg-accent' : 'bg-border-subtle group-hover:bg-text-secondary'} transition-colors`}></div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                    <span className={`text-lg font-bold ${index === 0 ? 'text-text-main' : 'text-text-secondary'}`}>
                                        {update.version}
                                    </span>
                                    {update.badge && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-red-500 to-pink-500 text-white w-fit">
                                            {update.badge}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-text-secondary sm:ml-auto bg-surface-secondary px-2 py-1 rounded-md w-fit">
                                        <ClockIcon className="w-3 h-3" />
                                        {update.date}
                                    </div>
                                </div>

                                {update.highlight && (
                                    <div className="mb-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                                        <p className="text-accent font-medium text-sm">¡Actualización Destacada!</p>
                                    </div>
                                )}

                                <ul className="space-y-3">
                                    {update.changes.map((change, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-text-main leading-relaxed">
                                            <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </main>
                
                <div className="p-4 border-t border-border-subtle bg-surface-primary/90 backdrop-blur-sm absolute bottom-0 left-0 right-0">
                    <button onClick={onClose} className="w-full bg-surface-secondary hover:bg-border-subtle text-text-main font-semibold py-3 rounded-xl transition-colors">
                        Cerrar
                    </button>
                </div>
                 {/* Spacer for the fixed footer */}
                 <div className="h-20 shrink-0 bg-surface-primary"></div>
            </div>
             <style>{`
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};

export default UpdatesModal;
