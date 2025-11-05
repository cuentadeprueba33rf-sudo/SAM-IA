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
import EssayCard from './components/EssayComposer';
import CameraCaptureModal from './components/CameraCaptureModal';
import FeatureNotification from './components/FeatureNotification';
import { CodeBracketIcon, GlobeAltIcon, CalculatorIcon, PhotoIcon, DocumentIcon, XMarkIcon } from './components/icons';
import type { Chat, ChatMessage, ModeID, Attachment, Settings, Artifact, Essay, ModelType } from './types';
import { MessageAuthor } from './types';
import { MODES, generateSystemInstruction } from './constants';
import { streamGenerateContent, generateImage } from './services/geminiService';

declare global {
    interface Window {
        showNamePrompt: () => void;
        hideLoadingScreen: () => void;
        renderMath: () => void;
    }
}

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


const App: React.FC = () => {
    const [guestName, setGuestName] = useState('');
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [settings, setSettings] = useState<Settings>({ theme: 'dark', personality: 'default', profession: '' });
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
    const [showFeatureNotification, setShowFeatureNotification] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Initial load effects
    useEffect(() => {
        const name = localStorage.getItem('sam_ia_guest_name');
        const loadedChats = initializeChats(); 

        if (name) {
            setGuestName(name);

            // Returning user: create a temporary chat and make it active.
            const newChat: Chat = { id: uuidv4(), title: "Nuevo chat", messages: [], isTemporary: true };
            const finalChats = [newChat, ...loadedChats.filter(c => !c.isTemporary)];
            setChats(finalChats);
            setCurrentChatId(newChat.id);
            
            const notifDismissed = localStorage.getItem('sam_ia_feature_notif_dismissed');
            if (!notifDismissed) {
                setTimeout(() => {
                    setShowFeatureNotification(true);
                }, 5000);
            }
        } else {
             // New user: load existing chats (or the default one) and set the first as active.
            setChats(loadedChats);
            if (loadedChats.length > 0) {
                setCurrentChatId(loadedChats[0].id);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Persist chats to localStorage
    useEffect(() => {
        // Filter out any unsaved temporary chats before saving
        const chatsToSave = chats.filter(c => !(c.isTemporary && c.messages.length === 0));
        if (chatsToSave.length > 0) {
            localStorage.setItem('sam_ia_chats_guest', JSON.stringify(chatsToSave));
        } else {
            localStorage.removeItem('sam_ia_chats_guest');
        }
    }, [chats]);
    
    useEffect(() => {
        if (currentChatId) {
            localStorage.setItem('sam_ia_current_chat_id_guest', currentChatId);
        }
    }, [currentChatId]);


    // Load settings from localStorage
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('sam-settings');
            if (savedSettings) setSettings(JSON.parse(savedSettings));
        } catch(e) { console.error(e); }
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('sam-settings', JSON.stringify(settings));
        document.documentElement.className = settings.theme;
    }, [settings]);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chats, currentChatId]);

    const currentChat = useMemo(() => {
        return chats.find(c => c.id === currentChatId);
    }, [chats, currentChatId]);

    const messages = useMemo(() => {
        return currentChat?.messages || [];
    }, [currentChat]);
    
    // Render math when messages update
    useEffect(() => {
        if (window.renderMath) {
            // Delay to allow React to paint the DOM
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
            setIsSettingsModalOpen(false); // Close modal after action
        }
    };

    const startEssayGeneration = async (topic: string, chatId: string, messageId: string) => {
        if (abortControllerRef.current?.signal.aborted) return;
        
        const extractJson = (text: string) => {
            const match = text.trim().match(/```json\s*([\s\S]*?)\s*```/);
            return match ? match[1] : text.trim();
        };

        setIsGenerating(true);
        const systemInstruction = generateSystemInstruction('essay', settings);
        
        const updateEssayState = (updates: Partial<Essay>) => {
             setChats(prevChats => prevChats.map(chat => {
                if (chat.id === chatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(msg => {
                            if (msg.id === messageId && msg.essayContent) {
                                return { ...msg, essayContent: { ...msg.essayContent, ...updates } };
                            }
                            return msg;
                        })
                    };
                }
                return chat;
            }));
        };

        // 1. Generate Outline
        await streamGenerateContent({
            prompt: `Generate an outline for the topic: "${topic}"`,
            systemInstruction,
            history: [],
            mode: 'essay',
            modelName: 'gemini-2.5-pro',
            onUpdate: () => {},
            onComplete: async (fullText) => {
                try {
                    const outlineJson = JSON.parse(extractJson(fullText));
                    const outline = outlineJson.outline;
                    updateEssayState({ outline, status: 'writing' });

                    const allSections = [...outline, { title: "References", points: [] }];
                    let currentContent: Record<string, string> = {};

                    for (const section of allSections) {
                         if (abortControllerRef.current?.signal.aborted) throw new Error("Aborted");
                         
                         updateEssayState({ currentSection: section.title });

                         let sectionPrompt = section.title === "References"
                             ? `Generate a list of references or a bibliography for the essay on "${topic}" with the following structure: ${JSON.stringify(outline)}`
                             : `Write the "${section.title}" section for the essay on "${topic}", following this outline: ${JSON.stringify(outline)}`;

                        await streamGenerateContent({
                            prompt: sectionPrompt,
                            systemInstruction,
                            history: [],
                            mode: 'essay',
                            modelName: selectedModel === 'sm-i1' ? 'gemini-2.5-flash' : 'gemini-2.5-pro',
                            onUpdate: (chunk) => {
                                currentContent[section.title] = (currentContent[section.title] || '') + chunk;
                                updateEssayState({ content: { ...currentContent } });
                            },
                            onComplete: (fullSectionText) => {
                                if(section.title === "References") {
                                    try {
                                        const refsJson = JSON.parse(extractJson(fullSectionText));
                                        updateEssayState({ references: refsJson.references, status: 'complete', currentSection: undefined });
                                    } catch(e) { 
                                        console.error("Failed to parse references", e); 
                                        updateEssayState({ status: 'complete', currentSection: undefined }); 
                                    }
                                }
                            },
                            onError: (e) => { throw e; },
                            abortSignal: abortControllerRef.current!.signal
                        });
                    }
                } catch (error) {
                    console.error("Failed to parse outline or generate essay:", error);
                    updateLocalMessage(chatId, messageId, {
                        text: "Hubo un error al generar el ensayo. Por favor, intenta de nuevo.",
                        essayContent: undefined,
                    });
                }
            },
            onError: (error) => {
                updateLocalMessage(chatId, messageId, { text: error.message, author: MessageAuthor.SYSTEM, essayContent: undefined });
            },
            abortSignal: abortControllerRef.current!.signal,
        });

        setIsGenerating(false);
    }


    const handleSendMessage = async (prompt: string, attachedFile?: Attachment) => {
        if (!currentChatId || isGenerating) return;

        // Make temporary chat permanent on first message
        if (currentChat?.isTemporary) {
            setChats(prev => prev.map(c => c.id === currentChatId ? {...c, isTemporary: false} : c));
        }

        setIsGenerating(true);
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const lastMessage = messages[messages.length - 1];
        if(lastMessage?.text.includes('Por favor, introduce el tema para tu ensayo.')) {
            addLocalMessage(currentChatId, { author: MessageAuthor.USER, text: prompt, timestamp: Date.now() });
            updateLocalMessage(currentChatId, lastMessage.id, { text: `Comenzando la redacción del ensayo sobre: *"${prompt}"*` });
            
            const essayMessageId = addLocalMessage(currentChatId, {
                author: MessageAuthor.SAM,
                text: '',
                timestamp: Date.now(),
                essayContent: {
                    topic: prompt,
                    outline: [],
                    content: {},
                    references: [],
                    status: 'outlining',
                },
            });
            await startEssayGeneration(prompt, currentChatId, essayMessageId);
            return;
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
            mode: currentMode,
            generatingArtifact: currentMode === 'canvasdev',
            isSearching: currentMode === 'search',
            consoleLogs: currentMode === 'math' ? [`[INFO] Math mode activated. Verifying prompt...`] : undefined,
        };
        
        if (currentMode === 'image_generation') {
            samMessage.text = 'Generando imagen...';
        }
        
        setChats(prev => prev.map(c => c.id === currentChatId ? {...c, messages: [...c.messages, samMessage]} : c));
        
        const originalMode = currentMode;
        
        setAttachment(null);
        if (['image', 'document', 'image_generation'].includes(currentMode)) {
            setCurrentMode('normal');
        }

        if (originalMode === 'image_generation') {
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

        const systemInstruction = generateSystemInstruction(originalMode, settings);
        const history = messages.filter(m => !m.prelude && !m.essayContent) || [];
        const modelName = selectedModel === 'sm-i1' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
        
        await streamGenerateContent({
            prompt: prompt,
            systemInstruction,
            attachment: attachedFile,
            history,
            mode: originalMode,
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

                if (originalMode === 'canvasdev' && match) {
                    const [, language, filepath, code] = match;
                    newArtifact = { id: uuidv4(), title: filepath || `artifact.${language}`, filepath: filepath || `artifact.${language}`, code: code.trim(), language };
                    finalText = "He creado un componente interactivo para ti. Puedes verlo en la vista previa.";
                }

                if (originalMode === 'math') {
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

    const handleModeAction = (modeId: ModeID) => {
        const mode = MODES.find(m => m.id === modeId);
        if (!mode || !currentChatId) return;
        
        if (modeId === 'image_generation') {
            addLocalMessage(currentChatId, {
                author: MessageAuthor.SYSTEM,
                text: 'La función de crear o editar imágenes aún no está disponible para tu región.',
                timestamp: Date.now(),
            });
            return;
        }

        if (mode.actionType === 'modal' && mode.id === 'essay') {
            addLocalMessage(currentChatId, {
                author: MessageAuthor.SAM,
                text: 'Por favor, introduce el tema para tu ensayo.',
                timestamp: Date.now(),
            });
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
        setSettings(newSettings);
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
        
        return <div className="prose prose-sm dark:prose-invert max-w-none break-words" dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />') }} />;
    };

    const lastSamMessageWithLogs = currentChat?.messages.slice().reverse().find(m => m.author === MessageAuthor.SAM && m.consoleLogs);
    
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
            />
            
            <div className="relative flex-1 flex flex-col h-screen overflow-hidden">
                <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 bg-bg-main/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold truncate text-text-main">{currentChat?.title || 'Chat'}</h1>
                    </div>
                    <div className="font-bold text-xl text-sam-ia tracking-wider">SAM</div>
                </header>

                <main ref={chatContainerRef} className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 pt-24 pb-28">
                     {messages.length === 0 ? (
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
                    <div className="space-y-6">
                        {messages.map(msg => (
                            msg.essayContent ? (
                                <EssayCard key={msg.id} essay={msg.essayContent} />
                            ) : (
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
                                    {msg.author === MessageAuthor.SAM && !msg.prelude && (msg.text || (msg.groundingMetadata && msg.groundingMetadata.length > 0)) && !isGenerating && !msg.generatingArtifact && <MessageActions text={msg.text || ''} groundingMetadata={msg.groundingMetadata} />}
                                </div>
                            </div>
                            )
                        ))}
                    </div>
                    )}
                </main>

                <footer className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-bg-main via-bg-main/95 to-transparent">
                    {currentMode === 'math' && lastSamMessageWithLogs && <MathConsole logs={lastSamMessageWithLogs.consoleLogs || []} isOpen={isMathConsoleOpen} onToggle={() => setIsMathConsoleOpen(!isMathConsoleOpen)} />}
                    <div className="w-full max-w-3xl mx-auto px-4 py-2">
                        {showFeatureNotification && (
                            <FeatureNotification
                                onDismiss={() => setShowFeatureNotification(false)}
                                onDismissPermanently={() => {
                                    localStorage.setItem('sam_ia_feature_notif_dismissed', 'true');
                                    setShowFeatureNotification(false);
                                }}
                            />
                        )}
                        <ChatInput onSendMessage={handleSendMessage} onModeAction={handleModeAction} attachment={attachment} onRemoveAttachment={() => setAttachment(null)} disabled={isGenerating} currentMode={currentMode} onResetMode={() => setCurrentMode('normal')} selectedModel={selectedModel} onSetSelectedModel={setSelectedModel} onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
                        <p className="text-center text-xs text-text-secondary mt-2 px-2">SAM puede cometer errores. Verifica sus respuestas.</p>
                    </div>
                </footer>
            </div>

            {activeArtifact && <CodeCanvas artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />}
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} onSave={handleSaveSettings} onClearHistory={handleClearHistory} />
            <UpdatesModal isOpen={isUpdatesModalOpen} onClose={() => setIsUpdatesModalOpen(false)} />
            {contextMenu && <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}><ContextMenu x={contextMenu.coords.x} y={contextMenu.coords.y} onClose={() => setContextMenu(null)} onRename={() => { const chat = chats.find(c => c.id === contextMenu.chatId); const newTitle = prompt("Enter new chat title:", chat?.title); if (newTitle && newTitle.trim()) { handleRenameChat(contextMenu.chatId, newTitle.trim()); } }} onDelete={() => { if (window.confirm("Are you sure you want to delete this chat?")) { handleDeleteChat(contextMenu.chatId); } }} /></div>}
            <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
            {isCameraModalOpen && <CameraCaptureModal onClose={() => setIsCameraModalOpen(false)} onCapture={handleImageCapture} initialFacingMode={captureMode} />}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <style>{`.prose a { color: var(--color-accent-blue); } .dark .prose code { background-color: #2C2C2E; padding: 2px 4px; border-radius: 4px; } .light .prose code { background-color: #F1F3F4; padding: 2px 4px; border-radius: 4px; } .typing-indicator span { height: 8px; width: 8px; background-color: var(--color-text-secondary); border-radius: 50%; display: inline-block; animation: wave 1.4s infinite ease-in-out; margin: 0 2px; } .typing-indicator span:nth-of-type(1) { animation-delay: -0.4s; } .typing-indicator span:nth-of-type(2) { animation-delay: -0.2s; } @keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-6px); } } .code-spinner { font-family: 'Courier New', Courier, monospace; font-size: 1.5rem; font-weight: bold; display: flex; align-items: center; justify-content: center; color: var(--color-accent); position: relative; width: 28px; height: 28px; } .code-spinner .bracket { animation: pulse 1.5s ease-in-out infinite; } .code-spinner .bracket:last-child { animation-delay: 0.2s; } .code-spinner .slash { animation: rotate-slash 3s linear infinite; display: inline-block; } @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } } @keyframes rotate-slash { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 3s linear infinite; } @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } } .animate-fade-in-up { animation: fade-in-up 0.2s ease-out; }`}</style>
        </div>
    );
};

export default App;