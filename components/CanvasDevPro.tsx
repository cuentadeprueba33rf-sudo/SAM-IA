import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
    ChevronLeftIcon, 
    SparklesIcon, 
    ArrowPathIcon, 
    ArrowUpIcon, 
    MicrophoneIcon, 
    PlusIcon,
    ShareIcon,
    EllipsisVerticalIcon,
    ClockIcon,
    CodeBracketIcon,
    XMarkIcon,
    TrashIcon,
} from './icons';
import { improvePrompt, generateCanvasDevCode } from '../services/geminiService';


enum Author { USER, AI }

interface Message {
  id: number;
  author: Author;
  text?: string;
  component?: React.ReactNode;
}

type Project = {
    id: string;
    name: string;
    code: string;
};

const AnimatedStar: React.FC = () => {
    useEffect(() => {
        if (typeof window.anime !== 'undefined') {
            window.anime({
                targets: '#dev-pro-star path',
                strokeDashoffset: [window.anime.setDashoffset, 0],
                easing: 'easeInOutSine',
                duration: 2500,
                delay: 200,
                loop: true,
                direction: 'alternate',
            });
             window.anime({
                targets: '#dev-pro-star',
                rotate: '1turn',
                easing: 'linear',
                duration: 30000,
                loop: true,
            });
        }
    }, []);

    return (
        <svg id="dev-pro-star" className="w-24 h-24 text-text-secondary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50,10 C20,40 20,60 50,90 C80,60 80,40 50,10 Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

interface CanvasDevProProps {
  onNavigateBack: () => void;
  onShareToChat: (title: string, code: string) => void;
}

const CanvasDevPro: React.FC<CanvasDevProProps> = ({ onNavigateBack, onShareToChat }) => {
    const [projectName, setProjectName] = useState('Canvas Dev Pro');
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImproving, setIsImproving] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat');
    const [previewContent, setPreviewContent] = useState<string>('');
    const [projectHistory, setProjectHistory] = useState<Project[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isComponentViewerOpen, setIsComponentViewerOpen] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedHistory = localStorage.getItem('canvas-dev-pro-history');
        if (savedHistory) {
            setProjectHistory(JSON.parse(savedHistory));
        }
    }, []);

    useEffect(() => {
        if (projectHistory.length > 0) {
            localStorage.setItem('canvas-dev-pro-history', JSON.stringify(projectHistory));
        }
    }, [projectHistory]);

    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [chatInput, adjustTextareaHeight]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const typeImprovedPrompt = (text: string) => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                setChatInput(text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(interval);
                 textareaRef.current?.focus();
            }
        }, 10);
    };
    
    const generateCode = async (prompt: string) => {
        setIsLoading(true);
        setMessages(prev => [...prev, { id: Date.now(), author: Author.AI, text: 'Entendido. Estoy preparando todo para empezar a construir...' }]);
        
        try {
            const generatedHtml = await generateCanvasDevCode(prompt);
            setPreviewContent(generatedHtml);
            
            const newProject: Project = { id: uuidv4(), name: projectName, code: generatedHtml };
            setProjectHistory(prev => [newProject, ...prev.filter(p => p.name !== projectName)].slice(0, 10));

            setMessages(prev => prev.map(m => m.text?.includes('preparando todo') ? { ...m, text: `¡Listo! He creado una primera versión de tu proyecto: *${projectName}*. Puedes verla en la pestaña de "Preview".` } : m));
            setActiveTab('preview');
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Ocurrió un error desconocido.");
            setPreviewContent(`<html><body><div style="font-family: sans-serif; padding: 1rem; color: #333;"><h2>Error</h2><p>${err.message}</p></div></body></html>`);
            setActiveTab('preview');
            setMessages(prev => prev.map(m => m.text?.includes('preparando todo') ? { ...m, text: `Lo siento, no pude generar el código. ${err.message}` } : m));
        } finally {
            setIsLoading(false);
        }
    };

    const handleImprovePrompt = async (originalPrompt: string) => {
        setIsImproving(true);
        setMessages(prev => prev.filter(m => !m.component));
        setMessages(prev => [...prev, { id: Date.now(), author: Author.AI, text: 'De acuerdo, estoy mejorando tu idea...' }]);

        try {
            const improved = await improvePrompt(originalPrompt);
            typeImprovedPrompt(improved);
            setMessages(prev => prev.map(m => m.text?.includes('mejorando tu idea') ? { ...m, text: 'He redefinido tu prompt en el cuadro de texto de abajo. ¡Puedes editarlo y enviarlo cuando quieras!' } : m));
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Ocurrió un error desconocido.");
            setMessages(prev => prev.map(m => m.text?.includes('mejorando tu idea') ? { ...m, text: err.message } : m));
        } finally {
            setIsImproving(false);
        }
    };

    const handleUsePrompt = (prompt: string) => {
        setProjectName(prompt.substring(0, 40));
        setMessages(prev => prev.filter(m => !m.component));
        generateCode(prompt);
    };
    
    const handleSendMessage = () => {
        const prompt = chatInput.trim();
        if (prompt === '' || isLoading || isImproving) return;

        const newUserMessage: Message = { id: Date.now(), author: Author.USER, text: prompt };
        
        if (messages.length === 0) {
            setProjectName(prompt.substring(0, 40));
            const choiceMessage: Message = {
                id: Date.now() + 1,
                author: Author.AI,
                component: (
                    <div className="p-2 space-y-2">
                        <p className="text-sm text-text-secondary">Recibido. ¿Qué quieres hacer con este prompt?</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={() => handleUsePrompt(prompt)} className="flex-1 bg-surface-primary border border-border-subtle text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-border-subtle">Usar mi prompt</button>
                            <button onClick={() => handleImprovePrompt(prompt)} className="flex-1 bg-accent text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:opacity-90 flex items-center justify-center gap-2">
                                <SparklesIcon className="w-4 h-4" />
                                Mejorar mi prompt
                            </button>
                        </div>
                    </div>
                )
            };
            setMessages([newUserMessage, choiceMessage]);
        } else {
            setProjectName(prompt.substring(0, 40));
            setMessages(prev => [...prev, newUserMessage]);
            generateCode(prompt);
        }

        setChatInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSuggestionClick = (prompt: string) => {
        setChatInput(prompt);
        textareaRef.current?.focus();
    };

    const loadProject = (project: Project) => {
        setProjectName(project.name);
        setPreviewContent(project.code);
        setMessages([{ id: Date.now(), author: Author.AI, text: `Proyecto cargado: *${project.name}*` }]);
        setActiveTab('preview');
        setIsHistoryOpen(false);
    };

    const handleShare = () => {
        if(previewContent) {
            onShareToChat(projectName, previewContent);
        }
    };

    const renderMainContent = () => {
        if (messages.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
                    <div className="flex items-center justify-between w-full max-w-md mb-4">
                        <div className="flex items-center gap-3 text-lg font-medium text-text-main">
                            <SparklesIcon className="w-6 h-6 text-accent-blue" />
                            <span>Code assistant</span>
                        </div>
                        <button className="p-1 rounded-full text-text-secondary hover:bg-surface-secondary">
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <AnimatedStar />
    
                    <p className="max-w-sm mt-6 text-text-secondary">
                        Añade nuevas funciones o modifica fácilmente esta app con un prompt o las sugerencias de abajo.
                    </p>
    
                    <div className="flex flex-col items-center gap-3 mt-8">
                        {[
                            'Añadir zoom a las fotos al hacer clic', 
                            'Animar las entradas de la galería', 
                            'Añadir esqueletos de carga para imágenes', 
                            'Implementar carga perezosa para fotos', 
                            'Añadir filtro por artista'
                        ].map(text => (
                            <button key={text} onClick={() => handleSuggestionClick(text)} className="bg-surface-primary border border-border-subtle px-4 py-2.5 rounded-full text-sm font-medium hover:border-text-main hover:text-text-main transition-colors w-80 text-center">{text}</button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
             <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {activeTab === 'chat' ? (
                    <div className="space-y-4">
                        {messages.map(msg => (
                           <div key={msg.id} className={`flex w-full ${msg.author === Author.USER ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.author === Author.USER ? 'bg-accent/10 text-text-main' : 'bg-surface-secondary text-text-main'}`}>
                                   {msg.text ? <p className="whitespace-pre-wrap">{msg.text}</p> : msg.component}
                               </div>
                           </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-md lg:max-w-lg p-3 rounded-2xl bg-surface-secondary flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-accent animate-pulse"/>
                                    <span className="text-sm text-text-secondary">Pensando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                ) : (
                    <div className="w-full h-full bg-white rounded-lg border border-border-subtle">
                        <iframe srcDoc={previewContent} title="Preview" className="w-full h-full border-0 rounded-lg" sandbox="allow-scripts"/>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-bg-main text-text-main">
            <header className="flex items-center p-4 border-b border-border-subtle flex-shrink-0">
                <button onClick={onNavigateBack} className="p-2 rounded-full hover:bg-surface-secondary">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold ml-4 flex-1 truncate">{projectName}</h1>
                <div className="relative">
                    <button onClick={() => setIsHistoryOpen(p => !p)} className="p-2 rounded-full hover:bg-surface-secondary">
                        <ClockIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                    {isHistoryOpen && <HistoryPanel history={projectHistory} onLoad={loadProject} onClear={() => { setProjectHistory([]); localStorage.removeItem('canvas-dev-pro-history'); }} onClose={() => setIsHistoryOpen(false)} />}
                </div>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden">
                {renderMainContent()}
            </main>

            <footer className="p-4 w-full max-w-3xl mx-auto flex-shrink-0">
                {activeTab !== 'preview' && (
                    <div className="flex items-end bg-surface-primary rounded-2xl p-2.5 gap-2 shadow-lg border border-border-subtle">
                        <textarea 
                            ref={textareaRef}
                            placeholder={messages.length === 0 ? "Make changes, add new features, ask for anything" : "Haz cambios, añade funciones, pregunta lo que sea..."}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-transparent resize-none outline-none text-text-main p-1.5 max-h-32"
                            rows={1}
                            disabled={isLoading || isImproving}
                        />
                        <div className="flex items-center self-end">
                            <button className="p-2 text-text-secondary hover:text-text-main disabled:opacity-50" disabled={isLoading || isImproving}><MicrophoneIcon className="w-5 h-5"/></button>
                            <button className="p-2 text-text-secondary hover:text-text-main disabled:opacity-50" disabled={isLoading || isImproving}><PlusIcon className="w-5 h-5"/></button>
                            <button onClick={handleSendMessage} disabled={!chatInput.trim() || isLoading || isImproving} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-text-main text-bg-main disabled:bg-surface-secondary disabled:text-text-secondary">
                                <ArrowUpIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
                
                {messages.length > 0 && (
                    <div className={`flex items-center justify-between px-2 ${activeTab !== 'preview' ? 'mt-3' : ''}`}>
                        <button onClick={handleShare} disabled={!previewContent} className="p-2 text-text-secondary hover:text-text-main disabled:opacity-50"><ShareIcon className="w-5 h-5"/></button>
                        <div className="flex items-center bg-surface-secondary p-1 rounded-full text-sm font-semibold">
                            <button 
                                onClick={() => setActiveTab('chat')} 
                                className={`px-6 py-1.5 rounded-full transition-colors ${activeTab === 'chat' ? 'bg-surface-primary shadow' : 'text-text-secondary'}`}
                            >
                                Chat
                            </button>
                            <button 
                                onClick={() => setActiveTab('preview')} 
                                className={`px-6 py-1.5 rounded-full transition-colors ${activeTab === 'preview' ? 'bg-surface-primary shadow' : 'text-text-secondary'}`}
                            >
                                Preview
                            </button>
                        </div>
                        <button onClick={() => setIsComponentViewerOpen(true)} disabled={!previewContent} className="p-2 text-text-secondary hover:text-text-main disabled:opacity-50"><EllipsisVerticalIcon className="w-5 h-5"/></button>
                    </div>
                )}
            </footer>
            
            {isComponentViewerOpen && <ComponentViewerModal code={previewContent} onClose={() => setIsComponentViewerOpen(false)} />}
        </div>
    );
};

// --- Internal Components ---

const HistoryPanel: React.FC<{
    history: Project[];
    onLoad: (project: Project) => void;
    onClear: () => void;
    onClose: () => void;
}> = ({ history, onLoad, onClear, onClose }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={panelRef} className="absolute top-full right-0 mt-2 w-72 bg-surface-primary rounded-lg shadow-xl border border-border-subtle z-10 p-2 flex flex-col">
            <div className="flex justify-between items-center p-2">
                <h4 className="font-semibold text-sm text-text-main">Historial</h4>
                {history.length > 0 && <button onClick={onClear} className="text-xs text-danger hover:underline">Limpiar</button>}
            </div>
            {history.length > 0 ? (
                <ul className="max-h-64 overflow-y-auto space-y-1">
                    {history.map(proj => (
                        <li key={proj.id}><button onClick={() => onLoad(proj)} className="w-full text-left p-2 rounded hover:bg-surface-secondary text-sm truncate">{proj.name}</button></li>
                    ))}
                </ul>
            ) : (
                <p className="p-4 text-center text-sm text-text-secondary">No hay proyectos recientes.</p>
            )}
        </div>
    );
};

const parseCode = (fullHtml: string) => {
    const styleMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/);
    const scriptMatch = fullHtml.match(/<script>([\s\S]*?)<\/script>/);
    const bodyMatch = fullHtml.match(/<body>([\s\S]*?)<\/body>/);

    const css = styleMatch ? styleMatch[1].trim() : '/* No custom CSS found */';
    const js = scriptMatch ? scriptMatch[1].trim() : '// No custom JavaScript found';
    const html = bodyMatch ? bodyMatch[1].trim() : '<!-- No body content found -->';

    return { html, css, js };
};

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
    <pre className="h-full overflow-auto bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300">
        <code>{code}</code>
    </pre>
);

const ComponentViewerModal: React.FC<{ code: string; onClose: () => void }> = ({ code, onClose }) => {
    const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
    const { html, css, js } = parseCode(code);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface-primary w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl border border-border-subtle flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                        <CodeBracketIcon className="w-6 h-6 text-accent" />
                        <h3 className="font-semibold text-lg text-text-main">Visor de Componentes</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-secondary"><XMarkIcon className="w-5 h-5 text-text-secondary" /></button>
                </header>
                <div className="p-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveTab('html')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'html' ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-secondary'}`}>HTML</button>
                        <button onClick={() => setActiveTab('css')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'css' ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-secondary'}`}>CSS</button>
                        <button onClick={() => setActiveTab('js')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'js' ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-secondary'}`}>JavaScript</button>
                    </div>
                </div>
                <main className="flex-1 overflow-hidden">
                    {activeTab === 'html' && <CodeBlock code={html} />}
                    {activeTab === 'css' && <CodeBlock code={css} />}
                    {activeTab === 'js' && <CodeBlock code={js} />}
                </main>
            </div>
        </div>
    );
};

export default CanvasDevPro;