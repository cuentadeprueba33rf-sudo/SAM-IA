
import React, { useState, ReactNode } from 'react';
import type { Settings } from '../types';
import { 
    XMarkIcon, SunIcon, UsersIcon, TrashIcon, CheckIcon, SparklesIcon, 
    ArrowDownTrayIcon, ShieldCheckIcon, BoltIcon
} from './icons';
import { PERSONALITIES } from '../constants';

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

// Styled Components for the new look
const SectionHeader: React.FC<{title: string, description: string}> = ({title, description}) => (
    <div className="mb-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-text-main tracking-tight">{title}</h2>
        <p className="text-text-secondary text-sm mt-1">{description}</p>
    </div>
);

const SettingRow: React.FC<{label: string, subLabel?: string, children: ReactNode}> = ({label, subLabel, children}) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border-subtle last:border-0 gap-4 animate-fade-in">
        <div className="flex-1">
            <div className="font-medium text-text-main">{label}</div>
            {subLabel && <div className="text-xs text-text-secondary mt-0.5">{subLabel}</div>}
        </div>
        <div className="flex-shrink-0">
            {children}
        </div>
    </div>
);

const CustomToggle: React.FC<{checked: boolean, onChange: () => void, colorClass?: string}> = ({checked, onChange, colorClass = 'bg-accent'}) => (
    <button 
        onClick={onChange} 
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-primary focus:ring-accent ${checked ? colorClass : 'bg-border-subtle'}`}
    >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
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

    const sections = [
        { id: 'account', title: 'Perfil', icon: UsersIcon },
        { id: 'personalization', title: 'Inteligencia', icon: SparklesIcon },
        { id: 'appearance', title: 'Apariencia', icon: SunIcon },
        { id: 'application', title: 'Sistema', icon: ArrowDownTrayIcon },
        { id: 'data', title: 'Datos', icon: TrashIcon },
        { id: 'support', title: 'Ayuda', icon: ShieldCheckIcon },
    ];
    
    const renderContent = () => {
        switch (activeSection) {
            case 'account':
                return (
                    <div>
                        <SectionHeader title="Perfil de Usuario" description="Personaliza tu identidad para que SAM te conozca mejor." />
                        <div className="bg-surface-secondary/50 rounded-2xl p-1 border border-border-subtle">
                            <div className="bg-surface-primary rounded-xl p-4 shadow-sm">
                                <label htmlFor="profession-input" className="block text-sm font-semibold text-text-main mb-2">Profesión / Rol</label>
                                <input
                                    type="text"
                                    id="profession-input"
                                    value={settings.profession}
                                    onChange={(e) => handleSettingChange('profession', e.target.value)}
                                    placeholder="Ej: Ingeniero de Software, Estudiante de Arte..."
                                    className="w-full bg-surface-secondary border-transparent focus:bg-surface-primary focus:border-accent focus:ring-0 rounded-lg px-4 py-3 text-text-main placeholder:text-text-secondary/50 transition-all outline-none border-2"
                                />
                                <p className="text-xs text-text-secondary mt-2 px-1">
                                    SAM adaptará el tono y la complejidad de sus respuestas basándose en esto.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'personalization':
                return (
                    <div>
                        <SectionHeader title="Personalización de IA" description="Define el comportamiento y la capacidad del motor de IA." />
                        
                        <div className="space-y-6">
                            <div className="bg-surface-primary border border-border-subtle rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-border-subtle bg-surface-secondary/30">
                                    <h3 className="font-semibold text-text-main text-sm uppercase tracking-wider">Modelo Principal</h3>
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'sm-i1', label: 'SM-I1', desc: 'Rápido', icon: null },
                                        { id: 'sm-i3', label: 'SM-I3', desc: 'Balanceado', icon: <SparklesIcon className="w-4 h-4 text-yellow-400"/> },
                                        { id: 'sm-l3', label: 'SM-L3', desc: 'Potente', icon: <SparklesIcon className="w-4 h-4 text-purple-400"/> }
                                    ].map((model) => (
                                        <button 
                                            key={model.id}
                                            onClick={() => handleSettingChange('defaultModel', model.id as any)}
                                            className={`relative flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-200 ${settings.defaultModel === model.id ? 'border-accent bg-accent/5' : 'border-transparent bg-surface-secondary hover:bg-surface-secondary/80'}`}
                                        >
                                            <div className="flex items-center justify-between w-full mb-1">
                                                <div className="flex items-center gap-1.5 font-bold text-text-main text-sm">
                                                    {model.icon} {model.label}
                                                </div>
                                                {settings.defaultModel === model.id && <div className="w-2 h-2 rounded-full bg-accent"></div>}
                                            </div>
                                            <span className="text-xs text-text-secondary">{model.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-surface-primary border border-border-subtle rounded-2xl p-4 space-y-2">
                                <SettingRow label="Modo Rápido (Turbo)" subLabel="Fuerza el uso de modelos ligeros para respuestas instantáneas.">
                                    <CustomToggle checked={settings.quickMode} onChange={() => handleSettingChange('quickMode', !settings.quickMode)} colorClass="bg-yellow-500" />
                                </SettingRow>
                                
                                <div className="pt-4 mt-4 border-t border-border-subtle">
                                    <label className="block text-sm font-semibold text-text-main mb-3">Personalidad</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {PERSONALITIES.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSettingChange('personality', p.id)}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${settings.personality === p.id ? 'bg-accent text-white border-accent shadow-md' : 'bg-surface-secondary text-text-secondary border-transparent hover:border-border-subtle'}`}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'appearance':
                return (
                    <div>
                        <SectionHeader title="Apariencia" description="Haz que SAM se vea como tú quieras." />
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button 
                                onClick={() => handleSettingChange('theme', 'light')}
                                className={`group relative rounded-2xl border-2 p-1 transition-all ${settings.theme === 'light' ? 'border-accent ring-2 ring-accent/20' : 'border-transparent hover:border-border-subtle'}`}
                            >
                                <div className="bg-gray-100 rounded-xl p-4 h-32 flex flex-col justify-between overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-8 bg-white shadow-sm z-10"></div>
                                    <div className="space-y-2 mt-10">
                                        <div className="w-3/4 h-2 bg-gray-300 rounded-full"></div>
                                        <div className="w-1/2 h-2 bg-gray-300 rounded-full"></div>
                                    </div>
                                    <div className="self-end bg-blue-500 text-white text-[10px] px-2 py-1 rounded-lg shadow-sm">Hola</div>
                                </div>
                                <div className="mt-2 text-center text-sm font-medium text-text-main">Claro</div>
                                {settings.theme === 'light' && <div className="absolute top-3 right-3 bg-accent text-white rounded-full p-1"><CheckIcon className="w-3 h-3"/></div>}
                            </button>

                            <button 
                                onClick={() => handleSettingChange('theme', 'dark')}
                                className={`group relative rounded-2xl border-2 p-1 transition-all ${settings.theme === 'dark' ? 'border-accent ring-2 ring-accent/20' : 'border-transparent hover:border-border-subtle'}`}
                            >
                                <div className="bg-[#1E1E1E] rounded-xl p-4 h-32 flex flex-col justify-between overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-8 bg-[#252525] shadow-sm z-10"></div>
                                    <div className="space-y-2 mt-10">
                                        <div className="w-3/4 h-2 bg-gray-700 rounded-full"></div>
                                        <div className="w-1/2 h-2 bg-gray-700 rounded-full"></div>
                                    </div>
                                    <div className="self-end bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg shadow-sm">Hola</div>
                                </div>
                                <div className="mt-2 text-center text-sm font-medium text-text-main">Oscuro</div>
                                {settings.theme === 'dark' && <div className="absolute top-3 right-3 bg-accent text-white rounded-full p-1"><CheckIcon className="w-3 h-3"/></div>}
                            </button>
                        </div>

                        <div className="bg-surface-primary border border-border-subtle rounded-2xl p-4">
                            <SettingRow label="Tema Stranger Things" subLabel="Efectos de neón rojo y tipografía retro.">
                                <CustomToggle checked={settings.stThemeEnabled} onChange={() => handleSettingChange('stThemeEnabled', !settings.stThemeEnabled)} colorClass="bg-[#E50914]" />
                            </SettingRow>
                        </div>
                    </div>
                );
            case 'application':
                 return (
                    <div>
                        <SectionHeader title="Sistema" description="Versión de la aplicación y estado de instalación." />
                         <div className="bg-surface-primary border border-border-subtle rounded-2xl overflow-hidden">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mb-4 text-3xl">🚀</div>
                                <h3 className="text-lg font-bold text-text-main">SAM IA v1.5.0</h3>
                                <p className="text-text-secondary text-sm mt-1 mb-6">Build 2024.07.23 - Christmas Edition</p>
                                
                                {installPromptEvent ? (
                                    <button
                                        onClick={onInstallApp}
                                        className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                        Instalar App
                                    </button>
                                ) : (
                                    <div className="w-full bg-surface-secondary text-text-secondary font-medium py-3 rounded-xl flex items-center justify-center gap-2 cursor-default">
                                        <CheckIcon className="w-5 h-5" />
                                        Instalada / No disponible
                                    </div>
                                )}
                            </div>
                         </div>
                    </div>
                );
             case 'data':
                return (
                    <div>
                        <SectionHeader title="Datos y Privacidad" description="Tus datos te pertenecen. Adminístralos aquí." />
                        
                        <div className="space-y-4">
                            <button 
                                onClick={onExportHistory}
                                className="w-full flex items-center justify-between p-4 bg-surface-primary border border-border-subtle rounded-xl hover:border-accent transition-colors group"
                            >
                                <div className="text-left">
                                    <div className="font-semibold text-text-main group-hover:text-accent transition-colors">Exportar Chats</div>
                                    <div className="text-xs text-text-secondary">Descarga un archivo JSON con tu historial.</div>
                                </div>
                                <ArrowDownTrayIcon className="w-5 h-5 text-text-secondary group-hover:text-accent" />
                            </button>

                            <div className="border-t border-border-subtle my-6"></div>

                            <h3 className="text-danger font-bold text-sm uppercase tracking-wider mb-3">Zona de Peligro</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={onClearHistory}
                                    className="flex flex-col items-center justify-center p-4 bg-danger/5 border border-danger/20 rounded-xl hover:bg-danger/10 transition-colors text-danger"
                                >
                                    <TrashIcon className="w-6 h-6 mb-2" />
                                    <span className="font-semibold text-sm">Borrar Chats</span>
                                </button>
                                <button 
                                    onClick={handleReset}
                                    className="flex flex-col items-center justify-center p-4 bg-danger/5 border border-danger/20 rounded-xl hover:bg-danger/10 transition-colors text-danger"
                                >
                                    <BoltIcon className="w-6 h-6 mb-2" />
                                    <span className="font-semibold text-sm">Reset Total</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'support':
                 return (
                    <div>
                        <SectionHeader title="Soporte" description="Estamos aquí para ayudarte." />
                        <a
                            href="mailto:samuelcassb@gmail.com,helpsamia@gmail.com?subject=Soporte%20SAM%20IA"
                            className="block bg-gradient-to-br from-accent to-accent-blue p-1 rounded-2xl shadow-lg hover:shadow-xl transition-shadow group"
                        >
                            <div className="bg-surface-primary rounded-xl p-6 flex items-center gap-4 h-full">
                                <div className="bg-accent/10 p-3 rounded-full">
                                    <ShieldCheckIcon className="w-8 h-8 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-main group-hover:text-accent transition-colors">Contactar al Equipo</h3>
                                    <p className="text-text-secondary text-sm">Envíanos un correo con tus dudas o reportes de errores.</p>
                                </div>
                            </div>
                        </a>
                        <div className="mt-6 text-center text-xs text-text-secondary">
                            ID de Sesión: {Date.now().toString(36).toUpperCase()}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div 
                className="bg-surface-primary w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden border border-border-subtle animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar */}
                <aside className="w-64 bg-surface-secondary/50 border-r border-border-subtle flex flex-col hidden md:flex">
                    <div className="p-6 border-b border-border-subtle/50">
                        <h3 className="text-xl font-black text-text-main tracking-tight">Ajustes</h3>
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === section.id ? 'bg-surface-primary text-accent shadow-sm ring-1 ring-border-subtle' : 'text-text-secondary hover:text-text-main hover:bg-surface-secondary'}`}
                            >
                                <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-accent' : 'text-text-secondary group-hover:text-text-main'}`} />
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Mobile Header */}
                <div className="md:hidden absolute top-0 left-0 right-0 bg-surface-primary border-b border-border-subtle z-10 flex justify-between items-center p-4">
                    <h3 className="text-lg font-bold">Ajustes</h3>
                    <button onClick={onClose} className="p-2 rounded-full bg-surface-secondary text-text-main"><XMarkIcon className="w-5 h-5"/></button>
                </div>
                
                {/* Mobile Nav (Scrollable Top) */}
                 <div className="md:hidden absolute top-16 left-0 right-0 h-14 bg-surface-secondary border-b border-border-subtle flex items-center px-4 gap-2 overflow-x-auto no-scrollbar z-10">
                    {sections.map((section) => (
                         <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeSection === section.id ? 'bg-accent text-white' : 'bg-surface-primary text-text-secondary border border-border-subtle'}`}
                        >
                            {section.title}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <main className="flex-1 flex flex-col relative w-full">
                    <div className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-10">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-secondary text-text-secondary hover:text-text-main transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-36 md:pt-10">
                        <div className="max-w-2xl mx-auto">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </div>
             <style>{`
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default SettingsModal;
