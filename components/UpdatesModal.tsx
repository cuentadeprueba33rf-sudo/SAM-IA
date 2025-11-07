import React from 'react';
import { XMarkIcon, SparklesIcon, CheckIcon } from './icons';

interface UpdatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const updates = [
  {
    version: "v1.3.0",
    date: "22 de Julio, 2024",
    changes: [
      "¡Panel de Configuración Rediseñado! Interfaz más elegante y organizada con nuevas secciones.",
      "Separación de Creadores y Colaboradores en el panel lateral para mayor claridad.",
      "Rediseño profesional del panel de 'Novedades' (lo estás viendo ahora).",
      "Corregido un error visual con el ícono de configuración.",
    ],
  },
  {
    version: "v1.2.0",
    date: "15 de Julio, 2024",
    changes: [
      "Indicador de búsqueda web y visualización de fuentes.",
      "Mejora en la barra de progreso para el modo 'Canvas Dev'.",
      "Rediseño de la interfaz con cabecera y pie de página flotantes.",
      "Actualización a los modelos de IA SM-I1 y SM-I3 para un rendimiento superior.",
    ],
  },
  {
    version: "v1.1.0",
    date: "8 de Julio, 2024",
    changes: [
      "Implementación del modo 'Canvas Dev' para la generación de código interactivo.",
      "Añadido selector de modelo (Standard / Flash).",
      "Correcciones de estabilidad y rendimiento.",
    ],
  },
];

const UpdatesModal: React.FC<UpdatesModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-surface-primary rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in-up border border-border-subtle max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-text-main flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-accent"/>
                        <span>Novedades en SAM</span>
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-secondary">
                        <XMarkIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </header>
                
                <main className="flex-1 overflow-y-auto -mr-4 pr-4">
                    <div className="space-y-6">
                        {updates.map((update, index) => (
                            <div key={update.version} className="bg-surface-secondary/50 p-5 rounded-xl border border-border-subtle">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-bold text-lg text-text-main bg-accent/10 text-accent px-3 py-1 rounded-full">{update.version}</span>
                                    <span className="text-sm text-text-secondary">{update.date}</span>
                                </div>
                                <ul className="space-y-2">
                                    {update.changes.map((change, changeIndex) => (
                                        <li key={changeIndex} className="flex items-start gap-3 text-sm text-text-main">
                                            <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="mt-8 flex-shrink-0">
                    <button onClick={onClose} className="bg-accent text-white font-semibold px-4 py-2 rounded-lg w-full hover:opacity-90 transition-opacity">
                        Entendido
                    </button>
                </footer>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default UpdatesModal;
