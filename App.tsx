import React, { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatInput from './components/ChatInput';
import MessageActions from './components/MessageActions';
import CodeCanvas from './components/CodeCanvas';
import SettingsModal from './SettingsModal';
import ContextMenu from './components/ContextMenu';
import UpdatesModal from './components/UpdatesModal';
import MathConsole from './components/MathConsole';
import ImagePreviewModal from './components/ImagePreviewModal';
import EssayModal from './components/EssayComposer';
import CameraCaptureModal from './components/CameraCaptureModal';
import PremiumNotification from './components/PremiumNotification';
import { CodeBracketIcon, GlobeAltIcon, CalculatorIcon, PhotoIcon, DocumentIcon, XMarkIcon, ViewColumnsIcon, MegaphoneIcon, BookOpenIcon, TrashIcon } from './components/icons';
import type { Chat, ChatMessage, ModeID, Attachment, Settings, Artifact, Essay, ModelType, ViewID, Insight } from './types';
import { MessageAuthor } from './types';
import { MODES, generateSystemInstruction } from './constants';
import { streamGenerateContent, generateImage, startVoiceSession } from './services/geminiService';

declare global {
    interface Window {
        showNamePrompt: () => void;
        hideLoadingScreen: () => void;
        renderMath: () => void;
    }
}

// --- Nuevos Componentes de Vista ---

const CanvasView: React.FC<{ widgets: ChatMessage[], onUnpin: (widgetId: string) => void, onActivateArtifact: (artifact: Artifact) => void }> = ({ widgets, onUnpin, onActivateArtifact }) => {
    if (widgets.length === 0) {
        return (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 -mt-16">
                <ViewColumnsIcon className="w-16 h-16 text-text-secondary/50 mb-4" />
                <h2 className="text-2xl font-semibold mt-4 text-text-main">Tu Canvas está vacío</h2>
                <p className="text-text-secondary max-w-md mt-2">Ancla artefactos de tus conversaciones para verlos aquí. Busca el ícono de pin en los mensajes que contengan código.</p>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {widgets.map(widget => (
                <div key={widget.id} className="bg-surface-primary rounded-xl border border-border-subtle shadow-md flex flex-col animate-fade-in-up">
                    <div className="p-4 border-b border-border-subtle">
                        <p className="text-sm text-text-secondary truncate">{new Date(widget.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="p-4 flex-1">
                        {widget.artifacts && widget.artifacts.map(artifact => (
                            <div key={artifact.id}>
                                <h4 className="font-semibold text-text-main mb-2">{artifact.title}</h4>
                                <pre className="bg-surface-secondary p-3 rounded-lg text-xs overflow-x-auto max-h-48">
                                    <code>{artifact.code.substring(0, 200)}{artifact.code.length > 200 ? '...' : ''}</code>
                                </pre>
                                <button onClick={() => onActivateArtifact(artifact)} className="mt-3 text-sm font-semibold text-accent hover:underline">Ver componente completo</button>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t border-border-subtle">
                        <button onClick={() => onUnpin(widget.id)} className="w-full text-center text-sm text-danger hover:bg-danger/10 p-1.5 rounded-md">Desanclar</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const InsightsView: React.FC<{ insights: Insight[], onAction: (action: Insight['actions'][0]) => void }> = ({ insights, onAction }) => {
     if (insights.length === 0) {
        return (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 -mt-16">
                <MegaphoneIcon className="w-16 h-16 text-text-secondary/50 mb-4" />
                <h2 className="text-2xl font-semibold mt-4 text-text-main">No hay nuevos Insights</h2>
                <p className="text-text-secondary max-w-md mt-2">SAM analizará tus conversaciones y te ofrecerá sugerencias proactivas aquí a medida que uses la aplicación.</p>
            </div>
        )
    }
    return (
        <div className="p-6 space-y-4">
            {insights.map(insight => (
                <div key={insight.id} className="bg-surface-primary rounded-xl border border-border-subtle shadow-md p-5 flex items-start gap-4 animate-fade-in-up">
                    <div className="flex-shrink-0 p-2.5 bg-accent/10 rounded-full mt-1">
                        <insight.icon className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-text-main">{insight.title}</h3>
                        <p className="text-sm text-text-secondary mt-1">{insight.description}</p>
                        <div className="flex items-center gap-2 mt-4">
                            {insight.actions.map(action => (
                                <button key={action.label} onClick={() => onAction(action)} className="text-sm font-semibold text-white bg-accent px-4 py-1.5 rounded-lg hover:opacity-90">
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


const GeneratingArtifactIndicator: React.FC = () => {
    const [status, setStatus] = useState("Inicializando compilación...");
    const statuses = useMemo(() => [
        "Compilando recursos...",
        "Construyendo árbol de componentes...",
        "Aplicando estilos...",
        "Finalizando lógica interactiva...",
    ], []);

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % statuses.length;
            setStatus(statuses[index]);
        }, 1800);
        return () => clearInterval(interval);
    }, [statuses]);

    return (
        <div className="flex items-center gap-3 text-text-secondary p-3 bg-surface-secondary rounded-lg w-full max-w-sm">
            <div className="code-spinner">
                <span className="bracket">&lt;</span>
                <span className="slash">/</span>
                <span className="bracket">&gt;</span>
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-text-main">SAM está construyendo...</span>
                <span className="text-sm text-text-secondary transition-opacity duration-300">{status}</span>
            </div>
        </div>
    );
};

const initializeChats = (): Chat[] => {
    try {
        const savedChats = localStorage.getItem('sam_ia_chats_guest');
        if (savedChats) {
            const parsedChats = JSON.parse(savedChats);
            if (Array.isArray(parsedChats) && parsedChats.length > 0) {
                return parsedChats;
            }
        }
    } catch (e) {
        console.error("Could not load chats, starting fresh.", e);
    }
    return [{ id: uuidv4(), title: "Nuevo chat", messages: [] }];
};

const detectMode = (prompt: string): ModeID | null => {
    const lowerPrompt = prompt.toLowerCase();

    // Improved regex: looks for an action verb, then text, then a dev-related noun. Case-insensitive.
    const canvasDevRegex = /\b(crea|haz|genera|escribe|desarrolla|programa|código para|un componente de|una interfaz)\s.*(botón|formulario|página|web|interfaz|galería|reproductor|html|css|javascript|ui|ux)\b/i;
    if (canvasDevRegex.test(lowerPrompt)) {
        return 'canvasdev';
    }

    const mathRegex = /\b(calcula|resuelve|cuánto es|ecuación|derivada|integral|álgebra|geometría)\b|(\s\d+\s*[\+\-\*\/]\s*\d+)/;
    if (mathRegex.test(lowerPrompt)) {
        return 'math';
    }

    const searchRegex = /\b(busca|quién es|qué es|cuál es la última|noticias sobre|infórmame sobre|encuentra información sobre|investiga)\b/i;
    if (searchRegex.test(lowerPrompt)) {
        return 'search';
    }

    return null;
};


const App: React.FC = () => {
    const [guestName, setGuestName] = useState('');
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [settings, setSettings] = useState<Settings>({ 
        theme: 'dark', 
        personality: 'default', 
        profession: '', 
        defaultModel: 'sm-i1',
        isPremiumUnlocked: false,
        accessCode: '' 
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentMode, setCurrentMode] = useState<ModeID>('normal');
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [selectedModel, setSelectedModel] = useState<ModelType>('sm-i1');
    const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
    const [isMathConsoleOpen, setIsMathConsoleOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<Attachment | null>(null);
    const [contextMenu, setContextMenu] = useState<{ chatId: string; coords: { x: number; y: number; } } | null>(null);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [captureMode, setCaptureMode] = useState<'user' | 'environment'>('user');
    const [isEssayModalOpen, setIsEssayModalOpen] = useState(false);
    const [currentEssay, setCurrentEssay] = useState<Essay | null>(null);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [voiceSession, setVoiceSession] = useState<any>(null);
    const [userTranscription, setUserTranscription] = useState('');
    const [samTranscription, setSamTranscription] = useState('');
    const [activeView, setActiveView] = useState<ViewID>('chat');
    const [widgets, setWidgets] = useState<ChatMessage[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
    const [showPremiumNotification, setShowPremiumNotification] = useState(false);


    const abortControllerRef = useRef<AbortController | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const creditsRef = useRef<HTMLDivElement>(null);
    const verificationPanelRef = useRef<HTMLDivElement>(null);
    
    // Initial load effects
    useEffect(() => {
        const name = localStorage.getItem('sam_ia_guest_name');
        const loadedChats = initializeChats(); 

        if (name) {
            setGuestName(name);

            let finalChats = [...loadedChats];
            let newChatId = loadedChats.length > 0 ? loadedChats[0].id : null;

            if (loadedChats.length === 0 || loadedChats.every(c => c.messages.length > 0 && !c.isTemporary)) {
                 const newChat = { id: uuidv4(), title: "Nuevo chat", messages: [], isTemporary: true };
                 finalChats = [newChat, ...loadedChats];
                 newChatId = newChat.id;
            }

            setChats(finalChats);
            setCurrentChatId(newChatId);

        } else {
             // New user: load existing chats (or the default one) and set the first as active.
            setChats(loadedChats);
            if (loadedChats.length > 0) {
                setCurrentChatId(loadedChats[0].id);
            }
        }
         // Load Widgets & Insights
        try {
            const savedWidgets = localStorage.getItem('sam_ia_canvas_widgets');
            if(savedWidgets) setWidgets(JSON.parse(savedWidgets));
        } catch (e) { console.error("Could not load widgets", e); }
        
        // Placeholder for Insights logic
        setInsights([
            { id: 'insight-1', icon: BookOpenIcon, title: 'Continúa tu investigación', description: 'Parece que has estado investigando sobre "React Hooks". ¿Quieres continuar esa conversación?', actions: [{ label: 'Ir al Chat', type: 'navigate', data: 'chat' }]},
            { id: 'insight-2', icon: CodeBracketIcon, title: 'Crea una plantilla de componente', description: 'He notado que a menudo creas componentes de botón. ¿Quieres que genere una plantilla base para acelerar tu trabajo?', actions: [{ label: 'Crear plantilla', type: 'new_chat_with_prompt', data: { title: 'Plantilla de Botón', prompt: 'Crea un componente de botón reutilizable y moderno con HTML, CSS y JS. Debe tener estados de hover y active.' } }]},
        ]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect to handle the 'Add to Home Screen' prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);
    
    // Persist chats, widgets to localStorage
    useEffect(() => {
        const chatsToSave = chats.filter(c => !(c.isTemporary && c.messages.length === 0));
        if (chatsToSave.length > 0) {
            localStorage.setItem('sam_ia_chats_guest', JSON.stringify(chatsToSave));
        } else {
            localStorage.removeItem('sam_ia_chats_guest');
        }
    }, [chats]);

     useEffect(() => {
        localStorage.setItem('sam_ia_canvas_widgets', JSON.stringify(widgets));
    }, [widgets]);
    
    useEffect(() => {
        if (currentChatId) {
            localStorage.setItem('sam_ia_current_chat_id_guest', currentChatId);
        }
    }, [currentChatId]);


    // Load settings from localStorage
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('sam-settings');
            const name = localStorage.getItem('sam_ia_guest_name') || 'GUEST';
            let currentSettings: Settings;

            if (savedSettings) {
                currentSettings = JSON.parse(savedSettings);
            } else {
                 currentSettings = { 
                    theme: 'dark', 
                    personality: 'default', 
                    profession: '', 
                    defaultModel: 'sm-i1',
                    isPremiumUnlocked: false,
                    accessCode: '' 
                };
            }
            
            if (!currentSettings.accessCode) {
                 const userCode = `SAM-${name.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                 currentSettings.accessCode = userCode;
            }

            if (currentSettings.isPremiumUnlocked && !currentSettings.defaultModel) {
                currentSettings.defaultModel = 'sm-i3';
            } else if (!currentSettings.defaultModel) {
                 currentSettings.defaultModel = 'sm-i1';
            }

            setSettings(currentSettings);
            setSelectedModel(currentSettings.defaultModel);

        } catch(e) { console.error(e); }
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('sam-settings', JSON.stringify(settings));
        document.documentElement.className = settings.theme;
    }, [settings]);
    
    // Effect for the premium unlock notification
    useEffect(() => {
        const hasDismissed = localStorage.getItem('sam_ia_premium_notification_dismissed');
        if (!hasDismissed && !settings.isPremiumUnlocked) {
            setShowPremiumNotification(true);
        }
    }, [settings.isPremiumUnlocked]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chats, currentChatId, userTranscription, samTranscription]);

    const currentChat = useMemo(() => {
        return chats.find(c => c.id === currentChatId);
    }, [chats, currentChatId]);

    const messages = useMemo(() => {
        return currentChat?.messages || [];
    }, [currentChat]);
    
    // Render math when messages update
    useEffect(() => {
        if (window.renderMath) {
            setTimeout(() => window.renderMath(), 100);
        }
    }, [messages]);
    
    useEffect(() => {
        if(currentMode === 'math') {
            setIsMathConsoleOpen(true);
        }
    }, [currentMode]);


    const addLocalMessage = (chatId: string, message: Omit<ChatMessage, 'id'>): string => {
        const newMessageId = uuidv4();
        const newMessage: ChatMessage = { ...message, id: newMessageId };
        setChats(prevChats => prevChats.map(chat =>
            chat.id === chatId
                ? { ...chat, messages: [...chat.messages, newMessage] }
                : chat
        ));
        return newMessageId;
    };

    const updateLocalMessage = (chatId: string, messageId: string, updates: Partial<ChatMessage>) => {
        setChats(prevChats => prevChats.map(chat =>
            chat.id === chatId
                ? { ...chat, messages: chat.messages.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg) }
                : chat
        ));
    };

    const handleNewChat = (switchView = true) => {
        const newChatId = uuidv4();
        const newChat: Chat = {
            id: newChatId,
            title: "Nuevo chat",
            messages: []
        };
        setChats(prev => [newChat, ...prev]);
        if(switchView) {
            setCurrentChatId(newChatId);
            setActiveView('chat');
            setCurrentMode('normal');
            setAttachment(null);
        }
        return newChatId;
    };

    const handleRenameChat = (chatId: string, newTitle: string) => {
        setChats(prev => prev.map(c => c.id === chatId ? {...c, title: newTitle} : c));
    };

    const handleDeleteChat = (chatId: string) => {
        setChats(prev => {
            const newChats = prev.filter(c => c.id !== chatId);
            if (currentChatId === chatId) {
                setCurrentChatId(newChats.length > 0 ? newChats[0].id : null);
            }
            if (newChats.length === 0) {
                const newChatId = uuidv4();
                const newChat: Chat = { id: newChatId, title: "Nuevo chat", messages: [] };
                setCurrentChatId(newChatId);
                return [newChat];
            }
            return newChats;
        });
    };
    
    const handleClearHistory = () => {
        if (window.confirm("¿Estás seguro de que quieres eliminar todos tus chats? Esta acción no se puede deshacer.")) {
            const newChatId = uuidv4();
            const newChat: Chat = { id: newChatId, title: "Nuevo chat", messages: [] };
            setChats([newChat]);
            setCurrentChatId(newChatId);
            localStorage.removeItem('sam_ia_chats_guest');
            setIsSettingsModalOpen(false);
        }
    };
    
     const handlePinMessage = (message: ChatMessage) => {
        setWidgets(prev => {
            if (prev.some(w => w.id === message.id)) return prev;
            return [message, ...prev];
        });
    };

    const handleUnpinWidget = (widgetId: string) => {
        setWidgets(prev => prev.filter(w => w.id !== widgetId));
    };

     const handleInsightAction = (action: Insight['actions'][0]) => {
        if (action.type === 'navigate') {
            setActiveView(action.data as ViewID);
        } else if (action.type === 'new_chat_with_prompt') {
            const { title, prompt } = action.data as { title: string; prompt: string };
            const newChatId = handleNewChat(true);
            handleRenameChat(newChatId, title);
            // Wait for state to update then send message
            setTimeout(() => handleSendMessage(prompt), 100);
        }
    };

    const handleDismissPremiumNotification = () => {
        setShowPremiumNotification(false);
        localStorage.setItem('sam_ia_premium_notification_dismissed', 'true');
    };

    const handleGoToSettingsFromNotification = () => {
        handleDismissPremiumNotification();
        setIsSettingsModalOpen(true);
    };

    const handleSaveEssay = (essay: Essay) => {
        if (!currentChatId) return;
        const essayMessageId = uuidv4();
        const essayMessage: ChatMessage = {
            id: essayMessageId,
            author: MessageAuthor.SAM,
            text: `Aquí está el ensayo completo sobre: *"${essay.topic}"*`,
            timestamp: Date.now(),
            essayContent: { ...essay, status: 'complete' },
        };
        setChats(prev => prev.map(c => 
            c.id === currentChatId 
                ? { ...c, messages: [...c.messages, essayMessage] }
                : c
        ));

        // Make temp chat permanent and rename it
        if (currentChat?.isTemporary) {
            const newTitle = essay.topic.substring(0, 40) + (essay.topic.length > 40 ? '...' : '');
            setChats(prev => prev.map(c => 
                c.id === currentChatId 
                    ? { ...c, isTemporary: false, title: newTitle } 
                    : c
            ));
        }

        setIsEssayModalOpen(false);
        setCurrentEssay(null);
    };

    const handleEndVoiceSession = () => {
        voiceSession?.close();
        setVoiceSession(null);
        setIsVoiceMode(false);
        setUserTranscription('');
        setSamTranscription('');
    };

    const handleModeAction = async (modeId: ModeID) => {
        const mode = MODES.find(m => m.id === modeId);
        if (!mode || !currentChatId) return;
        
        if (mode.actionType === 'voice_input') {
            if (!settings.isPremiumUnlocked) {
                 addLocalMessage(currentChatId, {
                    author: MessageAuthor.SYSTEM,
                    text: 'El chat de voz es una función exclusiva del modelo SM-I3. Puedes activarlo en la configuración con tu código de acceso.',
                    timestamp: Date.now(),
                });
                return;
            }
            try {
                const session = await startVoiceSession(
                    generateSystemInstruction('voice', settings),
                    (isUser, text) => {
                        if (isUser) {
                            setUserTranscription(text);
                        } else {
                            setSamTranscription(text);
                        }
                    },
                    (userInput, samOutput) => {
                        if (currentChatId) {
                            addLocalMessage(currentChatId, {
                                author: MessageAuthor.USER,
                                text: userInput,
                                timestamp: Date.now(),
                                mode: 'voice',
                            });
                             addLocalMessage(currentChatId, {
                                author: MessageAuthor.SAM,
                                text: samOutput,
                                timestamp: Date.now(),
                                mode: 'voice',
                            });
                        }
                        setUserTranscription('');
                        setSamTranscription('');
                    },
                    (error) => {
                        addLocalMessage(currentChatId, {
                            author: MessageAuthor.SYSTEM,
                            text: error.message,
                            timestamp: Date.now(),
                        });
                        handleEndVoiceSession();
                    }
                );
                setVoiceSession(session);
                setIsVoiceMode(true);
            } catch (err) {
                console.error("Failed to start voice session:", err);
                addLocalMessage(currentChatId, {
                    author: MessageAuthor.SYSTEM,
                    text: 'No se pudo iniciar el modo de voz. Asegúrate de tener un micrófono y de haber otorgado los permisos necesarios.',
                    timestamp: Date.now(),
                });
            }
            return;
        }

        if (mode.disabled) {
            addLocalMessage(currentChatId, {
                author: MessageAuthor.SYSTEM,
                text: 'La función de crear o editar imágenes aún no está disponible para tu región.',
                timestamp: Date.now(),
            });
            return;
        }

        if (mode.actionType === 'modal' && mode.id === 'essay') {
            setCurrentEssay({
                topic: '',
                academicLevel: 'university',
                tone: 'formal',
                wordCountTarget: 1000,
                outline: [],
                content: {},
                references: [],
                status: 'briefing',
            });
            setIsEssayModalOpen(true);
            return;
        }

        if (mode.actionType === 'mode_change') {
            setCurrentMode(modeId);
            if (modeId === 'canvasdev') {
                addLocalMessage(currentChatId, {
                    author: MessageAuthor.SAM,
                    prelude: 'Modo Canvas Dev Activado',
                    text: "Puedo generar componentes interactivos con HTML, CSS y JavaScript. Describe lo que quieres construir. Por ejemplo: <em>'Crea un formulario de inicio de sesión con un botón de pulso'</em>.",
                    timestamp: Date.now(),
                });
            }

            if (mode.requires && fileInputRef.current) {
                fileInputRef.current.accept = mode.accept || (mode.requires === 'image' ? 'image/*' : '*/*');
                fileInputRef.current.click();
            }
        } else if (mode.actionType === 'file_upload' && fileInputRef.current) {
            fileInputRef.current.accept = mode.accept || '*/*';
            fileInputRef.current.click();
        } else if (mode.actionType === 'capture') {
            setCaptureMode(mode.capture || 'user');
            setIsCameraModalOpen(true);
        }
    };


    const handleSendMessage = async (prompt: string, attachedFile?: Attachment) => {
        if (!currentChatId || isGenerating) return;

        // Make temporary chat permanent on first message
        if (currentChat?.isTemporary) {
            setChats(prev => prev.map(c => c.id === currentChatId ? {...c, isTemporary: false} : c));
        }

        setIsGenerating(true);
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        
        let modeForThisMessage = currentMode;
        let wasModeAutoDetected = false;
        if (currentMode === 'normal' && !attachedFile) {
            const detectedMode = detectMode(prompt);
            if (detectedMode) {
                modeForThisMessage = detectedMode;
                setCurrentMode(detectedMode);
                wasModeAutoDetected = true;
            }
        }

        const userMessage: Omit<ChatMessage, 'id'> = {
            author: MessageAuthor.USER,
            text: prompt,
            timestamp: Date.now(),
            attachment: attachedFile,
        };
        addLocalMessage(currentChatId, userMessage);

        const samMessageId = uuidv4();
        const samMessage: ChatMessage = {
            id: samMessageId,
            author: MessageAuthor.SAM,
            text: '',
            timestamp: Date.now(),
            mode: modeForThisMessage,
            generatingArtifact: modeForThisMessage === 'canvasdev',
            isSearching: modeForThisMessage === 'search',
            consoleLogs: modeForThisMessage === 'math' ? [`[INFO] Math mode activated. Verifying prompt...`] : undefined,
        };
        
        if (wasModeAutoDetected) {
            const modeData = MODES.find(m => m.id === modeForThisMessage);
            samMessage.prelude = `Modo ${modeData?.title} Activado Automáticamente`;
        }
        
        if (modeForThisMessage === 'image_generation') {
            samMessage.text = 'Generando imagen...';
        }
        
        setChats(prev => prev.map(c => c.id === currentChatId ? {...c, messages: [...c.messages, samMessage]} : c));
        
        setAttachment(null);
        if (['image', 'document', 'image_generation'].includes(modeForThisMessage) && !wasModeAutoDetected) {
            setCurrentMode('normal');
        }

        if (modeForThisMessage === 'image_generation') {
            try {
                const generatedImage = await generateImage({ prompt, attachment: attachedFile });
                updateLocalMessage(currentChatId, samMessageId, {
                    text: attachedFile ? 'Aquí está la imagen editada.' : 'He generado esta imagen para ti.',
                    attachment: generatedImage,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
                updateLocalMessage(currentChatId, samMessageId, { text: errorMessage, author: MessageAuthor.SYSTEM });
            }
            
            setIsGenerating(false);
            return;
        }

        const systemInstruction = generateSystemInstruction(modeForThisMessage, settings);
        const history = messages.filter(m => !m.prelude && !m.essayContent) || [];
        const modelName = selectedModel === 'sm-i1' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
        
        await streamGenerateContent({
            prompt: prompt,
            systemInstruction,
            attachment: attachedFile,
            history,
            mode: modeForThisMessage,
            modelName,
            onUpdate: (chunk) => {
                setChats(prevChats => {
                    return prevChats.map(chat => {
                        if (chat.id === currentChatId) {
                            const updatedMessages = chat.messages.map(msg => {
                                if (msg.id === samMessageId) {
                                    return { ...msg, text: msg.text + chunk, isSearching: false };
                                }
                                return msg;
                            });
                            return { ...chat, messages: updatedMessages };
                        }
                        return chat;
                    });
                });
            },
            onComplete: (fullText, groundingChunks) => {
                const ARTIFACT_REGEX = /```(\w+)\s*(?:([\w.-]+))?\n([\s\S]+?)```/;
                const match = ARTIFACT_REGEX.exec(fullText);
                let newArtifact: Artifact | undefined;
                let finalText = fullText;
                let newLogs: string[] | undefined;

                if (modeForThisMessage === 'canvasdev' && match) {
                    const [, language, filepath, code] = match;
                    newArtifact = { id: uuidv4(), title: filepath || `artifact.${language}`, filepath: filepath || `artifact.${language}`, code: code.trim(), language };
                    finalText = "He creado un componente interactivo para ti. Puedes verlo en la vista previa.";
                }

                if (modeForThisMessage === 'math') {
                    const lines = fullText.split('\n');
                    const logs: string[] = [];
                    const answerParts: string[] = [];
                    lines.forEach(line => {
                        if (line.startsWith('[LOG]')) {
                            logs.push(line);
                        } else {
                            answerParts.push(line);
                        }
                    });
                    finalText = answerParts.join('\n').trim();
                    newLogs = [`[INFO] Math mode activated. Verifying prompt...`, ...logs];
                }

                updateLocalMessage(currentChatId, samMessageId, { 
                    text: finalText, 
                    groundingMetadata: groundingChunks, 
                    artifacts: newArtifact ? [newArtifact] : undefined, 
                    generatingArtifact: false, 
                    isSearching: false,
                    consoleLogs: newLogs,
                });

                if (messages.length < 2 && currentChat?.title === "Nuevo chat") {
                    const newTitle = prompt.substring(0, 40) + (prompt.length > 40 ? '...' : '');
                    handleRenameChat(currentChatId, newTitle);
                }
                setIsGenerating(false);
            },
            onError: (error) => {
                updateLocalMessage(currentChatId, samMessageId, { text: error.message, author: MessageAuthor.SYSTEM, generatingArtifact: false, isSearching: false });
                setIsGenerating(false);
            },
            abortSignal: abortControllerRef.current!.signal,
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAttachment({
                    name: file.name,
                    type: file.type,
                    data: e.target?.result as string,
                });
                if (currentMode !== 'image_generation') {
                    const isImage = file.type.startsWith('image/');
                    setCurrentMode(isImage ? 'image' : 'document');
                }
            };
            reader.readAsDataURL(file);
        }
        if (event.target) event.target.value = '';
    };

    const handleSaveSettings = (newSettings: Settings) => {
        if (newSettings.defaultModel !== settings.defaultModel) {
            setSelectedModel(newSettings.defaultModel);
        }
        setSettings(newSettings);
    };

    const handleExportHistory = () => {
        try {
            const chatsToExport = chats.filter(c => !(c.isTemporary && c.messages.length === 0));
            const dataStr = JSON.stringify(chatsToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.download = `sam-ia-chats-export-${new Date().toISOString().split('T')[0]}.json`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            setIsSettingsModalOpen(false);
        } catch (error) {
            console.error("Failed to export chats:", error);
            alert("Hubo un error al exportar tus chats.");
        }
    };

    const handleImageCapture = (dataUrl: string | null) => {
        if (dataUrl) {
            setAttachment({
                name: `capture-${Date.now()}.jpeg`,
                type: 'image/jpeg',
                data: dataUrl,
            });
            setCurrentMode('image');
        }
        setIsCameraModalOpen(false);
    };
    
    const handleInstallApp = async () => {
        if (!installPromptEvent) {
            return;
        }
        installPromptEvent.prompt();
        // Wait for the user to respond to the prompt
        await installPromptEvent.userChoice;
        setInstallPromptEvent(null);
        setIsSettingsModalOpen(false);
    };

    const renderMessageContent = (message: ChatMessage) => {
        if (message.author === MessageAuthor.SYSTEM) {
            return <p className="text-danger">{message.text}</p>;
        }
        if (message.isSearching) {
            return (
                <div className="flex items-center gap-3 text-text-secondary animate-pulse">
                    <GlobeAltIcon className="w-5 h-5 animate-spin-slow" />
                    <span className="font-medium">Buscando en la web...</span>
                </div>
            );
        }
        if (message.generatingArtifact) return <GeneratingArtifactIndicator />;
        if (message.mode === 'math' && !message.text) return <div className="flex items-center gap-3 text-text-secondary"><CalculatorIcon className="w-5 h-5" /><span className="font-medium">Resolviendo...</span></div>;
        if (message.mode === 'image_generation' && !message.attachment) return <div className="flex items-center gap-3 text-text-secondary animate-pulse"><PhotoIcon className="w-5 h-5" /><span className="font-medium">Generando imagen...</span></div>;
        
        const formattedText = message.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');

        return <div className="prose prose-sm dark:prose-invert max-w-none break-words" dangerouslySetInnerHTML={{ __html: formattedText }} />;
    };

    const lastSamMessageWithLogs = currentChat?.messages.slice().reverse().find(m => m.author === MessageAuthor.SAM && m.consoleLogs);
    
    const getHeaderTitle = () => {
        if (activeView === 'canvas') return 'Canvas';
        if (activeView === 'insights') return 'Insights';
        return currentChat?.title || 'Chat';
    }

    return (
        <div className={`flex h-screen overflow-hidden font-sans bg-bg-main text-text-main ${settings.theme}`}>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                chats={chats}
                currentChatId={currentChatId}
                onNewChat={handleNewChat}
                onSelectChat={(id) => {setCurrentChatId(id);}}
                onShowUpdates={() => setIsUpdatesModalOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onShowContextMenu={(chatId, coords) => setContextMenu({ chatId, coords })}
                creditsRef={creditsRef}
                verificationPanelRef={verificationPanelRef}
                forceOpenVerificationPanel={false}
                activeView={activeView}
                onSelectView={setActiveView}
            />
            
            <div className="relative flex-1 flex flex-col h-screen overflow-hidden">
                <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 bg-bg-main/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold truncate text-text-main">{getHeaderTitle()}</h1>
                    </div>
                    <div className="font-bold text-xl text-sam-ia tracking-wider">SAM</div>
                </header>

                <main ref={chatContainerRef} className="flex-1 flex flex-col overflow-y-auto pt-20">
                     {activeView === 'chat' && (
                        <>
                            {messages.length === 0 && !isVoiceMode ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center -mt-16">
                                    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-sam-ia">
                                        <path d="M30 20 L70 20 L70 50 L30 50 L30 80 L70 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M10 60 L50 10 L90 60 M25 45 L75 45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M50 10 L50 90 M30 30 L50 50 L70 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    <h2 className="text-2xl font-semibold mt-4 text-text-main">Hola, {guestName.split(' ')[0] || 'Invitado'}</h2>
                                    <p className="text-text-secondary">¿Cómo puedo ayudarte hoy?</p>
                                </div>
                            ) : (
                            <div className="space-y-6 p-4 md:p-6 pb-40">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex gap-4 items-start ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-2xl w-full flex flex-col ${msg.author === MessageAuthor.USER ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-2.5 rounded-2xl ${
                                                msg.author === MessageAuthor.USER 
                                                ? 'bg-surface-secondary text-text-main rounded-br-none' 
                                                : msg.prelude ? 'bg-surface-primary border border-border-subtle' : ''
                                            }`}>
                                                {msg.prelude && <div className="flex items-center gap-2 mb-2 text-text-main"><CodeBracketIcon className="w-5 h-5 text-accent"/><p className="font-semibold text-sm">{msg.prelude}</p></div>}
                                                {msg.attachment && (msg.attachment.type.startsWith('image/') ? <img src={msg.attachment.data} alt={msg.attachment.name} className="max-w-xs max-h-48 rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(msg.attachment)}/> : <div className="mb-2 p-3 bg-surface-secondary rounded-lg flex items-center gap-3 text-text-main max-w-xs"><DocumentIcon className="w-6 h-6 text-text-secondary flex-shrink-0" /><span className="text-sm truncate">{msg.attachment.name}</span></div>)}
                                                {(msg.text || msg.generatingArtifact || msg.isSearching || (msg.mode === 'math' && !msg.text) || (msg.mode === 'image_generation' && !msg.attachment)) && renderMessageContent(msg)}
                                                {isGenerating && msg.id === messages[messages.length -1]?.id && !msg.text && !msg.generatingArtifact && !msg.isSearching && msg.mode !== 'math' && msg.mode !== 'image_generation' && <div className="typing-indicator"><span></span><span></span><span></span></div>}
                                                {msg.artifacts && <div className="mt-2">{msg.artifacts.map(artifact => <button key={artifact.id} onClick={() => setActiveArtifact(artifact)} className="bg-surface-secondary hover:bg-border-subtle text-text-main font-medium py-2 px-3 rounded-lg inline-flex items-center gap-2 text-sm"><CodeBracketIcon className="w-5 h-5" /><span>{artifact.title}</span></button>)}</div>}
                                            </div>
                                            {msg.author === MessageAuthor.SAM && !msg.prelude && (msg.text || (msg.groundingMetadata && msg.groundingMetadata.length > 0)) && !isGenerating && !msg.generatingArtifact && <MessageActions message={msg} onPin={() => handlePinMessage(msg)} text={msg.text || ''} groundingMetadata={msg.groundingMetadata} />}
                                        </div>
                                    </div>
                                ))}
                                {isVoiceMode && (
                                    <>
                                        {userTranscription && (
                                            <div className="flex gap-4 items-start justify-end">
                                                <div className="max-w-2xl w-full flex flex-col items-end">
                                                    <div className="px-4 py-2.5 rounded-2xl bg-surface-secondary text-text-main rounded-br-none opacity-60">
                                                        {userTranscription}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {samTranscription && (
                                            <div className="flex gap-4 items-start justify-start">
                                                <div className="max-w-2xl w-full flex flex-col items-start">
                                                    <div className="px-4 py-2.5 rounded-2xl opacity-60">
                                                        {samTranscription}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            )}
                        </>
                     )}
                     {activeView === 'canvas' && <CanvasView widgets={widgets} onUnpin={handleUnpinWidget} onActivateArtifact={setActiveArtifact} />}
                     {activeView === 'insights' && <InsightsView insights={insights} onAction={handleInsightAction} />}
                </main>

                {activeView === 'chat' && (
                    <footer className="absolute bottom-8 left-0 right-0 z-10 bg-gradient-to-t from-bg-main via-bg-main/95 to-transparent">
                        {currentMode === 'math' && lastSamMessageWithLogs && <MathConsole logs={lastSamMessageWithLogs.consoleLogs || []} isOpen={isMathConsoleOpen} onToggle={() => setIsMathConsoleOpen(!isMathConsoleOpen)} />}
                        <div className="w-full max-w-3xl mx-auto px-4 py-2">
                             {showPremiumNotification && (
                                <div className="mb-2">
                                    <PremiumNotification
                                        onDismiss={handleDismissPremiumNotification}
                                        onGoToSettings={handleGoToSettingsFromNotification}
                                    />
                                </div>
                            )}
                            <ChatInput onSendMessage={handleSendMessage} onModeAction={handleModeAction} attachment={attachment} onRemoveAttachment={() => setAttachment(null)} disabled={isGenerating} currentMode={currentMode} onResetMode={() => setCurrentMode('normal')} selectedModel={selectedModel} onSetSelectedModel={setSelectedModel} onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} isVoiceMode={isVoiceMode} onEndVoiceSession={handleEndVoiceSession} settings={settings} />
                            <p className="text-center text-xs text-text-secondary mt-2 px-2">SAM puede cometer errores. Verifica sus respuestas.</p>
                        </div>
                    </footer>
                )}
            </div>

            {activeArtifact && <CodeCanvas artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />}
            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setIsSettingsModalOpen(false)} 
                settings={settings} 
                onSave={handleSaveSettings} 
                onClearHistory={handleClearHistory} 
                onExportHistory={handleExportHistory} 
                onInstallApp={handleInstallApp}
                installPromptEvent={installPromptEvent}
            />
            <UpdatesModal isOpen={isUpdatesModalOpen} onClose={() => setIsUpdatesModalOpen(false)} />
            {contextMenu && <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}><ContextMenu x={contextMenu.coords.x} y={contextMenu.coords.y} onClose={() => setContextMenu(null)} onRename={() => { const chat = chats.find(c => c.id === contextMenu.chatId); const newTitle = prompt("Enter new chat title:", chat?.title); if (newTitle && newTitle.trim()) { handleRenameChat(contextMenu.chatId, newTitle.trim()); } }} onDelete={() => { if (window.confirm("Are you sure you want to delete this chat?")) { handleDeleteChat(contextMenu.chatId); } }} /></div>}
            <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
            {isCameraModalOpen && <CameraCaptureModal onClose={() => setIsCameraModalOpen(false)} onCapture={handleImageCapture} initialFacingMode={captureMode} />}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            {isEssayModalOpen && currentEssay && (
                <EssayModal
                    initialEssay={currentEssay}
                    onClose={() => { setIsEssayModalOpen(false); setCurrentEssay(null); }}
                    onSave={handleSaveEssay}
                    systemInstruction={generateSystemInstruction('essay', settings)}
                    modelName={selectedModel === 'sm-i1' ? 'gemini-2.5-flash' : 'gemini-2.5-pro'}
                />
            )}

            <style>{`.prose a { color: var(--color-accent-blue); } .prose strong { color: var(--color-text-main); } .dark .prose code { background-color: #2C2C2E; padding: 2px 4px; border-radius: 4px; } .light .prose code { background-color: #F1F3F4; padding: 2px 4px; border-radius: 4px; } .typing-indicator span { height: 8px; width: 8px; background-color: var(--color-text-secondary); border-radius: 50%; display: inline-block; animation: wave 1.4s infinite ease-in-out; margin: 0 2px; } .typing-indicator span:nth-of-type(1) { animation-delay: -0.4s; } .typing-indicator span:nth-of-type(2) { animation-delay: -0.2s; } @keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-6px); } } .code-spinner { font-family: 'Courier New', Courier, monospace; font-size: 1.5rem; font-weight: bold; display: flex; align-items: center; justify-content: center; color: var(--color-accent); position: relative; width: 28px; height: 28px; } .code-spinner .bracket { animation: pulse 1.5s ease-in-out infinite; } .code-spinner .bracket:last-child { animation-delay: 0.2s; } .code-spinner .slash { animation: rotate-slash 3s linear infinite; display: inline-block; } @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } } @keyframes rotate-slash { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 3s linear infinite; } @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } } .animate-fade-in-up { animation: fade-in-up 0.2s ease-out; }`}</style>
        </div>
    );
};

export default App;