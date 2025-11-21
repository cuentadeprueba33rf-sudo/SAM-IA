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
import GoogleSignInNotification from './components/GoogleSignInNotification';
import PreregistrationModal from './components/PreregistrationModal';
import ChatMessageItem from './components/ChatMessage';
import VoiceOrb from './components/VoiceOrb';
import SamStudios from './components/SamStudios';
import VoxelToyBox from './components/VoxelToyBox';
import LogicLab from './components/LogicLab';
import EchoRealms from './components/EchoRealms';
import ChronoLense from './components/ChronoLense';
import RealityScanner from './components/RealityScanner';
import AdminBroadcast from './components/AdminBroadcast';
import GlobalNotification from './components/GlobalNotification';
import { streamGenerateContent, generateImage, startActiveConversation, detectObjectsInFrame, AppToolExecutors } from './services/geminiService';
// FIX: import 'auth' from firebase to resolve 'Cannot find name 'auth'' error.
import { onAuthStateChanged, signInWithGoogle, auth } from './services/firebase';
import { subscribeToAnnouncements, GlobalMessage } from './services/firebase';
import { MODES, generateSystemInstruction } from './constants';
import { 
    MessageAuthor, 
    type Chat,
    type ChatMessage, 
    type Attachment, 
    type ModeID, 
    type Settings,
    type Theme,
    type ViewID,
    type Essay,
    type Artifact,
    type UsageTracker
} from './types';
import { DocumentTextIcon } from './components/icons';

type VoiceModeState = 'inactive' | 'activeConversation';
type ActiveConversationState = 'LISTENING' | 'RESPONDING' | 'THINKING';

