import React from 'react';
import type { Settings } from './types';
import { XMarkIcon, SunIcon, MoonIcon, ChatBubbleLeftRightIcon, UsersIcon, TrashIcon } from './components/icons';
import { PERSONALITIES } from './constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSave: (settings: Settings) => void;
    onClearHistory: () => void;
}

const SettingsSection: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1 text-text-secondary">{icon}</div>
        <div className="flex-1">
            <h4 className="font-semibold text-text-main">{title}</h4>
            <p className="text-sm text-text-secondary mb-3">{description}</p>
            {children}
        </div>
    </div>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onClearHistory }) => {
    if (!isOpen) return null;

    const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        onSave({ ...settings, [key]: value });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-surface-primary rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in-up border border-border-subtle max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-text-main">Configuración</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-secondary">
                        <XMarkIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </header>
                
                <main className="flex-1 overflow-y-auto space-y-8 pr-2 -mr-4">
                    {/* Appearance Section */}
                    <SettingsSection
                        icon={<SunIcon className="w-6 h-6" />}
                        title="Apariencia"
                        description="Personaliza el aspecto de la interfaz a tu gusto."
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleSettingChange('theme', 'light')} className={`border-2 rounded-lg p-2 text-left ${settings.theme === 'light' ? 'border-accent' : 'border-border-subtle'}`}>
                                <div className="w-full h-12 bg-gray-100 rounded mb-2"></div>
                                <span className="font-semibold text-sm text-text-main">Claro</span>
                            </button>
                            <button onClick={() => handleSettingChange('theme', 'dark')} className={`border-2 rounded-lg p-2 text-left ${settings.theme === 'dark' ? 'border-accent' : 'border-border-subtle'}`}>
                                <div className="w-full h-12 bg-gray-800 rounded mb-2"></div>
                                <span className="font-semibold text-sm text-text-main">Oscuro</span>
                            </button>
                        </div>
                    </SettingsSection>
                    
                    {/* AI Customization Section */}
                    <SettingsSection
                        icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
                        title="Personalización de IA"
                        description="Ajusta cómo SAM interactúa y responde."
                    >
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="personality-select" className="block text-sm font-medium text-text-secondary mb-2">Personalidad de la Guía</label>
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
                        </div>
                    </SettingsSection>

                    {/* Profile Section */}
                    <SettingsSection
                        icon={<UsersIcon className="w-6 h-6" />}
                        title="Perfil de Usuario"
                        description="Ayuda a SAM a entender mejor tu contexto."
                    >
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
                    </SettingsSection>

                    {/* Data Management Section */}
                    <SettingsSection
                        icon={<TrashIcon className="w-6 h-6 text-danger" />}
                        title="Gestión de Datos"
                        description="Maneja tus datos guardados en la aplicación."
                    >
                         <button
                            onClick={onClearHistory}
                            className="w-full text-left text-sm font-semibold text-danger bg-danger/10 hover:bg-danger/20 px-4 py-2 rounded-lg transition-colors"
                        >
                            Borrar historial de chats
                        </button>
                        <p className="text-xs text-text-secondary mt-1">Esta acción es permanente y eliminará todas tus conversaciones.</p>
                    </SettingsSection>
                </main>

                <footer className="mt-8 flex-shrink-0">
                    <button onClick={onClose} className="bg-accent text-white font-semibold px-4 py-2 rounded-lg w-full hover:opacity-90 transition-opacity">
                        Hecho
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

export default SettingsModal;
