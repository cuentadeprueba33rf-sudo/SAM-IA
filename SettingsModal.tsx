import React, { useState } from 'react';
import type { Settings } from './types';
import { XMarkIcon, SunIcon, ChatBubbleLeftRightIcon, UsersIcon, TrashIcon, CheckIcon, SparklesIcon, ArrowDownTrayIcon } from './components/icons';
import { PERSONALITIES } from './constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSave: (settings: Settings) => void;
    onClearHistory: () => void;
    onExportHistory: () => void;
    onInstallApp: () => void;
    installPromptEvent: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSave, 
    onClearHistory, 
    onExportHistory, 
    onInstallApp,
    installPromptEvent 
}) => {
    const [activeSection, setActiveSection] = useState('appearance');

    if (!isOpen) return null;

    const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        onSave({ ...settings, [key]: value });
    };

    const sections = {
        appearance: { title: 'Apariencia', icon: SunIcon },
        personalization: { title: 'Personalización de IA', icon: ChatBubbleLeftRightIcon },
        account: { title: 'Perfil', icon: UsersIcon },
        application: { title: 'Aplicación', icon: ArrowDownTrayIcon },
        data: { title: 'Gestión de Datos', icon: TrashIcon },
    };
    
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'appearance':
                return (
                    <div>
                        <h4 className="font-semibold text-text-main text-lg mb-2">Apariencia</h4>
                        <p className="text-sm text-text-secondary mb-4">Personaliza el aspecto de la interfaz a tu gusto.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleSettingChange('theme', 'light')} className={`relative border-2 rounded-lg p-2 text-left transition-colors ${settings.theme === 'light' ? 'border-accent' : 'border-border-subtle hover:border-text-secondary/50'}`}>
                                {settings.theme === 'light' && <CheckIcon className="absolute top-2 right-2 w-5 h-5 text-accent" />}
                                <div className="w-full h-16 bg-gray-100 rounded mb-2 border border-gray-200"></div>
                                <span className="font-semibold text-sm text-text-main">Claro</span>
                            </button>
                            <button onClick={() => handleSettingChange('theme', 'dark')} className={`relative border-2 rounded-lg p-2 text-left transition-colors ${settings.theme === 'dark' ? 'border-accent' : 'border-border-subtle hover:border-text-secondary/50'}`}>
                                {settings.theme === 'dark' && <CheckIcon className="absolute top-2 right-2 w-5 h-5 text-accent" />}
                                <div className="w-full h-16 bg-gray-800 rounded mb-2 border border-gray-700"></div>
                                <span className="font-semibold text-sm text-text-main">Oscuro</span>
                            </button>
                        </div>
                    </div>
                );
            case 'personalization':
                 return (
                    <div>
                        <h4 className="font-semibold text-text-main text-lg mb-2">Personalización de IA</h4>
                        <p className="text-sm text-text-secondary mb-4">Ajusta cómo SAM interactúa y responde para que se adapte mejor a ti.</p>
                        <div className="space-y-6">
                             <div>
                                <label htmlFor="personality-select" className="block text-sm font-medium text-text-secondary mb-2">Personalidad</label>
                                <select
                                    id="personality-select"
                                    value={settings.personality}
                                    onChange={(e) => handleSettingChange('personality', e.target.value as Settings['personality'])}
                                    className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main focus:ring-accent focus:border-accent outline-none"
                                >
                                    {PERSONALITIES.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Modelo por Defecto</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button onClick={() => handleSettingChange('defaultModel', 'sm-i1')} className={`relative text-left p-3 rounded-lg border-2 ${settings.defaultModel === 'sm-i1' ? 'border-accent' : 'border-border-subtle hover:border-text-secondary/50'}`}>
                                        {settings.defaultModel === 'sm-i1' && <CheckIcon className="absolute top-2 right-2 w-4 h-4 text-accent" />}
                                        <div className="flex items-center gap-2 font-semibold text-text-main"><SparklesIcon className="w-5 h-5 text-yellow-400" /> SM-I1</div>
                                        <p className="text-xs text-text-secondary mt-1">Rápido y eficiente para tareas diarias.</p>
                                    </button>
                                     <button onClick={() => handleSettingChange('defaultModel', 'sm-i3')} className={`relative text-left p-3 rounded-lg border-2 ${settings.defaultModel === 'sm-i3' ? 'border-accent' : 'border-border-subtle hover:border-text-secondary/50'}`}>
                                        {settings.defaultModel === 'sm-i3' && <CheckIcon className="absolute top-2 right-2 w-4 h-4 text-accent" />}
                                        <div className="font-semibold text-text-main">SM-I3</div>
                                        <p className="text-xs text-text-secondary mt-1">Más potente para tareas complejas.</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'account':
                return (
                     <div>
                        <h4 className="font-semibold text-text-main text-lg mb-2">Perfil de Usuario</h4>
                        <p className="text-sm text-text-secondary mb-4">Ayuda a SAM a entender mejor tu contexto profesional.</p>
                        <div>
                            <label htmlFor="profession-input" className="block text-sm font-medium text-text-secondary mb-2">¿A qué te dedicas?</label>
                            <input
                                type="text"
                                id="profession-input"
                                value={settings.profession}
                                onChange={(e) => handleSettingChange('profession', e.target.value)}
                                placeholder="Ej: Desarrollador, Diseñador, Estudiante..."
                                className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main placeholder:text-text-secondary focus:ring-accent focus:border-accent outline-none"
                            />
                            <p className="text-xs text-text-secondary mt-1">SAM adaptará sus respuestas a tu estilo de trabajo.</p>
                        </div>
                    </div>
                );
            case 'application':
                return (
                    <div>
                        <h4 className="font-semibold text-text-main text-lg mb-2">Aplicación</h4>
                        <p className="text-sm text-text-secondary mb-4">Instala SAM en tu dispositivo para un acceso rápido y una experiencia integrada.</p>
                        {installPromptEvent ? (
                            <button
                                onClick={onInstallApp}
                                className="w-full flex items-center justify-center gap-2 text-left text-sm font-semibold text-text-main bg-surface-secondary hover:bg-border-subtle px-4 py-2 rounded-lg transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                <span>Instalar SAM en el dispositivo</span>
                            </button>
                        ) : (
                            <div className="text-sm text-text-secondary p-3 bg-surface-secondary rounded-lg">
                                <p className="font-semibold text-text-main">No se encontró el botón de instalación automática.</p>
                                <p className="mt-2">
                                    Aun así, puedes instalar SAM en tu dispositivo. Busca el ícono de instalación <ArrowDownTrayIcon className="w-4 h-4 inline-block -mt-1 mx-1" /> en la barra de direcciones de tu navegador, o busca la opción "Instalar aplicación" o "Añadir a la pantalla de inicio" en el menú de Chrome.
                                </p>
                            </div>
                        )}
                    </div>
                );
            case 'data':
                return (
                     <div>
                        <h4 className="font-semibold text-text-main text-lg mb-2">Gestión de Datos</h4>
                        <p className="text-sm text-text-secondary mb-4">Maneja tus datos guardados en la aplicación.</p>
                        <div className="space-y-3">
                            <button
                                onClick={onExportHistory}
                                className="w-full flex items-center justify-center gap-2 text-left text-sm font-semibold text-text-main bg-surface-secondary hover:bg-border-subtle px-4 py-2 rounded-lg transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                <span>Exportar historial de chats</span>
                            </button>
                            <button
                                onClick={onClearHistory}
                                className="w-full flex items-center justify-center gap-2 text-left text-sm font-semibold text-danger bg-danger/10 hover:bg-danger/20 px-4 py-2 rounded-lg transition-colors"
                            >
                                <TrashIcon className="w-5 h-5" />
                                <span>Borrar historial de chats</span>
                            </button>
                        </div>
                         <p className="text-xs text-text-secondary mt-2">La eliminación de chats es permanente y no se puede deshacer.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-surface-primary rounded-2xl max-w-3xl w-full h-full max-h-[600px] shadow-2xl animate-fade-in-up border border-border-subtle flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-border-subtle flex-shrink-0">
                    <h3 className="text-xl font-semibold text-text-main">Configuración</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-secondary">
                        <XMarkIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </header>
                
                <main className="flex-1 flex flex-col md:flex-row gap-6 lg:gap-8 p-4 md:p-6 overflow-hidden">
                    <nav className="flex flex-row md:flex-col gap-1 md:border-r md:border-border-subtle md:pr-6 -ml-2 overflow-x-auto md:overflow-x-visible">
                       {Object.entries(sections).map(([key, { title, icon: Icon }]) => (
                           <button 
                                key={key} 
                                onClick={() => setActiveSection(key)} 
                                className={`flex items-center gap-3 p-2 rounded-lg text-left w-full md:w-40 transition-colors text-sm font-medium ${activeSection === key ? 'bg-accent/10 text-accent' : 'text-text-main hover:bg-surface-secondary'}`}
                           >
                               <Icon className="w-5 h-5 flex-shrink-0" />
                               <span className="whitespace-nowrap">{title}</span>
                           </button>
                       ))}
                    </nav>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-4 md:custom-scrollbar">
                        {renderSectionContent()}
                    </div>
                </main>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.2s ease-out;
                }
                .md\\:custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .md\\:custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .md\\:custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--color-border-subtle); border-radius: 20px; }
                .md\\:custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--color-text-secondary); }
            `}</style>
        </div>
    );
};

export default SettingsModal;