const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    
    // Core State
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [currentMode, setCurrentMode] = useState<ModeID>('normal');
    const [activeView, setActiveView] = useState<ViewID>('chat');

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState<Attachment | null>(null);
    const [isMathConsoleOpen, setIsMathConsoleOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, chatId: string } | null>(null);
    const [showInstallNotification, setShowInstallNotification] = useState(false);
    const [showSignInNotification, setShowSignInNotification] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
    const [activeEssay, setActiveEssay] = useState<{essay: Essay, messageId: string} | null>(null);
    const [showPreregistrationModal, setShowPreregistrationModal] = useState(false);
    const [isPreregistered, setIsPreregistered] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [globalMessage, setGlobalMessage] = useState<GlobalMessage | null>(null);
    const [inputText, setInputText] = useState("");

    // Voice State
    const [voiceModeState, setVoiceModeState] = useState<VoiceModeState>('inactive');
    const [activeConversationState, setActiveConversationState] = useState<ActiveConversationState>('LISTENING');
    const [liveTranscription, setLiveTranscription] = useState('');
    const [voiceSession, setVoiceSession] = useState<{ close: () => void } | null>(null);
    const [voiceOrbMode, setVoiceOrbMode] = useState<'default' | 'explaining'>('default');
    const [explanationData, setExplanationData] = useState<{ topic: string; points: {title: string, description: string}[] } | null>(null);
    const [voiceOrbVolume, setVoiceOrbVolume] = useState(0);

    // Settings & User State
    const [settings, setSettings] = useState<Settings>({
        theme: 'dark',
        personality: 'default',
        profession: '',
        defaultModel: 'sm-i1',
        quickMode: false,
        stThemeEnabled: false,
    });
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    // --- REFS ---
    const abortControllerRef = useRef<AbortController | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatsRef = useRef(chats);
    const currentChatIdRef = useRef(currentChatId);

    // --- DERIVED STATE ---
    const currentChat = useMemo(() => chats.find(chat => chat.id === currentChatId), [chats, currentChatId]);
    const mathLogs = useMemo(() => currentChat?.messages.flatMap(m => m.consoleLogs || []) || [], [currentChat]);

    // --- USAGE TRACKER (SM-I3) ---
    const [usage, setUsage] = useState<UsageTracker>({ date: '', count: 0, hasAttachment: false });

    // --- LIFECYCLE & DATA PERSISTENCE ---

    useEffect(() => {
        // Load data directly without version check
        loadSettings();
        loadChats();
        loadUsage();
        checkPreregistration();
        
        // PWA Install Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setInstallPromptEvent(e);
            const dismissed = sessionStorage.getItem('install_notif_dismissed');
            if (!dismissed) {
                setShowInstallNotification(true);
            }
        });
        
        // Listen for Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        // Listen for Global Announcements
        const unsubAnnouncements = subscribeToAnnouncements((message) => {
            setGlobalMessage(message);
        });

        return () => {
            unsubscribe();
            unsubAnnouncements();
        };
    }, []);

    useEffect(() => {
        // Sign-in notification logic
        const notifDismissed = sessionStorage.getItem('sam_ia_signin_notif_dismissed');
        if (!currentUser && !notifDismissed) {
            const timer = setTimeout(() => {
                setShowSignInNotification(true);
            }, 10000); // 10 second delay
            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    useEffect(() => {
        // Refs for voice control to access latest state
        chatsRef.current = chats;
        currentChatIdRef.current = currentChatId;
    }, [chats, currentChatId]);

    useEffect(() => {
        localStorage.setItem('sam-chats', JSON.stringify(chats));
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats]);

    useEffect(() => {
        localStorage.setItem('sam-settings', JSON.stringify(settings));
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings]);

    useEffect(() => {
        localStorage.setItem('sam-ia-usage', JSON.stringify(usage));
    }, [usage]);
    
    // --- DATA LOADERS & SAVERS ---

    const loadChats = () => {
        try {
            const savedChats = localStorage.getItem('sam-chats');
            if (savedChats) {
                const parsedChats = JSON.parse(savedChats);
                if (Array.isArray(parsedChats) && parsedChats.length > 0) {
                    setChats(parsedChats);
                    setCurrentChatId(parsedChats[0].id);
                    return;
                }
            }
        } catch (error) {
            console.error("Error loading chats from localStorage:", error);
        }
        handleNewChat(); // Create a new chat if loading fails or no chats exist
    };
    
    const loadSettings = () => {
        try {
            const savedSettings = localStorage.getItem('sam-settings');
            if (savedSettings) {
                setSettings(prev => ({...prev, ...JSON.parse(savedSettings)}));
            }
        } catch (error) {
            console.error("Error loading settings from localStorage:", error);
        }
    };
    
    const loadUsage = () => {
        const today = new Date().toISOString().split('T')[0];
        try {
            const savedUsage = JSON.parse(localStorage.getItem('sam-ia-usage') || '{}');
            if (savedUsage.date === today) {
                setUsage(savedUsage);
            } else {
                setUsage({ date: today, count: 0, hasAttachment: false });
            }
        } catch (e) {
            setUsage({ date: today, count: 0, hasAttachment: false });
        }
    };

    const checkPreregistration = () => {
        const isRegistered = localStorage.getItem('sam_ia_preregistered') === 'true';
        setIsPreregistered(isRegistered);
    };

    // --- CORE HANDLERS ---
    
    const handleNewChat = () => {
        const newChat: Chat = {
            id: uuidv4(),
            title: 'Nuevo Chat',
            messages: [],
        };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        setCurrentMode('normal');
        setActiveView('chat');
        setAttachment(null);
    };

    const handleSendMessage = useCallback(async (prompt: string, messageAttachment: Attachment | undefined = attachment) => {
        if (isGenerating || (!prompt.trim() && !messageAttachment)) return;

        abortControllerRef.current = new AbortController();
        setIsGenerating(true);
        setAttachment(null);
        setInputText("");

        const userMessage: ChatMessage = {
            id: uuidv4(),
            author: MessageAuthor.USER,
            text: prompt,
            timestamp: Date.now(),
            attachment: messageAttachment
        };
        
        const samMessageId = uuidv4();
        const samMessage: ChatMessage = {
            id: samMessageId,
            author: MessageAuthor.SAM,
            text: '',
            timestamp: Date.now(),
            mode: currentMode,
        };
        
        const updatedMessages = [...(currentChat?.messages || []), userMessage, samMessage];
        setChats(prev => prev.map(chat => chat.id === currentChatId ? { ...chat, messages: updatedMessages } : chat));

        // Update usage if SM-I3 is used
        if (settings.defaultModel === 'sm-i3' && !settings.quickMode) {
             setUsage(prev => ({ ...prev, count: prev.count + 1, hasAttachment: !!messageAttachment }));
        }

        const systemInstruction = generateSystemInstruction(currentMode, settings);
        
        await streamGenerateContent({
            prompt: prompt,
            systemInstruction: systemInstruction,
            attachment: messageAttachment,
            history: currentChat?.messages || [],
            mode: currentMode,
            modelName: settings.quickMode ? 'sm-i1' : settings.defaultModel,
            abortSignal: abortControllerRef.current.signal,
            onUpdate: (chunk) => {
                setChats(prev => prev.map(chat => {
                    if (chat.id === currentChatId) {
                        return {
                            ...chat,
                            messages: chat.messages.map(msg => msg.id === samMessageId ? { ...msg, text: msg.text + chunk } : msg)
                        };
                    }
                    return chat;
                }));
            },
            onLogUpdate: (logs) => {
                 setChats(prev => prev.map(chat => {
                    if (chat.id === currentChatId) {
                        return {
                            ...chat,
                            messages: chat.messages.map(msg => msg.id === samMessageId ? { ...msg, consoleLogs: [...(msg.consoleLogs || []), ...logs] } : msg)
                        };
                    }
                    return chat;
                }));
            },
            onComplete: (fullText, groundingChunks, consoleLogs) => {
                 setIsGenerating(false);
                 setChats(prev => prev.map(chat => {
                    if (chat.id === currentChatId) {
                        const finalMessages = chat.messages.map(msg => msg.id === samMessageId ? { ...msg, text: fullText, groundingMetadata: groundingChunks, consoleLogs: consoleLogs } : msg);
                        // Auto-title chat
                        if (chat.title === 'Nuevo Chat' && finalMessages.length < 4) {
                            // Simple auto-titling logic
                            const newTitle = finalMessages.find(m => m.author === MessageAuthor.USER)?.text.substring(0, 30) || 'Chat Titulado';
                            return { ...chat, title: newTitle, messages: finalMessages };
                        }
                        return { ...chat, messages: finalMessages };
                    }
                    return chat;
                }));
            },
            onError: (error) => {
                setIsGenerating(false);
                setChats(prev => prev.map(chat => {
                    if (chat.id === currentChatId) {
                        return { ...chat, messages: chat.messages.map(msg => msg.id === samMessageId ? { ...msg, text: `Error: ${error.message}` } : msg) };
                    }
                    return chat;
                }));
            }
        });

    }, [currentChat, currentChatId, isGenerating, settings, currentMode, attachment]);

    // --- MODE & ACTION HANDLERS ---

    // FIX: Removed '?' from 'capture' parameter as it has a default initializer, which makes it optional by default.
    const handleModeAction = (mode: ModeID, accept?: string, capture: 'user' | 'environment' = 'user') => {
        const modeData = MODES.find(m => m.id === mode);
        if (!modeData) return;

        if (modeData.actionType === 'mode_change') {
            setCurrentMode(mode);
            setAttachment(null);
            setIsPlusMenuOpen(false);
        } else if (modeData.actionType === 'file_upload') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setAttachment({ name: file.name, type: file.type, data: event.target?.result as string });
                        setCurrentMode(modeData.requires || 'normal');
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        } else if (modeData.actionType === 'capture') {
            setCameraFacingMode(capture);
            setIsCameraModalOpen(true);
        } else if (modeData.actionType === 'modal') {
             if(mode === 'essay') {
                setActiveEssay({
                    essay: {
                        topic: '',
                        academicLevel: 'university',
                        tone: 'formal',
                        wordCountTarget: 1000,
                        outline: [],
                        content: {},
                        references: [],
                        status: 'briefing',
                    },
                    messageId: '' // No message yet
                });
            }
        } else if (modeData.actionType === 'voice_input') {
            handleStartVoiceSession();
        }
        setIsPlusMenuOpen(false);
    };

    // --- VOICE SESSION HANDLERS ---
    
    const handleStartVoiceSession = async () => {
        if (voiceSession) return;
        setVoiceModeState('activeConversation');
        setLiveTranscription('');
        
        const systemInstruction = generateSystemInstruction('voice', settings);

        try {
            const session = await startActiveConversation(
                systemInstruction,
                (isUser, text) => {
                    setLiveTranscription(text);
                },
                (userInput, samOutput) => {
                    // This is where you might save turns to history if desired
                },
                (error) => {
                    console.error("Voice error:", error.message);
                    setVoiceModeState('inactive');
                    setVoiceSession(null);
                    alert(error.message); // Show translated error
                },
                (state) => setActiveConversationState(state),
                (volume) => setVoiceOrbVolume(volume),
                toolExecutors
            );
            setVoiceSession(session);
        } catch (e) {
            console.error("Failed to start voice session:", e);
            setVoiceModeState('inactive');
        }
    };
    
    const handleEndVoiceSession = () => {
        voiceSession?.close();
        setVoiceSession(null);
        setVoiceModeState('inactive');
        setVoiceOrbMode('default');
        setExplanationData(null);
    };
    
    // --- TOOL EXECUTORS FOR VOICE CONTROL ---
    const toolExecutors: AppToolExecutors = useMemo(() => ({
        setInputText: (text: string) => setInputText(text),
        sendMessage: () => {
             const currentInput = (document.getElementById('chat-textarea') as HTMLTextAreaElement)?.value || '';
             if (currentInput) {
                handleSendMessage(currentInput, undefined);
             }
        },
        toggleSidebar: (isOpen: boolean) => setIsSidebarOpen(isOpen),
        changeMode: (mode: ModeID) => handleModeAction(mode),
        navigateToView: (view: ViewID) => setActiveView(view),
        toggleSettings: (isOpen: boolean) => setIsSettingsOpen(isOpen),
        toggleUpdates: (isOpen: boolean) => setIsUpdatesOpen(isOpen),
        toggleCreators: () => {},
        toggleCollaborators: () => {},
        scrollUi: (target: string, direction: 'up' | 'down') => {
            const element = document.getElementById(target);
            if (element) {
                element.scrollBy({ top: direction === 'down' ? 300 : -300, behavior: 'smooth' });
            }
        },
        readLastMessage: () => {
            const chat = chatsRef.current.find(c => c.id === currentChatIdRef.current);
            const lastSamMessage = chat?.messages.filter(m => m.author === MessageAuthor.SAM).pop();
            return lastSamMessage?.text || "No hay mensajes anteriores para leer.";
        },
        visualExplain: (topic: string, points: {title: string, description: string}[]) => {
            setVoiceOrbMode('explaining');
            setExplanationData({ topic, points });
        },
        closeVisualExplanation: () => {
            setVoiceOrbMode('default');
            setExplanationData(null);
        }
    }), [handleSendMessage]);
    
    // --- UI & NOTIFICATION HANDLERS ---

    const handleSaveEssay = (essay: Essay, messageId: string) => {
        const newEssayMessage: ChatMessage = {
            id: uuidv4(),
            author: MessageAuthor.SAM,
            text: `Aquí está el ensayo sobre "${essay.topic}".`,
            timestamp: Date.now(),
            essayContent: essay,
        };
        // If we were editing an existing message, replace it. Otherwise, add new.
        if (messageId) {
             setChats(prev => prev.map(chat => chat.id === currentChatId ? {
                ...chat,
                messages: chat.messages.map(msg => msg.id === messageId ? newEssayMessage : msg)
            } : chat));
        } else {
             setChats(prev => prev.map(chat => chat.id === currentChatId ? {
                ...chat,
                messages: [...chat.messages, newEssayMessage]
            } : chat));
        }
        setActiveEssay(null);
    };

    const handleInstallApp = () => {
        if (installPromptEvent) {
            installPromptEvent.prompt();
            setShowInstallNotification(false);
        }
    };

    const handleDismissInstall = () => {
        setShowInstallNotification(false);
        sessionStorage.setItem('install_notif_dismissed', 'true');
    };
    
    const handleDismissSignInNotification = () => {
        setShowSignInNotification(false);
        sessionStorage.setItem('sam_ia_signin_notif_dismissed', 'true');
    };

    const handleSignInFromNotification = async () => {
        try {
            await signInWithGoogle();
            setShowSignInNotification(false); // Hide on successful sign-in
            sessionStorage.setItem('sam_ia_signin_notif_dismissed', 'true'); // Prevent re-showing in this session
        } catch (error) {
            console.error("Sign in failed from notification:", error);
            // Optionally show an error toast to the user
        }
    };
    
    const handlePreregistrationSuccess = () => {
        setIsPreregistered(true);
        localStorage.setItem('sam_ia_preregistered', 'true');
    };

    // --- RENDER LOGIC ---

    const renderActiveView = () => {
        if (activeView === 'chat') {
            if (!currentChat) {
                return (
                     <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-50"><path d="M30 20 L70 20 L70 50 L30 50 L30 80 L70 80" stroke="currentColor" strokeWidth="6"/><path d="M10 60 L50 10 L90 60 M25 45 L75 45" stroke="currentColor" strokeWidth="6"/><path d="M50 10 L50 90 M30 30 L50 50 L70 30" stroke="currentColor" strokeWidth="6"/></svg>
                        <h2 className="text-xl font-bold text-text-main">Selecciona o crea un chat</h2>
                    </div>
                );
            }
             if (currentChat.messages.length === 0) {
                 return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="relative mb-6">
                             <div className="absolute inset-0 bg-gradient-to-tr from-accent to-purple-500 rounded-full blur-2xl opacity-20 -z-10"></div>
                             <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 20 L70 20 L70 50 L30 50 L30 80 L70 80" stroke="currentColor" strokeWidth="6"/><path d="M10 60 L50 10 L90 60 M25 45 L75 45" stroke="currentColor" strokeWidth="6"/><path d="M50 10 L50 90 M30 30 L50 50 L70 30" stroke="currentColor" strokeWidth="6"/></svg>
                        </div>
                        <h1 className="text-3xl font-black text-text-main">SAM IA</h1>
                        <p className="text-text-secondary mt-2">Tu asistente de IA amigable y servicial</p>
                        
                         <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                            {[
                                { title: 'Haz un plan de viaje', prompt: 'Crea un itinerario de 5 días para un viaje a Tokio, enfocado en tecnología y cultura.'},
                                { title: 'Escribe código', prompt: 'Escribe una función de Python para invertir una cadena de texto.'},
                                { title: 'Explica un concepto', prompt: 'Explícame qué es la computación cuántica como si tuviera 15 años.'},
                                { title: 'Redacta un correo', prompt: 'Redacta un correo profesional para pedir una extensión en la fecha de entrega de un proyecto.'}
                            ].map(item => (
                                <button key={item.title} onClick={() => setInputText(item.prompt)} className="text-left p-3 bg-surface-primary hover:bg-surface-secondary border border-border-subtle rounded-lg transition-colors">
                                    <p className="text-sm font-semibold text-text-main">{item.title}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            return (
                <div className="h-full overflow-y-auto px-4" id="chat-container">
                    {currentChat.messages.map((msg, index) => (
                        <ChatMessageItem 
                            key={msg.id}
                            message={msg}
                            isStreaming={isGenerating && index === currentChat.messages.length - 1}
                            onPreviewImage={setIsImagePreviewOpen}
                            onOpenEssay={(essay, msgId) => setActiveEssay({essay, messageId: msgId})}
                            onOpenArtifact={()=>{}}
                            onPinArtifact={()=>{}}
                        />
                    ))}
                    <div ref={chatEndRef} className="h-24" />
                </div>
            );
        }
        if (activeView === 'insights') return <InsightsView onAction={(action) => {
            if (action.type === 'new_chat_with_prompt') {
                handleNewChat();
                // A tiny delay to ensure the new chat is ready before sending message
                setTimeout(() => handleSendMessage(action.data.prompt), 50);
            }
        }} />;
        if (activeView === 'sam_studios') return <SamStudios onNavigateBack={() => setActiveView('chat')} onOpenApp={(appId) => setActiveView(appId as ViewID)} />;
        if (activeView === 'photosam') return <Photosam onNavigateBack={() => setActiveView('sam_studios')} onShareToChat={(prompt, img) => {
            handleNewChat();
            setTimeout(() => handleSendMessage(prompt, img), 50);
        }} />;
         if (activeView === 'voxel_toy_box') return <VoxelToyBox onNavigateBack={() => setActiveView('sam_studios')} />;
         if (activeView === 'logic_lab') return <LogicLab onNavigateBack={() => setActiveView('sam_studios')} />;
         if (activeView === 'echo_realms') return <EchoRealms onNavigateBack={() => setActiveView('sam_studios')} />;
         if (activeView === 'chrono_lense') return <ChronoLense onNavigateBack={() => setActiveView('sam_studios')} />;
         if (activeView === 'reality_scanner') return <RealityScanner onNavigateBack={() => setActiveView('sam_studios')} />;
        return <div className="p-8 text-text-secondary">Contenido de la vista '{activeView}' no implementado.</div>;
    };

    return (
        <div className={`h-full w-full flex overflow-hidden font-sans ${settings.stThemeEnabled ? 'stranger-things-theme' : ''}`}>
            {globalMessage && <GlobalNotification message={globalMessage} onDismiss={() => setGlobalMessage(null)} />}

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                chats={chats}
                currentChatId={currentChatId}
                onNewChat={handleNewChat}
                onSelectChat={(id) => setCurrentChatId(id)}
                onShowUpdates={() => setIsUpdatesOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onShowContextMenu={(chatId, coords) => setContextMenu({ ...coords, chatId })}
                activeView={activeView}
                onSelectView={(view) => setActiveView(view)}
                currentUser={currentUser}
                onOpenAdmin={() => setShowAdminPanel(true)}
            />

            <main className="flex-1 flex flex-col relative bg-bg-main">
                {renderActiveView()}
                
                <div className="absolute bottom-0 left-0 right-0 p-4 w-full max-w-3xl mx-auto flex flex-col gap-2 z-20">
                    {isMathConsoleOpen && <MathConsole logs={mathLogs} isOpen={isMathConsoleOpen} onToggle={() => setIsMathConsoleOpen(false)}/>}
                     <ChatInput 
                        onSendMessage={handleSendMessage}
                        onModeAction={handleModeAction}
                        attachment={attachment}
                        onRemoveAttachment={() => setAttachment(null)}
                        disabled={isGenerating}
                        currentMode={currentMode}
                        onResetMode={() => setCurrentMode('normal')}
                        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                        settings={settings}
                        onSaveSettings={setSettings}
                        voiceModeState={voiceModeState}
                        activeConversationState={activeConversationState}
                        liveTranscription={liveTranscription}
                        onEndVoiceSession={handleEndVoiceSession}
                        usage={usage}
                        isThemeActive={settings.stThemeEnabled}
                        inputText={inputText}
                        onInputTextChange={setInputText}
                        isPlusMenuOpen={isPlusMenuOpen}
                        onSetPlusMenuOpen={setIsPlusMenuOpen}
                        isPreregisteredForSML3_9={isPreregistered}
                        onOpenPreregistrationModal={() => setShowPreregistrationModal(true)}
                     />
                </div>
                 <div className="absolute bottom-4 right-4 z-[60] w-full max-w-sm">
                    {showInstallNotification && (
                        <InstallNotification onDismiss={handleDismissInstall} onInstall={handleInstallApp} />
                    )}
                    {showSignInNotification && (
                         <GoogleSignInNotification 
                            onDismiss={handleDismissSignInNotification} 
                            onSignIn={handleSignInFromNotification} 
                         />
                    )}
                 </div>
            </main>

            {/* --- Modals & Overlays --- */}
            {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} onClearHistory={() => setChats([])} onExportHistory={()=>{}} onInstallApp={handleInstallApp} installPromptEvent={installPromptEvent} />}
            {isUpdatesOpen && <UpdatesModal isOpen={isUpdatesOpen} onClose={() => setIsUpdatesOpen(false)} />}
            {isCameraModalOpen && <CameraCaptureModal onClose={() => setIsCameraModalOpen(false)} onCapture={(data) => { if(data) { setAttachment({name: 'capture.jpg', type: 'image/jpeg', data}); setCurrentMode('image'); } setIsCameraModalOpen(false); }} initialFacingMode={cameraFacingMode} />}
            {isImagePreviewOpen && <ImagePreviewModal image={isImagePreviewOpen} onClose={() => setIsImagePreviewOpen(null)} />}
            {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} onRename={()=>{}} onDelete={()=>{}} />}
            {activeEssay && <EssayComposer initialEssay={activeEssay.essay} onClose={() => setActiveEssay(null)} onSave={(essay) => handleSaveEssay(essay, activeEssay.messageId)} systemInstruction={generateSystemInstruction('essay', settings)} modelName={settings.defaultModel} />}
            {showPreregistrationModal && <PreregistrationModal isOpen={showPreregistrationModal} onClose={() => setShowPreregistrationModal(false)} onSuccess={handlePreregistrationSuccess} />}
            {showAdminPanel && currentUser?.email === 'helpsamia@gmail.com' && <AdminBroadcast onClose={() => setShowAdminPanel(false)} userEmail={currentUser.email} />}
            <VoiceOrb 
                isActive={voiceModeState === 'activeConversation'}
                state={activeConversationState}
                volume={voiceOrbVolume}
                onClose={handleEndVoiceSession}
                transcription={liveTranscription}
                mode={voiceOrbMode}
                explanationData={explanationData}
                onCloseExplanation={() => {
                    setVoiceOrbMode('default');
                    setExplanationData(null);
                }}
            />
        </div>
    );
};

export default App;
