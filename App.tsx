import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import WelcomeTutorial from './components/WelcomeTutorial';
import FeatureNotification from './components/FeatureNotification';
import InstallNotification from './components/InstallNotification';
import PremiumNotification from './components/PremiumNotification';
import ChatMessageItem from './components/ChatMessage'; // Assuming a ChatMessageItem component for rendering messages.
import { streamGenerateContent, generateImage, startVoiceSession } from './services/geminiService';
import {
    Chat, ChatMessage, MessageAuthor, Attachment, ModeID, Settings,
    ModelType, Artifact, ViewID, Essay, Insight
} from './types';
import { generateSystemInstruction, SPECIAL_USERS } from './constants';
import { BookOpenIcon, MegaphoneIcon, ViewColumnsIcon, AcademicCapIcon, ChatBubbleLeftRightIcon, UsersIcon } from './components/icons';

const defaultSettings: Settings = {
    theme: 'dark',
    personality: 'default',
    profession: '',
    defaultModel: 'sm-i1',
    isPremiumUnlocked: false,
    accessCode: '',
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
        actions: [{ label: "Comenzar Debate", type: 'new_chat_with_prompt', data: { title: "Debate sobre IA", prompt: "Vamos a debatir sobre los pros y los contras de la inteligencia artificial en la sociedad. Toma la postura a favor." } }]
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
    const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
    const [pinnedArtifacts, setPinnedArtifacts] = useState<Artifact[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
    const [previewImage, setPreviewImage] = useState<Attachment | null>(null);
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
    const [showInstallNotification, setShowInstallNotification] = useState(false);
    const [showPremiumNotification, setShowPremiumNotification] = useState(false);
    const [activeView, setActiveView] = useState<ViewID>('chat');
    const [voiceSession, setVoiceSession] = useState<any>(null);


    const abortControllerRef = useRef<AbortController | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const currentChat = chats.find(c => c.id === currentChatId);

    // ... State and useEffects for loading, saving, etc. ...
    useEffect(() => {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('sam-settings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            if (!parsedSettings.accessCode) {
                parsedSettings.accessCode = `${SPECIAL_USERS[Math.floor(Math.random() * SPECIAL_USERS.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
            }
            setSettings(parsedSettings);
        } else {
             const accessCode = `${SPECIAL_USERS[Math.floor(Math.random() * SPECIAL_USERS.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
            setSettings(prev => ({ ...prev, accessCode }));
        }

        // Load chats from localStorage
        const savedChats = localStorage.getItem('sam-chats');
        if (savedChats) {
            setChats(JSON.parse(savedChats));
        }

        // Load currentChatId
        const savedChatId = localStorage.getItem('sam-current-chat-id');
        if (savedChatId) {
            setCurrentChatId(savedChatId);
        } else if (savedChats) {
            const parsedChats = JSON.parse(savedChats);
            if(parsedChats.length > 0) {
                setCurrentChatId(parsedChats[0].id);
            }
        }
    }, []);

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
        }
    }, [currentChatId]);


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

        let tempChatId = currentChatId;

        // Create new chat if there isn't one
        if (!tempChatId) {
            const newChat: Chat = {
                id: uuidv4(),
                title: prompt.substring(0, 30) || "Nuevo Chat",
                messages: [],
            };
            setChats(prev => [newChat, ...prev]);
            tempChatId = newChat.id;
            setCurrentChatId(newChat.id);
        }

        const userMessage: ChatMessage = {
            id: uuidv4(),
            author: MessageAuthor.USER,
            text: prompt,
            timestamp: Date.now(),
            attachment: messageAttachment ?? undefined,
        };

        const samMessageId = uuidv4();
        const samMessage: ChatMessage = {
            id: samMessageId,
            author: MessageAuthor.SAM,
            text: '',
            timestamp: Date.now(),
            generatingArtifact: currentMode === 'canvasdev',
            isSearching: currentMode === 'search',
        };

        setChats(prev => prev.map(c => c.id === tempChatId ? { ...c, messages: [...c.messages, userMessage, samMessage] } : c));
        setIsLoading(true);
        setAttachment(null); // Clear attachment after sending

        abortControllerRef.current = new AbortController();

        const history = chats.find(c => c.id === tempChatId)?.messages.slice(-10) || [];
        const systemInstruction = generateSystemInstruction(currentMode, settings);
        
        const updateSamMessage = (updates: Partial<ChatMessage>) => {
            setChats(prev => prev.map(c => {
                if (c.id === tempChatId) {
                    return {
                        ...c,
                        messages: c.messages.map(m => m.id === samMessageId ? { ...m, ...updates } : m)
                    };
                }
                return c;
            }));
        };

        if (currentMode === 'image_generation') {
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

        streamGenerateContent({
            prompt,
            systemInstruction,
            attachment: messageAttachment,
            history,
            mode: currentMode,
            modelName: settings.defaultModel,
            abortSignal: abortControllerRef.current.signal,
            onUpdate: (chunk) => {
                setChats(prev => prev.map(c => {
                    if (c.id === tempChatId) {
                        return {
                            ...c,
                            messages: c.messages.map(m => m.id === samMessageId ? { ...m, text: m.text + chunk } : m)
                        };
                    }
                    return c;
                }));
            },
            onComplete: (fullText, groundingChunks) => {
                let finalUpdates: Partial<ChatMessage> = { 
                    generatingArtifact: false, 
                    isSearching: false 
                };
                if(groundingChunks) {
                    finalUpdates.groundingMetadata = groundingChunks;
                }
                // Artifact parsing for canvasdev
                if (currentMode === 'canvasdev') {
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
            }
        });

    }, [currentChatId, chats, isLoading, currentMode, settings]);

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
    
    // ... other handlers
     const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        if (newSettings.isPremiumUnlocked && !settings.isPremiumUnlocked) {
            setShowPremiumNotification(false);
        }
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
        // FIX: The mode ID for voice is 'voice', not 'voice_input'. 'voice_input' is the actionType.
        } else if (mode === 'voice') {
            if(!settings.isPremiumUnlocked) {
                setShowPremiumNotification(true);
                return;
            }
            startVoiceSession(
                generateSystemInstruction('voice', settings),
                () => {}, // onTranscriptionUpdate
                (userInput, samOutput) => { // onTurnComplete
                    const userMessage: ChatMessage = { id: uuidv4(), author: MessageAuthor.USER, text: userInput, timestamp: Date.now() };
                    const samMessage: ChatMessage = { id: uuidv4(), author: MessageAuthor.SAM, text: samOutput, timestamp: Date.now() };
                     setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, userMessage, samMessage] } : c));
                },
                (error) => {
                    console.error("Voice error:", error);
                    // handle error display
                }
            ).then(session => {
                setVoiceSession(session);
            });
        }
        else {
            setCurrentMode(mode);
        }
    };
    
    const handleEndVoiceSession = () => {
        voiceSession?.close();
        setVoiceSession(null);
    }
    
    const handleSaveEssay = (essay: Essay) => {
        const essayText = `*Ensayo sobre: ${essay.topic}*\n\n` + 
            essay.outline.map(s => `**${s.title}**\n${essay.content[s.id]}`).join('\n\n') +
            `\n\n**Referencias**\n` + essay.references.join('\n');
            
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
        setIsEssayComposerOpen(false);
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
                creditsRef={useRef(null)}
                verificationPanelRef={useRef(null)}
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
                                onOpenArtifact={setActiveArtifact}
                                onPinArtifact={(artifact) => setPinnedArtifacts(prev => [...prev, artifact])}
                                onPreviewImage={(attachment) => setPreviewImage(attachment)}
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
                
                <div className="p-4 w-full max-w-3xl mx-auto flex flex-col gap-2">
                    {showPremiumNotification && !settings.isPremiumUnlocked && (
                         <PremiumNotification 
                            onDismiss={() => setShowPremiumNotification(false)}
                            onGoToSettings={() => {
                                setShowPremiumNotification(false);
                                setIsSettingsModalOpen(true);
                            }}
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
                        selectedModel={settings.defaultModel}
                        onSetSelectedModel={(model) => handleSaveSettings({...settings, defaultModel: model})}
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        isVoiceMode={!!voiceSession}
                        onEndVoiceSession={handleEndVoiceSession}
                        settings={settings}
                    />
                </div>
            </main>

            {isSettingsModalOpen && (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    settings={settings}
                    onSave={handleSaveSettings}
                    onClearHistory={() => { setChats([]); setCurrentChatId(null); }}
                    onExportHistory={() => { /* export logic */ }}
                    installPromptEvent={installPromptEvent}
                    onInstallApp={() => installPromptEvent?.prompt()}
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
            {isEssayComposerOpen && (
                <EssayComposer
                    initialEssay={defaultEssay}
                    onClose={() => setIsEssayComposerOpen(false)}
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