import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatInput from './components/ChatInput';
import SettingsModal from './SettingsModal';
import UpdatesModal from './components/UpdatesModal';
import ContextMenu from './components/ContextMenu';
import CodeCanvas from './components/CodeCanvas';
import EssayComposer from './components/EssayComposer';
import CameraCaptureModal from './components/CameraCaptureModal';
import ImagePreviewModal from './components/ImagePreviewModal';
import MathConsole from './components/MathConsole';
import WelcomeTutorial from './components/WelcomeTutorial';
import StThemeNotification from './components/StThemeNotification';
import InstallNotification from './components/InstallNotification';
import VoiceErrorNotification from './components/VoiceErrorNotification';
import ForcedResetModal from './components/ForcedResetModal'; // Importar el nuevo modal
import ChatMessageItem from './components/ChatMessage'; // Assuming a ChatMessageItem component for rendering messages.
import { streamGenerateContent, generateImage, startActiveConversation, detectMode } from './services/geminiService';
import {
    Chat, ChatMessage, MessageAuthor, Attachment, ModeID, Settings,
    ModelType, Artifact, ViewID, Essay, Insight, UsageTracker
} from './types';
import { generateSystemInstruction } from './constants';
import { BookOpenIcon, MegaphoneIcon, ViewColumnsIcon, AcademicCapIcon, ChatBubbleLeftRightIcon, UsersIcon, ExclamationTriangleIcon, XMarkIcon } from './components/icons';

type VoiceModeState = 'inactive' | 'activeConversation';
type ActiveConversationState = 'LISTENING' | 'RESPONDING';


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

const DUMMY_INSIGHTS: Insight[] = [
    {
        id: '1',
        icon: AcademicCapIcon,
        title: "Crear un Ensayo Académico",
        description: "Utiliza el asistente de IA para generar esquemas, redactar secciones y obtener referencias para tus trabajos.",
        actions: [{ label: "Empezar Ensayo", type: 'new_chat_with_prompt', data: { title: "Nuevo Ensayo", prompt: "Ayúdame a crear un ensayo." } }]
    },
    {
        id: '2',
        icon: ChatBubbleLeftRightIcon,
        title: "Practicar una Entrevista",
        description: "Simula una entrevista de trabajo. SAM puede actuar como entrevistador y darte feedback.",
        actions: [{ label: "Iniciar Simulación", type: 'new_chat_with_prompt', data: { title: "Simulación de Entrevista", prompt: "Actúa como un entrevistador para un puesto de desarrollador de software y hazme preguntas." } }]
    },
    {
        id: '3',
        icon: UsersIcon,
        title: "Explorar Roles en un Debate",
        description: "Pide a SAM que adopte diferentes posturas sobre un tema para entender múltiples perspectivas.",
        actions: [{ label: "Comenzar Debate", type: 'new_chat_with_prompt', data: { title: "Debate sobre IA", prompt: "Vamos a debating sobre los pros y los contras de la inteligencia artificial en la sociedad. Toma la postura a favor." } }]
    }
];

