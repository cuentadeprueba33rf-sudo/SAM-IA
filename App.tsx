










import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import UpdatesModal from './components/UpdatesModal';
import ContextMenu from './components/ContextMenu';
import Photosam from './components/Photosam';
import InsightsView from './components/InsightsView';
import EssayComposer from './components/EssayComposer';
import CameraCaptureModal from './components/CameraCaptureModal';
import ImagePreviewModal from './components/ImagePreviewModal';
import MathConsole from './components/MathConsole';
import WelcomeTutorial from './components/WelcomeTutorial';
import StThemeNotification from './components/StThemeNotification';
import InstallNotification from './components/InstallNotification';
import VoiceErrorNotification from './components/VoiceErrorNotification';
import ForcedResetModal from './components/ForcedResetModal';
import PreregistrationModal from './components/PreregistrationModal';
import ChatMessageItem from './components/ChatMessage';
import VoiceOrb from './components/VoiceOrb';
import SamStudios from './components/SamStudios';
import { streamGenerateContent, generateImage, startActiveConversation, detectMode, AppToolExecutors } from './services/geminiService';
import {
    Chat, ChatMessage, MessageAuthor, Attachment, ModeID, Settings,
    ModelType, Artifact, ViewID, Essay, Insight, UsageTracker
} from './types';
import { generateSystemInstruction, MODES } from './constants';
import { 
    BookOpenIcon, MegaphoneIcon, ViewColumnsIcon, AcademicCapIcon, 
    ChatBubbleLeftRightIcon, UsersIcon, ExclamationTriangleIcon, 
    XMarkIcon, ChartBarIcon, Bars3Icon, ChevronLeftIcon, 
    MicrophoneIcon, CodeBracketIcon, CalculatorIcon, PhotoIcon,
    ShareIcon, ChevronDownIcon, SparklesIcon
} from './components/icons';

type VoiceModeState = 'inactive' | 'activeConversation';
type ActiveConversationState = 'LISTENING' | 'RESPONDING' | 'THINKING';


const defaultSettings: Settings = {
    theme: 'dark',
    personality: 'default',
    profession: '',
    defaultModel: 'sm-i1',
    quickMode: false,
    stThemeEnabled: true,
};

const defaultEssay: Essay = {
    topic: '',
    academicLevel: 'university',
    tone: 'formal',
    wordCountTarget: 1000,
    outline: [],
    content: {},
    references: [],
    status: 'briefing',
};

