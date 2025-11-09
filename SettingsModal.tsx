import React, { useState, ReactNode } from 'react';
import type { Settings } from './types';
import { 
    XMarkIcon, SunIcon, UsersIcon, TrashIcon, CheckIcon, SparklesIcon, 
    ArrowDownTrayIcon, ShieldCheckIcon, BoltIcon, ExclamationTriangleIcon 
} from './components/icons';
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
    onResetApp: () => void;
}

// Helper components for structure and styling
const Section: React.FC<{title: string, description: string, children: ReactNode}> = ({title, description, children}) => (
    <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-text-main mb-1">{title}</h2>
        <p className="text-text-secondary mb-8">{description}</p>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const Card: React.FC<{children: ReactNode, className?: string}> = ({children, className = ''}) => (
    <div className={`bg-surface-secondary p-4 rounded-xl border border-border-subtle ${className}`}>
        {children}
    </div>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSave, 
    onClearHistory, 
    onExportHistory, 
    onInstallApp,
    installPromptEvent,
    onResetApp,
}) => {
    const [activeSection, setActiveSection] = useState('account');

    if (!isOpen) return null;

    const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        onSave({ ...settings, [key]: value });
    };
    
    const handleReset = () => {
        if (window.confirm("¿Estás seguro de que quieres restablecer SAM? Se borrarán todos tus chats, configuraciones y tu nombre. La aplicación se recargará.")) {
            onResetApp();
        }
    };

    const sections = {
        account: { title: 'Perfil', icon: UsersIcon },
        personalization: { title: 'Personalización de IA', icon: SparklesIcon },
        appearance: { title: 'Apariencia', icon: SunIcon },
        application: { title: 'Aplicación', icon: ArrowDownTrayIcon },
        data: { title: 'Gestión de Datos', icon: TrashIcon },
        support: { title: 'Soporte y Ayuda', icon: ShieldCheckIcon },
    };
    
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'account':
                return (
                    <Section title="Perfil de Usuario" description="Ayuda a SAM a entender mejor tu contexto profesional para adaptar sus respuestas.">
                        <Card>
                            <label htmlFor="profession-input" className="block text-sm font-medium text-text-secondary mb-2">¿A qué te dedicas?</label>
                            <input
                                type="text"
                                id="profession-input"
                                value={settings.profession}
                                onChange={(e) => handleSettingChange('profession', e.target.value)}
                                placeholder="Ej: Desarrollador, Diseñador, Estudiante..."
                                className="w-full bg-surface-primary border border-border-subtle rounded-lg px-3 py-2 text-text-main placeholder:text-text-secondary focus:ring-accent focus:border-accent outline-none"
                            />
                            <p className="text-xs text-text-secondary mt-2">SAM usará esta información para darte ejemplos y explicaciones más relevantes.</p>
                        </Card>
                    </Section>
                );
            case 'personalization':
                return (
                    <Section title="Personalización de IA" description="Ajusta cómo SAM interactúa y responde para que se adapte mejor a ti.">
                        <Card>
                            <label htmlFor="personality-select" className="block text-sm font-medium text-text-secondary mb-2">Personalidad de SAM</label>
                            <select
                                id="personality-select"
                                value={settings.personality}
                                onChange={(e) => handleSettingChange('personality', e.target.value as Settings['personality'])}
                                className="w-full bg-surface-primary border border-border-subtle rounded-lg px-3 py-2 text-text-main focus:ring-accent focus:border-accent outline-none"
                            >
                                {PERSONALITIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </Card>
                         <Card>
                            <label className="block text-sm font-medium text-text-secondary mb-3">Modelo por Defecto</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={() => handleSettingChange('defaultModel', 'sm-i1')} className={`relative text-left p-3 rounded-lg border-2 transition-all ${settings.defaultModel === 'sm-i1' ? 'border-accent ring-2 ring-accent/20' : 'border-border-subtle hover:border-text-secondary/50'}`}>
                                    {settings.defaultModel === 'sm-i1' && <CheckIcon className="absolute top-2 right-2 w-4 h-4 text-accent" />}
                                    <div className="font-semibold text-text-main">SM-I1</div>
                                    <p className="text-xs text-text-secondary mt-1">Rápido y eficiente para tareas diarias.</p>
                                </button>
                                <button onClick={() => handleSettingChange('defaultModel', 'sm-i3')} className={`relative text-left p-3 rounded-lg border-2 transition-all ${settings.defaultModel === 'sm-i3' ? 'border-accent ring-2 ring-accent/20' : 'border-border-subtle hover:border-text-secondary/50'}`}>
                                    {settings.defaultModel === 'sm-i3' && <CheckIcon className="absolute top-2 right-2 w-4 h-4 text-accent" />}
                                    <div className="flex items-center gap-2 font-semibold text-text-main"><SparklesIcon className="w-5 h-5 text-yellow-400" /> SM-I3</div>
                                    <p className="text-xs text-text-secondary mt-1">Más potente para tareas complejas.</p>
                                </button>
                            </div>
                        </Card>
                        <Card>
                             <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-text-main flex items-center gap-2"><BoltIcon className="w-5 h-5"/>Modo Rápido</div>
                                    <p className="text-xs text-text-secondary mt-1 pr-4">Prioriza la velocidad usando siempre el modelo SM-I1.</p>
                                </div>
                                <button onClick={() => handleSettingChange('quickMode', !settings.quickMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.quickMode ? 'bg-accent' : 'bg-border-subtle'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.quickMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </Card>
                    </Section>
                );
            case 'appearance':
                return (
                    <Section title="Apariencia" description="Personaliza el aspecto de la interfaz a tu gusto.">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => handleSettingChange('theme', 'light')} className={`relative border-2 rounded-xl p-3 text-left transition-all ${settings.theme === 'light' ? 'border-accent ring-2 ring-accent/20' : 'border-transparent hover:border-border-subtle'}`}>
                                {settings.theme === 'light' && <CheckIcon className="absolute top-3 right-3 w-5 h-5 text-accent" />}
                                <div className="w-full h-24 bg-white rounded-lg mb-3 border border-gray-200 flex items-center justify-center">
                                  <div className="w-3/4 h-3/4 bg-gray-100 rounded p-2 space-y-2">
                                    <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                                    <div className="h-2 bg-blue-200 rounded w-1/3"></div>
                                  </div>
                                </div>
                                <span className="font-semibold text-sm text-text-main">Claro</span>
                            </button>
                            <button onClick={() => handleSettingChange('theme', 'dark')} className={`relative border-2 rounded-xl p-3 text-left transition-all ${settings.theme === 'dark' ? 'border-accent ring-2 ring-accent/20' : 'border-transparent hover:border-border-subtle'}`}>
                                {settings.theme === 'dark' && <CheckIcon className="absolute top-3 right-3 w-5 h-5 text-accent" />}
                                <div className="w-full h-24 bg-[#1E1F20] rounded-lg mb-3 border border-gray-700 flex items-center justify-center">
                                   <div className="w-3/4 h-3/4 bg-[#2C2C2E] rounded p-2 space-y-2">
                                    <div className="h-2 bg-gray-600 rounded w-1/2"></div>
                                    <div className="h-2 bg-blue-800 rounded w-1/3"></div>
                                  </div>
                                </div>
                                <span className="font-semibold text-sm text-text-main">Oscuro</span>
                            </button>
                        </div>
                    </Section>
                );
            case 'application':
                 return (
                    <Section title="Aplicación" description="Instala SAM en tu dispositivo para un acceso rápido y una experiencia integrada.">
                        <Card>
                        {installPromptEvent ? (
                            <button
                                onClick={onInstallApp}
                                className="w-full flex items-center justify-center gap-3 text-left text-sm font-semibold text-text-main bg-surface-primary hover:bg-border-subtle/50 px-4 py-3 rounded-lg transition-colors border border-border-subtle"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                <span>Instalar SAM en el dispositivo</span>
                            </button>
                        ) : (
                            <div>
                                <h4 className="font-semibold text-text-main">Aplicación ya instalada o no soportada</h4>
                                <p className="text-sm text-text-secondary mt-2">
                                    Puedes instalar SAM desde el menú de tu navegador buscando la opción "Instalar aplicación" o "Añadir a la pantalla de inicio".
                                </p>
                            </div>
                        )}
                        </Card>
                    </Section>
                );
             case 'data':
                return (
                    <Section title="Gestión de Datos" description="Maneja tus datos guardados en la aplicación.">
                        <Card>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-text-main">Exportar Historial</h4>
                                    <p className="text-sm text-text-secondary">Guarda una copia de todos tus chats.</p>
                                </div>
                                <button
                                    onClick={onExportHistory}
                                    className="text-sm font-semibold bg-surface-primary border border-border-subtle text-text-main px-4 py-2 rounded-lg hover:bg-border-subtle/50"
                                >
                                    Exportar
                                </button>
                            </div>
                        </Card>
                        <Card className="border-danger/30">
                            <h3 className="font-bold text-danger text-lg mb-2">Zona de Peligro</h3>
                            <p className="text-sm text-text-secondary mb-4">Estas acciones son irreversibles. Por favor, procede con cautela.</p>
                            <div className="space-y-4">
                               <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-text-main">Borrar Historial</h4>
                                        <p className="text-sm text-text-secondary">Elimina permanentemente todos tus chats.</p>
                                    </div>
                                    <button
                                        onClick={onClearHistory}
                                        className="text-sm font-semibold bg-danger/10 text-danger px-4 py-2 rounded-lg hover:bg-danger/20"
                                    >
                                        Borrar
                                    </button>
                                </div>
                                <div className="border-t border-border-subtle my-2"></div>
                               <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-text-main">Restablecer Aplicación</h4>
                                        <p className="text-sm text-text-secondary">Elimina todos los datos, incluyendo chats y ajustes.</p>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="text-sm font-semibold bg-danger/10 text-danger px-4 py-2 rounded-lg hover:bg-danger/20"
                                    >
                                        Restablecer
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </Section>
                );
            case 'support':
                 return (
                    <Section title="Soporte y Ayuda" description="Contacta con el equipo si encuentras un problema o necesitas ayuda.">
                        <Card>
                             <div>
                                <h4 className="font-semibold text-text-main">Contactar a Soporte</h4>
                                <p className="text-sm text-text-secondary mt-2 mb-4">Usa el siguiente enlace para enviar un correo electrónico al equipo de soporte. Incluye tantos detalles como sea posible sobre tu problema.</p>
                                <a
                                    href="mailto:samuelcassb@gmail.com,helpsamia@gmail.com?subject=Soporte%20SAM%20IA"
                                    className="w-full flex items-center justify-center gap-2 text-left text-sm font-semibold text-text-main bg-surface-primary hover:bg-border-subtle/50 px-4 py-3 rounded-lg transition-colors border border-border-subtle"
                                >
                                    <ShieldCheckIcon className="w-5 h-5 text-accent" />
                                    <span>Enviar Correo de Soporte</span>
                                </a>
                            </div>
                        </Card>
                    </Section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4" onClick={onClose}>
            <div 
                className="bg-surface-primary rounded-none md:rounded-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[700px] shadow-2xl animate-fade-in-up border border-border-subtle flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-border-subtle flex-shrink-0">
                    <h3 className="text-xl font-bold text-text-main">Configuración</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-secondary transition-colors">
                        <XMarkIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </header>
                
                <main className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">
                    <nav className="flex flex-row md:flex-col gap-1 border-b md:border-b-0 md:border-r border-border-subtle p-3 overflow-x-auto md:overflow-y-auto custom-scrollbar-thin">
                       {Object.entries(sections).map(([key, { title, icon: Icon }]) => (
                           <button 
                                key={key} 
                                onClick={() => setActiveSection(key)} 
                                className={`flex items-center gap-3 p-3 rounded-lg text-left w-full md:w-56 transition-colors text-sm font-semibold ${activeSection === key ? 'bg-accent text-white' : 'text-text-secondary hover:bg-surface-secondary hover:text-text-main'}`}
                           >
                               <Icon className="w-5 h-5 flex-shrink-0" />
                               <span className="whitespace-nowrap">{title}</span>
                           </button>
                       ))}
                    </nav>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        {renderSectionContent()}
                    </div>
                </main>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .animate-fade-in-up { animation: fade-in-up 0.2s ease-out; }

                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--color-border-subtle); border-radius: 20px; border: 2px solid var(--color-surface-primary); }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--color-text-secondary); }
                
                .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-thin::-webkit-scrollbar-thumb { background-color: transparent; }
                .custom-scrollbar-thin:hover::-webkit-scrollbar-thumb { background-color: var(--color-border-subtle); border-radius: 20px; }
            `}</style>
        </div>
    );
};

export default SettingsModal;