const CanvasView: React.FC<{ pinnedArtifacts: Artifact[], onOpenArtifact: (artifact: Artifact) => void }> = ({ pinnedArtifacts, onOpenArtifact }) => (
    <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-text-main mb-6">Canvas</h1>
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

const InsightsView: React.FC<{ insights: Insight[], onAction: (action: Insight['actions'][0]) => void }> = ({ insights, onAction }) => (
    <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-text-main mb-6">Insights</h1>
        <p className="text-text-secondary mb-8 max-w-2xl">Descubre nuevas formas de utilizar SAM para potenciar tu creatividad, aprendizaje y productividad. Aquí tienes algunas ideas para empezar.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map(insight => (
                <div key={insight.id} className="bg-surface-primary rounded-xl p-6 border border-border-subtle flex flex-col">
                    <div className="bg-surface-secondary p-3 rounded-full w-fit mb-4">
                        <insight.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-bold text-text-main text-lg">{insight.title}</h3>
                    <p className="text-sm text-text-secondary mt-2 flex-1">{insight.description}</p>
                    <div className="mt-6">
                        {insight.actions.map((action, index) => (
                             <button key={index} onClick={() => onAction(action)} className="w-full text-center bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm">
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);


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
    const [isThemeActive, setIsThemeActive] = useState(false); // Tracks if the initial 10-second wait is over
    const [showStThemeNotification, setShowStThemeNotification] = useState(false);

    
    const [usage, setUsage] = useState<UsageTracker>({ date: new Date().toISOString().split('T')[0], count: 0, hasAttachment: false });

    const [voiceModeState, setVoiceModeState] = useState<VoiceModeState>('inactive');
    const [activeConversationState, setActiveConversationState] = useState<ActiveConversationState>('LISTENING');
    const [liveTranscription, setLiveTranscription] = useState<string>('');
    const [isMathConsoleOpen, setIsMathConsoleOpen] = useState(true);


    const abortControllerRef = useRef<AbortController | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const activeConversationRef = useRef<{ close: () => void } | null>(null);
    const creditsRef = useRef<HTMLDivElement>(null);
    const verificationPanelRef = useRef<HTMLDivElement>(null);

    const currentChat = chats.find(c => c.id === currentChatId);

    // ... State and useEffects for loading, saving, etc. ...
    useEffect(() => {
        // Check for forced reset first
        const hasReset = localStorage.getItem('sam_ia_forced_reset_v1.5');
        if (!hasReset) {
            setShowForcedResetModal(true);
            return; // Halt further execution until reset is done
        }

        // Load settings from localStorage
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
        
        // Load Usage Tracker
        try {
            const savedUsage = localStorage.getItem('sam_ia_usage');
            const today = new Date().toISOString().split('T')[0];
            if(savedUsage) {
                const parsedUsage: UsageTracker = JSON.parse(savedUsage);
                if(parsedUsage.date === today) {
                    setUsage(parsedUsage);
                } else {
                    // It's a new day, reset the tracker
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

        // Load chats from localStorage
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
        
        // Load pinned artifacts from localStorage
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

    // This effect handles the 10s theme activation delay, runs only once
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

    // This effect manages the theme class on the body and the notification
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

        if(modelToUse === 'sm-i3') {
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
        
        if (modelToUse === 'sm-i3') {
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
            generatingArtifact: effectiveMode === 'canvasdev',
            isSearching: effectiveMode === 'search',
        };

        setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: [...c.messages, samMessage] } : c));
        setIsLoading(true);
        
        const updateSamMessage = (updates: Partial<ChatMessage>) => {
            setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: c.messages.map(m => m.id === samMessageId ? { ...m, ...updates } : m) } : c));
        };

        if (effectiveMode === 'image_generation') {
             try {
                const generatedImage = await generateImage({ prompt, attachment: messageAttachment });
                updateSamMessage({ text: "Aquí tienes la imagen que generé.", attachment: generatedImage, generatingArtifact: false });
            } catch (error) {
                const err = error instanceof Error ? error : new Error("Error desconocido");
                updateSamMessage({ text: `Lo siento, hubo un error: ${err.message}`, generatingArtifact: false });
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
                let finalUpdates: Partial<ChatMessage> = { generatingArtifact: false, isSearching: false };
                if (groundingChunks) finalUpdates.groundingMetadata = groundingChunks;
                if (effectiveMode === 'math' && consoleLogs) finalUpdates.consoleLogs = consoleLogs;
                if (effectiveMode === 'canvasdev') {
                    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/;
                    const match = fullText.match(codeBlockRegex);
                    if (match) {
                        const artifact: Artifact = {
                            id: uuidv4(),
                            title: `Componente ${Math.floor(Math.random() * 1000)}`,
                            filepath: `component-${Math.floor(Math.random() * 1000)}.html`,
                            code: match[2].trim(),
                            language: match[1],
                        };
                        finalUpdates.artifacts = [artifact];
                    }
                }
                updateSamMessage(finalUpdates);
                setIsLoading(false);
            },
            onError: (error) => {
                updateSamMessage({ text: `Lo siento, hubo un error: ${error.message}`, generatingArtifact: false, isSearching: false });
                setIsLoading(false);
                 if (modelToUse === 'sm-i3') {
                    setUsage(prev => ({ ...prev, count: Math.max(0, prev.count - 1) })); // Revert count on error
                }
            }
        });
    }, [currentChatId, chats, isLoading, currentMode, settings, usage]);

    const handleNewChat = useCallback(() => {
        setActiveView('chat');
        setCurrentChatId(null);
        setCurrentMode('normal');
        setAttachment(null);
    }, []);

    const handleSelectChat = (id: string) => {
        if (currentChatId !== id) {
             setActiveView('chat');
             setCurrentChatId(id);
             setCurrentMode('normal'); // Reset mode when switching chats
        }
    }
    
     const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
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
            
            setShowVoiceErrorNotification(true);

            setVoiceModeState('activeConversation');
            setLiveTranscription('');

            let tempChatId = currentChatId;
            if (!tempChatId) {
                const newChat = { id: uuidv4(), title: "Conversación de Voz", messages: [] };
                setChats(prev => [newChat, ...prev]);
                setCurrentChatId(newChat.id);
                tempChatId = newChat.id;
            }

            startActiveConversation(
                generateSystemInstruction('voice', settings),
                (isUser, text) => setLiveTranscription(text),
                (userInput, samOutput) => {
                    const userMessage: ChatMessage = { id: uuidv4(), author: MessageAuthor.USER, text: userInput, timestamp: Date.now() };
                    const samMessage: ChatMessage = { id: uuidv4(), author: MessageAuthor.SAM, text: samOutput, timestamp: Date.now() };
                    setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: [...c.messages, userMessage, samMessage] } : c));
                },
                (error) => { console.error("Voice error:", error); handleEndVoiceSession(); },
                (state) => setActiveConversationState(state)
            ).then(session => {
                activeConversationRef.current = session;
            });
        }
        else {
            setCurrentMode(mode);
        }
    };
    
    const handleEndVoiceSession = () => {
        activeConversationRef.current?.close();
        activeConversationRef.current = null;
        setVoiceModeState('inactive');
        setLiveTranscription('');
    }
    
    const handleSaveEssay = (essay: Essay) => {
        if (editingEssay) {
            // Update existing message
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
            // Create new messages
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
            // Use a timeout to ensure the state update has propagated before sending the message
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
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Force reload to start fresh
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
        localStorage.setItem('st_notification_shown', 'true'); // Also mark as shown
    };


    // FIX: Replaced .at(-1) with .slice(-1)[0] for compatibility with older TS/JS versions.
    const lastSamMessage = currentChat?.messages.filter(m => m.author === MessageAuthor.SAM).slice(-1)[0];
    const pinnedArtifactIds = useMemo(() => pinnedArtifacts.map(a => a.id), [pinnedArtifacts]);
    const lastMessage = currentChat?.messages.slice(-1)[0];

    if (showForcedResetModal) {
        return <ForcedResetModal onConfirm={handleForcedReset} />;
    }

    return (
        <div className={`flex h-screen bg-bg-main font-sans text-text-main ${settings.theme}`}>
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
                {activeView === 'chat' && currentChat && (
                     <div className="flex-1 overflow-y-auto p-4">
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
                                pinnedArtifactIds={pinnedArtifactIds}
                                onOpenEssay={handleOpenEssay}
                            />
                        ))}
                         <div ref={chatEndRef} />
                    </div>
                )}
                {activeView === 'chat' && !currentChat && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 mb-4 text-text-secondary">
                            <path d="M30 20 L70 20 L70 50 L30 50 L30 80 L70 80" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                            <path d="M10 60 L50 10 L90 60 M25 45 L75 45" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                            <path d="M50 10 L50 90 M30 30 L50 50 L70 30" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                        </svg>
                        <h1 className="text-3xl font-bold">SAM</h1>
                        <p className="text-text-secondary mt-2">Tu asistente de IA amigable y servicial.</p>
                    </div>
                )}
                
                {activeView === 'canvas' && <CanvasView pinnedArtifacts={pinnedArtifacts} onOpenArtifact={setActiveArtifact} />}
                {activeView === 'insights' && <InsightsView insights={DUMMY_INSIGHTS} onAction={handleInsightAction} />}
                
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

                <div className="p-4 pt-0 w-full max-w-3xl mx-auto flex flex-col gap-2">
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
                    {currentMode === 'math' && currentChat?.messages.length && (
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
                    />
                </div>
            </main>

            {isSettingsModalOpen && (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    settings={settings}
                    onSave={handleSaveSettings}
                    onClearHistory={() => { setChats([]); setCurrentChatId(null); setPinnedArtifacts([]); }}
                    onExportHistory={() => { /* export logic */ }}
                    installPromptEvent={installPromptEvent}
                    onInstallApp={() => installPromptEvent?.prompt()}
                    onResetApp={handleResetApp}
                />
            )}
            {isUpdatesModalOpen && <UpdatesModal isOpen={isUpdatesModalOpen} onClose={() => setIsUpdatesModalOpen(false)} />}
            {contextMenu && (
                <ContextMenu
                    {...contextMenu}
                    onClose={() => setContextMenu(null)}
                    onRename={() => { /* rename logic */ }}
                    onDelete={() => {
                        setChats(prev => prev.filter(c => c.id !== contextMenu.chatId));
                        if (currentChatId === contextMenu.chatId) {
                            setCurrentChatId(chats.length > 1 ? chats[0].id : null);
                        }
                    }}
                />
            )}
            {activeArtifact && <CodeCanvas artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />}
            {(isEssayComposerOpen || editingEssay) && (
                <EssayComposer
                    initialEssay={editingEssay ? editingEssay.essay : defaultEssay}
                    onClose={() => { setIsEssayComposerOpen(false); setEditingEssay(null); }}
                    onSave={handleSaveEssay}
                    systemInstruction={generateSystemInstruction('essay', settings)}
                    modelName={settings.defaultModel}
                />
            )}
             {isCameraOpen && (
                <CameraCaptureModal
                    initialFacingMode={cameraFacingMode}
                    onClose={() => setIsCameraOpen(false)}
                    onCapture={(dataUrl) => {
                        if (dataUrl) {
                             setAttachment({
                                name: `capture-${Date.now()}.jpg`,
                                type: 'image/jpeg',
                                data: dataUrl,
                            });
                            setCurrentMode('image');
                        }
                        setIsCameraOpen(false);
                    }}
                />
            )}
            {previewImage && <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />}
        </div>
    );
};

export default App;