const CanvasView: React.FC<{ pinnedArtifacts: Artifact[], onOpenArtifact: (artifact: Artifact) => void }> = ({ pinnedArtifacts, onOpenArtifact }) => (
    <div className="flex-1 p-8 overflow-y-auto">
        {pinnedArtifacts.length === 0 ? (
            <div className="text-center text-text-secondary mt-16">
                <ViewColumnsIcon className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-xl font-semibold">Tu Canvas está vacío</h2>
                <p>Ancla los artefactos generados en tus chats para verlos aquí.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pinnedArtifacts.map(artifact => (
                    <div key={artifact.id} onClick={() => onOpenArtifact(artifact)} className="bg-surface-primary rounded-lg p-4 border border-border-subtle cursor-pointer hover:border-accent transition-colors">
                        <h3 className="font-semibold text-text-main truncate">{artifact.title}</h3>
                        <p className="text-sm text-text-secondary mt-1">{artifact.language}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const DocItem: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-border-subtle rounded-xl bg-surface-primary overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex items-center justify-between p-4 hover:bg-surface-secondary transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                        <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="font-bold text-text-main">{title}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-sm text-text-secondary leading-relaxed animate-fade-in">
                    <div className="border-t border-border-subtle my-2"></div>
                    {children}
                </div>
            )}
        </div>
    );
};

const DocumentationView: React.FC = () => (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-text-main mb-2">Documentación de SAM IA v1.5</h1>
                <p className="text-text-secondary">Guía oficial de capacidades y modos de operación.</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-text-main px-1">Características Exclusivas</h2>
                
                <DocItem title="Modo de Voz Pro (El Orbe)" icon={MicrophoneIcon}>
                    <p className="mb-2">
                        SAM v1.5 reintroduce el <strong>Orbe Pro</strong>, una interfaz de voz inmersiva y centralizada.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mb-2">
                        <li><strong>Visualización Reactiva:</strong> El orbe cambia de color y pulsa en respuesta al volumen de tu voz y a los estados de la IA (escuchando, pensando, respondiendo).</li>
                        <li><strong>Control de la UI:</strong> Aunque ya no es un cursor físico, SAM sigue teniendo control total. Puedes pedirle que abra menús, cambie de modo o ajuste configuraciones, y lo hará instantáneamente.</li>
                        <li><strong>Dictado Inteligente:</strong> Di "escribe esto..." para dictar texto en el chat.</li>
                    </ul>
                </DocItem>

                <DocItem title="Photosam" icon={PhotoIcon}>
                    <p className="mb-2">Un estudio de creación de imágenes con IA para generar y editar fotos al instante.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Generación de imágenes a partir de texto con el modelo <strong>SM-L3</strong>.</li>
                        <li>Edición de imágenes existentes con prompts de texto.</li>
                        <li>Combinación de múltiples imágenes ("ingredientes") para crear composiciones únicas.</li>
                        <li>Selección de estilos artísticos: Realista, Animado, Comics y Pixelado.</li>
                    </ul>
                </DocItem>

                <DocItem title="Modo Matemático Avanzado" icon={CalculatorIcon}>
                    <p className="mb-2">Resolución de problemas con rigor académico y renderizado LaTeX.</p>
                    <p>Incluye una <strong>Consola de Verificación</strong> donde SAM muestra su proceso de pensamiento paso a paso (logs) antes de dar la respuesta final, asegurando precisión.</p>
                </DocItem>

                <DocItem title="Arquitecto Cognitivo" icon={ShareIcon}>
                    <p className="mb-2">Visualización de conocimiento estructurado.</p>
                    <p>Transforma cualquier tema complejo en un <strong>Mapa Mental Interactivo</strong>. SAM genera nodos y conexiones visuales seguidos de una explicación detallada en texto.</p>
                </DocItem>

                <DocItem title="Compositor de Ensayos" icon={AcademicCapIcon}>
                    <p className="mb-2">Asistente de redacción académica por etapas.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Generación de esquemas (outlines) personalizados.</li>
                        <li>Escritura modular: genera o edita cada sección individualmente.</li>
                        <li>Generación automática de referencias bibliográficas.</li>
                        <li>Exportación a formato Markdown o Texto Plano.</li>
                    </ul>
                </DocItem>
                
                 <DocItem title="Personalización" icon={SparklesIcon}>
                    <p>Ajusta SAM a tu estilo:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Temas: Claro, Oscuro y el exclusivo "Stranger Things".</li>
                        <li>Profesión: Dile a SAM a qué te dedicas para obtener respuestas contextualizadas.</li>
                        <li>Personalidad: Cambia entre Amable, Directo, Divertido o Intelectual.</li>
                    </ul>
                </DocItem>
            </div>
            
            <div className="mt-10 p-4 bg-surface-secondary rounded-xl text-center">
                <p className="text-sm text-text-secondary">SAM IA v1.5 &bull; Desarrollado por el Equipo VERCE</p>
            </div>
        </div>
         <style>{`
            @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fade-in 0.2s ease-out; }
        `}</style>
    </div>
);

const UsageView: React.FC = () => (
    <div className="flex-1 p-8 overflow-y-auto">
        <div className="text-center text-text-secondary mt-16">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Próximamente</h2>
            <p>Aquí podrás ver estadísticas sobre tu uso de los modelos de IA.</p>
        </div>
    </div>
);


const normalizeMode = (input: string): ModeID | undefined => {
    const lower = input.toLowerCase().trim();
    
    const exactMatch = MODES.find(m => m.id === lower);
    if(exactMatch) return exactMatch.id;

    const map: Record<string, ModeID> = {
        'math': 'math',
        'matemáticas': 'math',
        'cálculo': 'math',
        'search': 'search',
        'búsqueda': 'search',
        'internet': 'search',
        'architect': 'architect',
        'arquitecto': 'architect',
        'mapa': 'architect',
        'image': 'image_generation',
        'imagen': 'image_generation',
        'generar imagen': 'image_generation',
        'essay': 'essay',
        'ensayo': 'essay',
        'escribir': 'essay',
    };

    return map[lower] || (MODES.find(m => m.title.toLowerCase() === lower)?.id);
};


const App: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [isLoading, setIsLoading] = useState(false);
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [currentMode, setCurrentMode] = useState<ModeID>('normal');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
    const [isEssayComposerOpen, setIsEssayComposerOpen] = useState(false);
    const [editingEssay, setEditingEssay] = useState<{ essay: Essay, messageId: string } | null>(null);
    const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
    const [pinnedArtifacts, setPinnedArtifacts] = useState<Artifact[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
    const [previewImage, setPreviewImage] = useState<Attachment | null>(null);
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
    const [showInstallNotification, setShowInstallNotification] = useState(false);
    const [showLimitNotification, setShowLimitNotification] = useState(false);
    const [showVoiceErrorNotification, setShowVoiceErrorNotification] = useState(false);
    const [activeView, setActiveView] = useState<ViewID>('chat');
    const [showForcedResetModal, setShowForcedResetModal] = useState(false);
    const [isThemeActive, setIsThemeActive] = useState(false);
    const [showStThemeNotification, setShowStThemeNotification] = useState(false);
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [isPreregistrationModalOpen, setIsPreregistrationModalOpen] = useState(false);
    const [isPreregisteredForSML3_9, setIsPreregisteredForSML3_9] = useState(false);
    
    const [usage, setUsage] = useState<UsageTracker>({ date: new Date().toISOString().split('T')[0], count: 0, hasAttachment: false });

    // Voice State
    const [voiceModeState, setVoiceModeState] = useState<VoiceModeState>('inactive');
    const [activeConversationState, setActiveConversationState] = useState<ActiveConversationState>('LISTENING');
    const [liveTranscription, setLiveTranscription] = useState<string>('');
    const [voiceVolume, setVoiceVolume] = useState(0);
    const [voiceOrbMode, setVoiceOrbMode] = useState<'default' | 'explaining'>('default');
    // UPDATED: explanationData now supports descriptions
    const [explanationData, setExplanationData] = useState<{topic: string, points: {title: string, description: string}[]} | null>(null);
    
    const [chatInputText, setChatInputText] = useState('');
    const chatInputTextRef = useRef(chatInputText);

    useEffect(() => {
        chatInputTextRef.current = chatInputText;
    }, [chatInputText]);
    
    const [isMathConsoleOpen, setIsMathConsoleOpen] = useState(true);

    const abortControllerRef = useRef<AbortController | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const activeConversationRef = useRef<{ close: () => void } | null>(null);
    const creditsRef = useRef<HTMLDivElement>(null);
    const verificationPanelRef = useRef<HTMLDivElement>(null);
    
    const isPlusMenuOpenRef = useRef(isPlusMenuOpen);
    const activeViewRef = useRef(activeView);
    const sidebarOpenRef = useRef(sidebarOpen);
    
    // Refs to access latest state in voice tool executors
    const chatsRef = useRef(chats);
    const currentChatIdRef = useRef(currentChatId);

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);
    
    useEffect(() => {
        currentChatIdRef.current = currentChatId;
    }, [currentChatId]);

    useEffect(() => {
        isPlusMenuOpenRef.current = isPlusMenuOpen;
    }, [isPlusMenuOpen]);

    useEffect(() => {
        activeViewRef.current = activeView;
    }, [activeView]);
    
    useEffect(() => {
        sidebarOpenRef.current = sidebarOpen;
    }, [sidebarOpen]);

    const currentChat = chats.find(c => c.id === currentChatId);

    useEffect(() => {
        const hasReset = localStorage.getItem('sam_ia_forced_reset_v1.5');
        if (!hasReset) {
            setShowForcedResetModal(true);
            return;
        }

        try {
            const savedSettings = localStorage.getItem('sam-settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings({...defaultSettings, ...parsedSettings});
            }
        } catch (error) {
            console.error("Failed to load/parse settings, resetting.", error);
            localStorage.removeItem('sam-settings');
        }

        const preregistered = localStorage.getItem('sam_ia_preregistered_sml3.9') === 'true';
        setIsPreregisteredForSML3_9(preregistered);
        
        try {
            const savedUsage = localStorage.getItem('sam_ia_usage');
            const today = new Date().toISOString().split('T')[0];
            if(savedUsage) {
                const parsedUsage: UsageTracker = JSON.parse(savedUsage);
                if(parsedUsage.date === today) {
                    setUsage(parsedUsage);
                } else {
                    const newUsage = { date: today, count: 0, hasAttachment: false };
                    setUsage(newUsage);
                    localStorage.setItem('sam_ia_usage', JSON.stringify(newUsage));
                }
            } else {
                 const newUsage = { date: today, count: 0, hasAttachment: false };
                 localStorage.setItem('sam_ia_usage', JSON.stringify(newUsage));
            }

        } catch(error) {
             console.error("Failed to load usage tracker.", error);
        }

        try {
            const savedChats = localStorage.getItem('sam-chats');
            if (savedChats) {
                const parsedChats = JSON.parse(savedChats);
                setChats(parsedChats);

                const savedChatId = localStorage.getItem('sam-current-chat-id');
                const chatExists = parsedChats.some((c: Chat) => c.id === savedChatId);
                if (savedChatId && chatExists) {
                    setCurrentChatId(savedChatId);
                } else if (parsedChats.length > 0) {
                    setCurrentChatId(parsedChats[0].id);
                }
            }
        } catch(error) {
            console.error("Failed to load/parse chats, resetting.", error);
            localStorage.removeItem('sam-chats');
            localStorage.removeItem('sam-current-chat-id');
        }
        
        try {
            const savedPinnedArtifacts = localStorage.getItem('sam-pinned-artifacts');
            if (savedPinnedArtifacts) {
                setPinnedArtifacts(JSON.parse(savedPinnedArtifacts));
            }
        } catch (error) {
            console.error("Failed to load/parse pinned artifacts, resetting.", error);
            localStorage.removeItem('sam-pinned-artifacts');
        }

    }, []);

    useEffect(() => {
        const themeActivatedBefore = localStorage.getItem('st_theme_activated');
        if (themeActivatedBefore) {
            setIsThemeActive(true);
        } else {
            const onLoaded = () => {
                const timer = setTimeout(() => {
                    setIsThemeActive(true);
                    localStorage.setItem('st_theme_activated', 'true');
                }, 10000);
                 return () => clearTimeout(timer);
            };
            window.addEventListener('loadingScreenHidden', onLoaded, { once: true });
            return () => window.removeEventListener('loadingScreenHidden', onLoaded);
        }
    }, []);

    useEffect(() => {
        const notificationShownBefore = localStorage.getItem('st_notification_shown');

        if (isThemeActive && settings.stThemeEnabled) {
            document.body.classList.add('stranger-things-theme');
            if (!notificationShownBefore) {
                setShowStThemeNotification(true);
            }
        } else {
            document.body.classList.remove('stranger-things-theme');
        }
    }, [isThemeActive, settings.stThemeEnabled]);


    useEffect(() => {
        localStorage.setItem('sam-settings', JSON.stringify(settings));
        document.documentElement.className = settings.theme;
    }, [settings]);

    useEffect(() => {
        localStorage.setItem('sam-chats', JSON.stringify(chats));
    }, [chats]);
    
    useEffect(() => {
        if(currentChatId) {
            localStorage.setItem('sam-current-chat-id', currentChatId);
        } else {
            localStorage.removeItem('sam-current-chat-id');
        }
    }, [currentChatId]);

    useEffect(() => {
        localStorage.setItem('sam-pinned-artifacts', JSON.stringify(pinnedArtifacts));
    }, [pinnedArtifacts]);

    useEffect(() => {
        localStorage.setItem('sam_ia_usage', JSON.stringify(usage));
    }, [usage]);


    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
            if (!localStorage.getItem('sam-install-notif-dismissed')) {
                setShowInstallNotification(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    

    const handleSendMessage = useCallback(async (prompt: string, messageAttachment?: Attachment) => {
        if (isLoading || (!prompt.trim() && !messageAttachment)) return;
        
        const modelToUse = settings.quickMode ? 'sm-i1' : settings.defaultModel;

        if(modelToUse === 'sm-i3' || modelToUse === 'sm-l3' || modelToUse === 'sm-l3.9') {
            const limit = usage.hasAttachment ? 15 : 20;
            if(usage.count >= limit) {
                setShowLimitNotification(true);
                return;
            }
        }

        let tempChatId = currentChatId;
        if (!tempChatId) {
            const newChat: Chat = { id: uuidv4(), title: prompt.substring(0, 30) || "Nuevo Chat", messages: [] };
            setChats(prev => [newChat, ...prev]);
            setCurrentChatId(newChat.id);
            tempChatId = newChat.id;
        }

        const userMessage: ChatMessage = { id: uuidv4(), author: MessageAuthor.USER, text: prompt, timestamp: Date.now(), attachment: messageAttachment ?? undefined };
        setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: [...c.messages, userMessage] } : c));
        setAttachment(null);
        setChatInputText('');
        
        if (modelToUse === 'sm-i3' || modelToUse === 'sm-l3' || modelToUse === 'sm-l3.9') {
            setUsage(prev => ({ ...prev, count: prev.count + 1, hasAttachment: prev.hasAttachment || !!messageAttachment }));
        }

        let effectiveMode = currentMode;
        let modeSwitchReasoning: string | null = null;
        abortControllerRef.current = new AbortController();

        if (currentMode === 'normal' && !messageAttachment) {
            setIsLoading(true);
            const detectionInstruction = generateSystemInstruction('normal', settings);
            const detectionResult = await detectMode(prompt, detectionInstruction);
            if (detectionResult && !abortControllerRef.current.signal.aborted) {
                effectiveMode = detectionResult.newMode;
                modeSwitchReasoning = detectionResult.reasoning;
                setCurrentMode(effectiveMode);
                
                const systemMessage: ChatMessage = {
                    id: uuidv4(),
                    author: MessageAuthor.SYSTEM,
                    text: modeSwitchReasoning,
                    timestamp: Date.now(),
                };
                setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: [...c.messages, systemMessage] } : c));
            }
        }

        const samMessageId = uuidv4();
        const samMessage: ChatMessage = {
            id: samMessageId,
            author: MessageAuthor.SAM,
            text: '',
            timestamp: Date.now(),
            mode: effectiveMode,
            generatingArtifact: false,
            isSearching: effectiveMode === 'search' || effectiveMode === 'architect',
        };

        setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: [...c.messages, samMessage] } : c));
        setIsLoading(true);
        
        const updateSamMessage = (updates: Partial<ChatMessage>) => {
            setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: c.messages.map(m => m.id === samMessageId ? { ...m, ...updates } : m) } : c));
        };

        if (effectiveMode === 'image_generation') {
             try {
                const generatedImage = await generateImage({ prompt, attachment: messageAttachment, modelName: modelToUse });
                updateSamMessage({ text: "Aquí tienes la imagen que generé.", attachment: generatedImage });
            } catch (error) {
                const err = error instanceof Error ? error : new Error("Ocurrió un error desconocido.");
                updateSamMessage({ text: err.message });
                 if (modelToUse === 'sm-i3' || modelToUse === 'sm-l3' || modelToUse === 'sm-l3.9') {
                    setUsage(prev => ({ ...prev, count: Math.max(0, prev.count - 1) }));
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }

        const history = chats.find(c => c.id === tempChatId)?.messages.slice(-10) || [];
        const systemInstruction = generateSystemInstruction(effectiveMode, settings);

        streamGenerateContent({
            prompt,
            systemInstruction,
            attachment: messageAttachment,
            history,
            mode: effectiveMode,
            modelName: modelToUse,
            abortSignal: abortControllerRef.current.signal,
            onUpdate: (chunk) => {
                setChats(prev => prev.map(c => {
                    if (c.id === tempChatId) {
                        return { ...c, messages: c.messages.map(m => m.id === samMessageId ? { ...m, text: m.text + chunk } : m) };
                    }
                    return c;
                }));
            },
            onLogUpdate: (logs) => {
                setChats(prev => prev.map(c => {
                    if (c.id === tempChatId) {
                        return { ...c, messages: c.messages.map(m => m.id === samMessageId ? { ...m, consoleLogs: [...(m.consoleLogs || []), ...logs] } : m) };
                    }
                    return c;
                }));
            },
            onComplete: (fullText, groundingChunks, consoleLogs) => {
                let finalUpdates: Partial<ChatMessage> = { isSearching: false };
                if (groundingChunks) finalUpdates.groundingMetadata = groundingChunks;
                if (effectiveMode === 'math' && consoleLogs) finalUpdates.consoleLogs = consoleLogs;
                updateSamMessage(finalUpdates);
                setIsLoading(false);
            },
            onError: (error) => {
                updateSamMessage({ text: error.message, isSearching: false });
                setIsLoading(false);
                 if (modelToUse === 'sm-i3' || modelToUse === 'sm-l3' || modelToUse === 'sm-l3.9') {
                    setUsage(prev => ({ ...prev, count: Math.max(0, prev.count - 1) }));
                }
            }
        });
    }, [currentChatId, chats, isLoading, currentMode, settings, usage]);

    const handleNewChat = useCallback(() => {
        setActiveView('chat');
        setCurrentChatId(null);
        setCurrentMode('normal');
        setAttachment(null);
        setChatInputText('');
    }, []);

    const handleSelectChat = (id: string) => {
        if (currentChatId !== id) {
             setActiveView('chat');
             setCurrentChatId(id);
             setCurrentMode('normal');
             setChatInputText('');
        }
    }
    
     const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
    };

    const playActivationSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;
    
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
    
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
    
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
        oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
    
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };
    
    const handleModeAction = (mode: ModeID, accept?: string, capture?: string) => {
        if (mode === 'essay') {
            setIsEssayComposerOpen(true);
        } else if (mode === 'photo_upload') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept || 'image/*';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setAttachment({
                            name: file.name,
                            type: file.type,
                            data: event.target?.result as string,
                        });
                    };
                    reader.readAsDataURL(file);
                    setCurrentMode('image');
                }
            };
            input.click();
        } else if (mode === 'camera_capture') {
            setCameraFacingMode(capture as 'user' | 'environment' || 'user');
            setIsCameraOpen(true);
        } else if (mode === 'voice') {
            if (voiceModeState !== 'inactive') return;
            
            playActivationSound();
            setVoiceModeState('activeConversation');
            setLiveTranscription('');
            setVoiceOrbMode('default');
            setExplanationData(null);

            const toolExecutors: AppToolExecutors = {
                setInputText: (text: string) => {
                    setChatInputText(prev => prev + (prev ? ' ' : '') + text);
                },
                sendMessage: () => {
                    // Trigger send message action directly without cursor animation
                     if (chatInputTextRef.current.trim()) {
                         // We need a way to trigger the send function from here
                         const sendButton = document.getElementById('btn-send-message');
                         if(sendButton) sendButton.click();
                     }
                },
                toggleSidebar: (isOpen: boolean) => {
                    setSidebarOpen(isOpen);
                },
                changeMode: (modeRaw: string) => {
                    const mode = normalizeMode(modeRaw);
                    if (!mode) return;

                    if (activeViewRef.current !== 'chat') {
                         setActiveView('chat');
                    }
                    setCurrentMode(mode);
                },
                navigateToView: (view: ViewID) => {
                    setActiveView(view);
                },
                toggleSettings: (isOpen: boolean) => {
                     setIsSettingsModalOpen(isOpen);
                },
                toggleUpdates: (isOpen: boolean) => {
                     setIsUpdatesModalOpen(isOpen);
                },
                toggleCreators: () => {
                    // Functionality removed from sidebar direct toggle in this refactor context, can reopen sidebar if needed
                    setSidebarOpen(true);
                },
                toggleCollaborators: () => {
                     setSidebarOpen(true);
                },
                scrollUi: (target: string, direction: 'up' | 'down') => {
                    let selectorId = '';
                    if (target === 'sidebar') selectorId = 'sidebar-content';
                    if (target === 'chat') selectorId = 'chat-container';
                    if (target === 'settings_content') selectorId = 'settings-content';
                    if (target === 'settings_menu') selectorId = 'settings-menu';
                    
                    const element = document.getElementById(selectorId);
                    if (element) {
                         element.scrollBy({
                            top: direction === 'down' ? 300 : -300,
                            behavior: 'smooth'
                        });
                    }
                },
                readLastMessage: () => {
                    const currentChat = chatsRef.current.find(c => c.id === currentChatIdRef.current);
                    if (!currentChat || currentChat.messages.length === 0) return "No hay mensajes en este chat.";
                    
                    const lastSamMsg = [...currentChat.messages].reverse().find(m => m.author === 'sam');
                    return lastSamMsg ? lastSamMsg.text : "SAM no ha dicho nada aún.";
                },
                visualExplain: (topic: string, points: {title: string, description: string}[]) => {
                    setVoiceOrbMode('explaining');
                    // Delay state update slightly to allow smoother transition and ensure object integrity
                    setTimeout(() => {
                        setExplanationData({ topic, points });
                    }, 100);
                },
                closeVisualExplanation: () => {
                    setVoiceOrbMode('default');
                    setExplanationData(null);
                }
            };
            
            startActiveConversation(
                generateSystemInstruction('voice', settings),
                (isUser, text) => setLiveTranscription(text),
                (userInput, samOutput) => {},
                (error) => { 
                    console.error("Voice error:", error); 
                    setShowVoiceErrorNotification(true);
                    handleEndVoiceSession(); 
                },
                (state) => setActiveConversationState(state),
                (volume) => setVoiceVolume(volume),
                toolExecutors
            ).then(session => {
                activeConversationRef.current = session;
            });
        }
        else {
            setCurrentMode(mode);
        }
    };
    
    useEffect(() => {
        const handleVoiceSend = () => {
            if (chatInputText.trim()) {
                handleSendMessage(chatInputText);
            }
        };
        document.addEventListener('voice-trigger-send', handleVoiceSend);
        return () => document.removeEventListener('voice-trigger-send', handleVoiceSend);
    }, [chatInputText, handleSendMessage]);


    const handleEndVoiceSession = () => {
        activeConversationRef.current?.close();
        activeConversationRef.current = null;
        setVoiceModeState('inactive');
        setLiveTranscription('');
        setVoiceOrbMode('default');
        setExplanationData(null);
    }

    const handleCloseVisualExplanation = () => {
        setVoiceOrbMode('default');
        setExplanationData(null);
        // Optional: If we want to inform the AI that the user closed it manually, we could send a tool response, 
        // but since we are triggering this from UI, we just update state. 
        // The AI session remains active.
    };
    
    const handleSaveEssay = (essay: Essay) => {
        if (editingEssay) {
            setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(msg => msg.id === editingEssay.messageId ? { ...msg, essayContent: essay } : msg)
                    };
                }
                return chat;
            }));
            setEditingEssay(null);
        } else {
            const userMessage: ChatMessage = {id: uuidv4(), author: MessageAuthor.USER, text: `He creado un ensayo sobre "${essay.topic}".`, timestamp: Date.now()};
            const samMessage: ChatMessage = {id: uuidv4(), author: MessageAuthor.SAM, text: `¡Excelente! Aquí está el ensayo que compusimos juntos.`, timestamp: Date.now(), essayContent: essay };
            
            let tempChatId = currentChatId;
            if (!tempChatId) {
                 const newChat: Chat = { id: uuidv4(), title: `Ensayo: ${essay.topic}`, messages: [userMessage, samMessage] };
                 setChats(prev => [newChat, ...prev]);
                 setCurrentChatId(newChat.id);
            } else {
                 setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: [...c.messages, userMessage, samMessage] } : c));
            }
        }
        setIsEssayComposerOpen(false);
    };

    const handleOpenEssay = (essay: Essay, messageId: string) => {
        setEditingEssay({ essay, messageId });
    };

    const handleInsightAction = (action: Insight['actions'][0]) => {
         if (action.type === 'new_chat_with_prompt') {
            const { title, prompt } = action.data as { title: string; prompt: string };
            const newChat: Chat = { id: uuidv4(), title, messages: [] };
            setChats(prev => [newChat, ...prev]);
            setCurrentChatId(newChat.id);
            setActiveView('chat');
            setTimeout(() => handleSendMessage(prompt), 0);
        }
    };
    
    const handleResetApp = useCallback(() => {
        const keysToRemove = [
            'sam-settings',
            'sam-chats',
            'sam-current-chat-id',
            'sam-pinned-artifacts',
            'sam_ia_guest_name',
            'sam-install-notif-dismissed',
            'sam_ia_usage',
            'st_theme_activated',
            'st_notification_shown',
            'sam_ia_preregistered_sml3.9',
            'sam_ia_prereg_email'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        window.location.reload();
    }, []);

    const handleForcedReset = useCallback(() => {
        localStorage.setItem('sam_ia_forced_reset_v1.5', 'true');
        handleResetApp();
    }, [handleResetApp]);

    const handleDismissStNotification = () => {
        setShowStThemeNotification(false);
        localStorage.setItem('st_notification_shown', 'true');
    };

    const handleDeactivateStTheme = () => {
        handleSaveSettings({ ...settings, stThemeEnabled: false });
        setShowStThemeNotification(false);
        localStorage.setItem('st_notification_shown', 'true');
    };
    
    const handleShareFromPhotosam = (prompt: string, image: Attachment) => {
        const samMessage: ChatMessage = {
            id: uuidv4(),
            author: MessageAuthor.SAM,
            text: `Aquí está la imagen generada en *Photosam* con el prompt: "${prompt}"`,
            timestamp: Date.now(),
            attachment: image,
        };

        let tempChatId = currentChatId;
        if (!tempChatId) {
            const newChat: Chat = { id: uuidv4(), title: `Imagen: ${prompt.substring(0, 20)}`, messages: [samMessage] };
            setChats(prev => [newChat, ...prev]);
            setCurrentChatId(newChat.id);
        } else {
            setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: [...c.messages, samMessage] } : c));
        }

        setActiveView('chat');
    };

    const handlePreregistrationSuccess = () => {
        localStorage.setItem('sam_ia_preregistered_sml3.9', 'true');
        setIsPreregisteredForSML3_9(true);
    };


    const lastSamMessage = currentChat?.messages.filter(m => m.author === MessageAuthor.SAM).slice(-1)[0];
    const pinnedArtifactIds = useMemo(() => pinnedArtifacts.map(a => a.id), [pinnedArtifacts]);
    const lastMessage = currentChat?.messages.slice(-1)[0];

    if (showForcedResetModal) {
        return <ForcedResetModal onConfirm={handleForcedReset} />;
    }

    const renderActiveView = () => {
        const secondaryViews: Partial<Record<ViewID, { title: string; component: React.ReactNode }>> = {
            canvas: {
                title: 'Canvas',
                component: <CanvasView pinnedArtifacts={pinnedArtifacts} onOpenArtifact={setActiveArtifact} />
            },
            insights: {
                title: 'Insights',
                component: <InsightsView onAction={handleInsightAction} />
            },
            documentation: {
                title: 'Documentación',
                component: <DocumentationView />
            },
            usage: {
                title: 'Uso',
                component: <UsageView />
            },
            sam_studios: {
                title: 'SAM Studios',
                component: <SamStudios 
                    onNavigateBack={() => setActiveView('chat')} 
                    onOpenApp={(appId) => setActiveView(appId as ViewID)} 
                />
            }
        };

        const viewConfig = secondaryViews[activeView];

        if (viewConfig) {
            if(activeView === 'sam_studios' || activeView === 'insights') {
                 return viewConfig.component;
            }

            return (
                <div className="flex flex-col h-full w-full">
                    <header className="flex-shrink-0 flex items-center gap-2 sm:gap-4 p-2 sm:p-4 border-b border-border-subtle">
                        <button
                            id="btn-toggle-sidebar"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-text-secondary hover:text-text-main md:hidden"
                            aria-label="Toggle sidebar"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <button
                            id={`btn-nav-chat`}
                            onClick={() => setActiveView('chat')}
                            className="p-2 text-text-secondary hover:text-text-main"
                            aria-label="Volver al chat"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-text-main truncate">{viewConfig.title}</h1>
                    </header>
                    {viewConfig.component}
                </div>
            );
        }

        switch (activeView) {
            case 'chat':
                return currentChat ? (
                     <div id="chat-container" className="flex-1 overflow-y-auto p-4">
                        {currentChat.messages.map(msg => (
                            <ChatMessageItem 
                                key={msg.id} 
                                message={msg} 
                                isStreaming={isLoading && lastMessage?.id === msg.id && msg.author === MessageAuthor.SAM}
                                onOpenArtifact={setActiveArtifact}
                                onPinArtifact={(artifact) => {
                                    if (!pinnedArtifacts.some(p => p.id === artifact.id)) {
                                        setPinnedArtifacts(prev => [...prev, artifact]);
                                    }
                                }}
                                onPreviewImage={(attachment) => setPreviewImage(attachment)}
                                onOpenEssay={handleOpenEssay}
                            />
                        ))}
                         <div ref={chatEndRef} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 mb-4 text-text-secondary">
                            <path d="M30 20 L70 20 L70 50 L30 50 L30 80 L70 80" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                            <path d="M10 60 L50 10 L90 60 M25 45 L75 45" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                            <path d="M50 10 L50 90 M30 30 L50 50 L70 30" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                        </svg>
                        <h1 className="text-3xl font-bold">SAM</h1>
                        <p className="text-text-secondary mt-2">Tu asistente de IA amigable y servicial.</p>
                    </div>
                );
            case 'photosam':
                return <Photosam onNavigateBack={() => setActiveView('chat')} onShareToChat={handleShareFromPhotosam} />;
            default:
                return null;
        }
    };

    return (
        <div className={`flex h-screen bg-bg-main font-sans text-text-main ${settings.theme}`}>
            {/* Updated Voice Interface - The Orb */}
            <VoiceOrb
                isActive={voiceModeState === 'activeConversation'}
                state={activeConversationState}
                volume={voiceVolume}
                onClose={handleEndVoiceSession}
                onCloseExplanation={handleCloseVisualExplanation}
                transcription={liveTranscription}
                mode={voiceOrbMode}
                explanationData={explanationData}
            />
            
            <Sidebar 
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                chats={chats}
                currentChatId={currentChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onShowUpdates={() => setIsUpdatesModalOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onShowContextMenu={(chatId, coords) => setContextMenu({ chatId, ...coords })}
                creditsRef={creditsRef}
                verificationPanelRef={verificationPanelRef}
                forceOpenVerificationPanel={false}
                activeView={activeView}
                onSelectView={setActiveView}
            />
            <main className="flex-1 flex flex-col relative overflow-hidden bg-bg-main">
                {renderActiveView()}
                
                 {showVoiceErrorNotification && (
                    <div className="absolute bottom-24 right-4 z-20">
                        <VoiceErrorNotification onDismiss={() => setShowVoiceErrorNotification(false)} />
                    </div>
                )}

                 {showStThemeNotification && (
                    <div className="absolute bottom-24 right-4 z-20">
                         <StThemeNotification
                            onDismiss={handleDismissStNotification}
                            onDeactivate={handleDeactivateStTheme}
                        />
                    </div>
                )}

                {activeView === 'chat' && (
                    <div className="p-4 pt-0 w-full max-w-3xl mx-auto flex flex-col gap-2 mb-6 md:mb-10 relative z-10">
                        {showLimitNotification && (
                            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-3 rounded-xl text-sm flex items-start gap-3 border border-yellow-500/20">
                                <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-semibold">Límite de SM-I3 alcanzado</p>
                                    <p>Has alcanzado tu límite diario para el modelo SM-I3. El límite se restablecerá mañana.</p>
                                </div>
                                <button onClick={() => setShowLimitNotification(false)} className="p-1 -m-1"><XMarkIcon className="w-5 h-5" /></button>
                            </div>
                        )}
                        {currentMode === 'math' && currentChat?.messages.length > 0 && (
                            <MathConsole
                                isOpen={isMathConsoleOpen}
                                onToggle={() => setIsMathConsoleOpen(prev => !prev)}
                                logs={lastSamMessage?.consoleLogs || []}
                            />
                        )}
                        <ChatInput
                            onSendMessage={handleSendMessage}
                            onModeAction={handleModeAction}
                            attachment={attachment}
                            onRemoveAttachment={() => setAttachment(null)}
                            disabled={isLoading}
                            currentMode={currentMode}
                            onResetMode={() => setCurrentMode('normal')}
                            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                            settings={settings}
                            onSaveSettings={handleSaveSettings}
                            voiceModeState={voiceModeState}
                            activeConversationState={activeConversationState}
                            liveTranscription={liveTranscription}
                            onEndVoiceSession={handleEndVoiceSession}
                            usage={usage}
                            isThemeActive={isThemeActive}
                            inputText={chatInputText}
                            onInputTextChange={setChatInputText}
                            isPlusMenuOpen={isPlusMenuOpen}
                            onSetPlusMenuOpen={setIsPlusMenuOpen}
                            isPreregisteredForSML3_9={isPreregisteredForSML3_9}
                            onOpenPreregistrationModal={() => setIsPreregistrationModalOpen(true)}
                        />
                    </div>
                )}
            </main>

            {isSettingsModalOpen && (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    settings={settings}
                    onSave={handleSaveSettings}
                    onClearHistory={() => setChats([])}
                    onExportHistory={() => {
                         const data = JSON.stringify(chats, null, 2);
                         const blob = new Blob([data], { type: 'application/json' });
                         const url = URL.createObjectURL(blob);
                         const link = document.createElement('a');
                         link.href = url;
                         link.download = `sam-history-${new Date().toISOString()}.json`;
                         document.body.appendChild(link);
                         link.click();
                         document.body.removeChild(link);
                    }}
                    onInstallApp={() => {
                        if (installPromptEvent) {
                            installPromptEvent.prompt();
                            installPromptEvent.userChoice.then((choiceResult: any) => {
                                if (choiceResult.outcome === 'accepted') {
                                    setInstallPromptEvent(null);
                                }
                            });
                        }
                    }}
                    installPromptEvent={installPromptEvent}
                    onResetApp={handleForcedReset}
                />
            )}
            
            {isUpdatesModalOpen && (
                <UpdatesModal 
                    isOpen={isUpdatesModalOpen} 
                    onClose={() => setIsUpdatesModalOpen(false)} 
                />
            )}

            {isEssayComposerOpen && (
                <EssayComposer
                    initialEssay={editingEssay?.essay || defaultEssay}
                    onClose={() => { setIsEssayComposerOpen(false); setEditingEssay(null); }}
                    onSave={handleSaveEssay}
                    systemInstruction={generateSystemInstruction('essay', settings)}
                    modelName={settings.defaultModel}
                />
            )}
            
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                         const newTitle = prompt("Nuevo nombre para el chat:");
                         if (newTitle) {
                             setChats(prev => prev.map(c => c.id === contextMenu.chatId ? { ...c, title: newTitle } : c));
                         }
                    }}
                    onDelete={() => {
                         if (window.confirm("¿Eliminar este chat?")) {
                            setChats(prev => prev.filter(c => c.id !== contextMenu.chatId));
                            if (currentChatId === contextMenu.chatId) {
                                handleNewChat();
                            }
                        }
                    }}
                />
            )}
            
             {isCameraOpen && (
                <CameraCaptureModal
                    onClose={() => setIsCameraOpen(false)}
                    onCapture={(dataUrl) => {
                        if (dataUrl) {
                            setAttachment({ name: `camera_capture_${Date.now()}.jpg`, type: 'image/jpeg', data: dataUrl });
                            setCurrentMode('image');
                        }
                        setIsCameraOpen(false);
                    }}
                    initialFacingMode={cameraFacingMode}
                />
            )}
            
            {previewImage && (
                <ImagePreviewModal
                    image={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}
            
             {showInstallNotification && (
                <div className="fixed bottom-4 right-4 z-50">
                    <InstallNotification 
                        onDismiss={() => {
                            setShowInstallNotification(false);
                            localStorage.setItem('sam-install-notif-dismissed', 'true');
                        }}
                        onInstall={() => {
                            if (installPromptEvent) {
                                installPromptEvent.prompt();
                                installPromptEvent.userChoice.then((choiceResult: any) => {
                                    if (choiceResult.outcome === 'accepted') {
                                        setShowInstallNotification(false);
                                    }
                                    setInstallPromptEvent(null);
                                });
                            }
                        }}
                    />
                </div>
            )}
            
             {activeView === 'chat' && <WelcomeTutorial step={0} targetRect={null} />} 

            {isPreregistrationModalOpen && (
                <PreregistrationModal
                    isOpen={isPreregistrationModalOpen}
                    onClose={() => setIsPreregistrationModalOpen(false)}
                    onSuccess={handlePreregistrationSuccess}
                />
            )}

        </div>
    );
};

export default App;
