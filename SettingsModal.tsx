import React, { useState, useEffect } from 'react';
import type { Settings } from './types';
import { XMarkIcon, SunIcon, ChatBubbleLeftRightIcon, UsersIcon, TrashIcon, CheckIcon, SparklesIcon, ArrowDownTrayIcon, ShieldCheckIcon, DocumentDuplicateIcon, BoltIcon, InformationCircleIcon } from './components/icons';
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
    premiumTimeLeft: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSave, 
    onClearHistory, 
    onExportHistory, 
    onInstallApp,
    installPromptEvent,
    premiumTimeLeft,
}) => {
    const [activeSection, setActiveSection] = useState('model_access');
    const [codeInput, setCodeInput] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [cooldownTimeLeft, setCooldownTimeLeft] = useState('');

    useEffect(() => {
        if (!settings.codeCooldownUntil) {
            setCooldownTimeLeft('');
            return;
        }
        const timer = setInterval(() => {
            const now = Date.now();
            const timeLeft = settings.codeCooldownUntil! - now;
            if (timeLeft <= 0) {
                setCooldownTimeLeft('');
                // The logic in App.tsx will handle generating a new code automatically.
            } else {
                const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                setCooldownTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [settings.codeCooldownUntil]);


    if (!isOpen) return null;

    const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        const newSettings = { ...settings, [key]: value };
        onSave(newSettings);
    };
    
    const handleVerifyCode = () => {
        if (codeInput.trim() === settings.accessCode && settings.accessCode.trim() !== '') {
            onSave({ 
                ...settings, 
                isPremiumUnlocked: true, 
                premiumActivationTimestamp: Date.now(),
                defaultModel: 'sm-i3'
            });
            setError("");
            setCodeInput("");
        } else {
            setError("El código no coincide o no es válido. Se generará uno nuevo si es necesario.");
        }
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const sections = {
        model_access: { title: 'Modelo y Acceso', icon: SparklesIcon },
        personalization: { title: 'Personalización', icon: ChatBubbleLeftRightIcon },
        moderation: { title: 'Moderación', icon: ShieldCheckIcon },
        appearance: { title: 'Apariencia', icon: SunIcon },
        account: { title: 'Perfil', icon: UsersIcon },
        application: { title: 'Aplicación', icon: ArrowDownTrayIcon },
        data: { title: 'Gestión de Datos', icon: TrashIcon },
    };
    
    const renderSectionContent = () => {
        switch (activeSection) {
             case 'model_access':
                return (
                    <div>
                        <h4 className="font-semibold text-text-main text-lg mb-2">Modelo y Acceso Premium</h4>
                        <p className="text-sm text-text-secondary mb-6">Gestiona tu nivel de acceso y las capacidades de la IA.</p>
                        
                        <div className={`p-4 rounded-lg border-2 ${settings.isPremiumUnlocked ? 'border-green-500' : 'border-border-subtle'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-text-main">Estado Actual</span>
                                {settings.isPremiumUnlocked ? (
                                    <span className="flex items-center gap-1.5 text-sm font-semibold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                                        <CheckIcon className="w-4 h-4" /> Premium Activo
                                    </span>
                                ) : (
                                     <span className="text-sm font-semibold bg-surface-secondary px-2 py-0.5 rounded-full">Estándar</span>
                                )}
                            </div>
                             <p className="text-xs text-text-secondary mt-1">
                                {settings.isPremiumUnlocked 
                                    ? `Tiempo restante: ${premiumTimeLeft}`
                                    : "Estás usando el modelo estándar con funciones limitadas."}
                            </p>
                        </div>
                        
                        {!settings.isPremiumUnlocked && settings.codeCooldownUntil && (
                            <div className="mt-6 p-4 bg-surface-secondary rounded-lg border border-border-subtle text-center">
                                <h5 className="font-semibold text-text-main">Acceso Expirado</h5>
                                <p className="text-sm text-text-secondary mt-1">Se generará un nuevo código de acceso en:</p>
                                <p className="text-2xl font-bold font-mono text-accent my-2">{cooldownTimeLeft}</p>
                            </div>
                        )}

                        {!settings.isPremiumUnlocked && !settings.codeCooldownUntil && (
                            <div className="mt-6">
                                <h5 className="font-semibold text-text-main mb-2">Activar Premium</h5>
                                <p className="text-sm text-text-secondary mb-3">Para confirmar tu acceso, ingresa tu código único que se muestra a continuación.</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={codeInput}
                                        onChange={(e) => { setCodeInput(e.target.value); setError(""); }}
                                        placeholder="Ingresa tu código único aquí"
                                        className="flex-1 bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main placeholder:text-text-secondary focus:ring-accent focus:border-accent outline-none"
                                        disabled={!settings.accessCode}
                                    />
                                    <button onClick={handleVerifyCode} className="bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!settings.accessCode}>
                                        Activar
                                    </button>
                                </div>
                                {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
                            </div>
                        )}
                        
                        {!settings.isPremiumUnlocked && !settings.codeCooldownUntil && settings.accessCode && (
                            <div className="mt-6">
                                 <h5 className="font-semibold text-text-main mb-2">Tu Código de Acceso Único</h5>
                                 <div className="flex items-center gap-2 p-2 bg-surface-secondary rounded-lg border border-border-subtle">
                                    <span className="font-mono text-text-main px-2">{settings.accessCode}</span>
                                    <button onClick={() => handleCopyToClipboard(settings.accessCode)} className="ml-auto p-2 rounded-md hover:bg-border-subtle">
                                        {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <DocumentDuplicateIcon className="w-4 h-4 text-text-secondary" />}
                                    </button>
                                 </div>
                                  <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                    <InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs">Este es tu código personal, válido por 16 horas y de un solo uso. No lo compartas.</p>
                                 </div>
                            </div>
                        )}
                    </div>
                );
            case 'moderation':
                 return (
                    <div>
                        <h4 className="font-semibold text-text-main text-lg mb-2">Moderación y Soporte</h4>
                        <p className="text-sm text-text-secondary mb-4">Contacta con el equipo si encuentras un problema o necesitas ayuda.</p>
                         {settings.isPremiumUnlocked ? (
                            <div>
                                <p className="text-sm text-text-main mb-3">Como usuario premium, tienes acceso directo al equipo de moderación. Usa el siguiente enlace para enviar un correo electrónico.</p>
                                <a
                                    href="mailto:samuelcassb@gmail.com,helpsamia@gmail.com?subject=Soporte%20SAM%20IA%20Premium"
                                    className="w-full flex items-center justify-center gap-2 text-left text-sm font-semibold text-text-main bg-surface-secondary hover:bg-border-subtle px-4 py-2 rounded-lg transition-colors"
                                >
                                    <ShieldCheckIcon className="w-5 h-5 text-accent" />
                                    <span>Contactar a Moderación</span>
                                </a>
                            </div>
                        ) : (
                             <div className="text-sm text-text-secondary p-4 bg-surface-secondary rounded-lg border border-border-subtle">
                                <p className="font-semibold text-text-main mb-2">Función Premium</p>
                                <p>El acceso directo a moderación es una ventaja del modelo SM-I3. Activa tu acceso premium para usar esta función.</p>
                            </div>
                        )}
                    </div>
                );
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
                                        <div className="font-semibold text-text-main">SM-I1</div>
                                        <p className="text-xs text-text-secondary mt-1">Rápido y eficiente para tareas diarias.</p>
                                    </button>
                                     <button onClick={() => { if(settings.isPremiumUnlocked) handleSettingChange('defaultModel', 'sm-i3')}} disabled={!settings.isPremiumUnlocked} className={`relative text-left p-3 rounded-lg border-2 ${settings.defaultModel === 'sm-i3' ? 'border-accent' : 'border-border-subtle'} ${settings.isPremiumUnlocked ? 'hover:border-text-secondary/50' : 'opacity-60 cursor-not-allowed'}`}>
                                        {settings.defaultModel === 'sm-i3' && <CheckIcon className="absolute top-2 right-2 w-4 h-4 text-accent" />}
                                        <div className="flex items-center gap-2 font-semibold text-text-main"><SparklesIcon className="w-5 h-5 text-yellow-400" /> SM-I3</div>
                                        <p className="text-xs text-text-secondary mt-1">Más potente para tareas complejas.</p>
                                        {!settings.isPremiumUnlocked && <span className="text-xs text-accent mt-1">Requiere Premium</span>}
                                    </button>
                                </div>
                            </div>
                            <div>
                                 <label className="block text-sm font-medium text-text-secondary mb-2">Velocidad de Respuesta</label>
                                 <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg border border-border-subtle">
                                    <div>
                                        <div className="font-semibold text-text-main flex items-center gap-2"><BoltIcon className="w-5 h-5"/>Modo Rápido</div>
                                        <p className="text-xs text-text-secondary mt-1">Prioriza la velocidad sobre la profundidad de la respuesta.</p>
                                    </div>
                                    <button onClick={() => handleSettingChange('quickMode', !settings.quickMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.quickMode ? 'bg-accent' : 'bg-border-subtle'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.quickMode ? 'translate-x-6' : 'translate-x-1'}`} />
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
                    <nav className="flex flex-row md:flex-col gap-1 md:border-r md:border-border-subtle md:pr-6 -ml-2 overflow-x-auto md:overflow-x-visible md:custom-scrollbar-thin">
                       {Object.entries(sections).map(([key, { title, icon: Icon }]) => (
                           <button 
                                key={key} 
                                onClick={() => setActiveSection(key)} 
                                className={`flex items-center gap-3 p-2 rounded-lg text-left w-full md:w-48 transition-colors text-sm font-medium ${activeSection === key ? 'bg-accent/10 text-accent' : 'text-text-main hover:bg-surface-secondary'}`}
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
                .md\\:custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .md\\:custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .md\\:custom-scrollbar-thin::-webkit-scrollbar-thumb { background-color: transparent; }
                .md\\:custom-scrollbar-thin:hover::-webkit-scrollbar-thumb { background-color: var(--color-border-subtle); }

            `}</style>
        </div>
    );
};

export default SettingsModal;