import React, { useState, useRef, useEffect, useCallback } from 'react';
import PlusMenu from './PlusMenu';
import FilePreview from './FilePreview';
import type { Attachment, ModeID, ModelType, Settings } from '../types';
import { MODES } from '../constants';
import { ArrowUpIcon, XMarkIcon, ChevronDownIcon, SparklesIcon, PlusIcon, AdjustmentsHorizontalIcon, PhotoIcon, Bars3Icon, MicrophoneIcon } from './icons';

interface ChatInputProps {
    onSendMessage: (message: string, attachment?: Attachment) => void;
    onModeAction: (mode: ModeID, accept?: string, capture?: string) => void;
    attachment: Attachment | null;
    onRemoveAttachment: () => void;
    disabled: boolean;
    currentMode: ModeID;
    onResetMode: () => void;
    selectedModel: ModelType;
    onSetSelectedModel: (model: ModelType) => void;
    onToggleSidebar: () => void;
    isVoiceMode: boolean;
    onEndVoiceSession: () => void;
    settings: Settings;
}

const VoiceInput: React.FC<{ onEndSession: () => void }> = ({ onEndSession }) => {
    return (
        <div className="bg-surface-primary p-3 rounded-2xl border border-border-subtle shadow-lg w-full transition-all flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-text-secondary">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Escuchando...</span>
            </div>
            <button
                onClick={onEndSession}
                className="px-4 py-2 bg-danger/10 text-danger text-sm font-semibold rounded-lg hover:bg-danger/20"
            >
                Finalizar Sesión
            </button>
        </div>
    );
};


const ImageGenInput: React.FC<{
    onSend: (prompt: string, attachment?: Attachment) => void;
    disabled: boolean;
    attachment: Attachment | null;
    onRemoveAttachment: () => void;
    onModeAction: (mode: ModeID, accept?: string) => void;
    onResetMode: () => void;
}> = ({ onSend, disabled, attachment, onRemoveAttachment, onModeAction, onResetMode }) => {
    const [prompt, setPrompt] = useState('');

    const handleSendClick = () => {
        if (!disabled && (prompt.trim() || attachment)) {
            onSend(prompt, attachment || undefined);
            setPrompt('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendClick();
        }
    };

    return (
        <div className="bg-surface-primary dark:bg-[#1E1F20] p-3 rounded-2xl border border-border-subtle shadow-lg w-full transition-all relative">
            <button
                onClick={onResetMode}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface-secondary transition-colors z-10"
                aria-label="Salir del modo imagen"
            >
                <XMarkIcon className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 font-semibold text-text-main p-2 rounded-lg bg-surface-secondary">
                        <span>Imágenes</span>
                        <ChevronDownIcon className="w-4 h-4 text-text-secondary"/>
                    </button>
                </div>
                <div className="flex items-center gap-3 text-text-secondary mr-8">
                    <PhotoIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium">Flash Image</span>
                    <div className="w-px h-4 bg-border-subtle"></div>
                    <span className="text-sm font-medium">x1</span>
                    <button className="p-1 rounded-full hover:bg-surface-secondary">
                        <AdjustmentsHorizontalIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachment ? "Describe los cambios que quieres hacer..." : "Genera una imagen con texto..."}
                className="w-full bg-transparent resize-none outline-none text-text-main my-3 text-lg placeholder:text-text-secondary"
                rows={2}
                disabled={disabled}
            />

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {attachment ? (
                        <div className="relative">
                            <img src={attachment.data} alt="Source" className="w-16 h-16 rounded-lg object-cover"/>
                            <button onClick={onRemoveAttachment} className="absolute -top-1 -right-1 bg-danger text-white rounded-full p-0.5">
                                <XMarkIcon className="w-3 h-3"/>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => onModeAction('photo_upload', 'image/*')}
                            className="w-16 h-16 bg-surface-secondary rounded-lg flex items-center justify-center text-text-secondary hover:bg-border-subtle transition-colors"
                        >
                            <PlusIcon className="w-8 h-8"/>
                        </button>
                    )}
                </div>
                <button
                    onClick={handleSendClick}
                    disabled={disabled || (!prompt.trim() && !attachment)}
                    className="w-12 h-12 flex items-center justify-center rounded-full transition-colors bg-text-main text-bg-main hover:opacity-90 disabled:bg-surface-secondary disabled:text-text-secondary self-end"
                    aria-label="Generate image"
                >
                    <ArrowUpIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, 
    onModeAction, 
    attachment, 
    onRemoveAttachment, 
    disabled, 
    currentMode, 
    onResetMode,
    selectedModel,
    onSetSelectedModel,
    onToggleSidebar,
    isVoiceMode,
    onEndVoiceSession,
    settings,
}) => {
    const [text, setText] = useState('');
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    const currentModeData = MODES.find(m => m.id === currentMode);

    const handleSend = () => {
        if ((text.trim() || attachment) && !disabled) {
            onSendMessage(text, attachment);
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const adjustTextareaHeight = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
                setIsModelMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [text, adjustTextareaHeight]);
    
    useEffect(() => {
        if(!disabled && textareaRef.current && !isVoiceMode) {
            textareaRef.current.focus();
        }
    }, [disabled, isVoiceMode]);

    if (isVoiceMode) {
        return <VoiceInput onEndSession={onEndVoiceSession} />;
    }

    if (currentMode === 'image_generation') {
        return (
            <ImageGenInput 
                onSend={onSendMessage} 
                disabled={disabled} 
                attachment={attachment}
                onRemoveAttachment={onRemoveAttachment}
                onModeAction={onModeAction}
                onResetMode={onResetMode}
            />
        );
    }
    
    return (
        <div className="w-full relative">
            {isPlusMenuOpen && <PlusMenu onAction={(mode, accept, capture) => {
                onModeAction(mode, accept, capture);
                setIsPlusMenuOpen(false);
            }} settings={settings} />}
            
            {attachment && (
                <div className="mb-2 transition-all">
                    <FilePreview attachment={attachment} onRemove={onRemoveAttachment} />
                </div>
            )}
            
            <div className="flex items-end bg-surface-primary rounded-3xl p-2 gap-2 shadow-lg border border-border-subtle">
                <div className="flex items-center self-stretch">
                    <button 
                        onClick={onToggleSidebar}
                        className="flex-shrink-0 p-2 text-text-secondary hover:text-text-main transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                        aria-label="Toggle menu"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => setIsPlusMenuOpen(prev => !prev)}
                        className="flex-shrink-0 p-2 text-text-secondary hover:text-text-main transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                        aria-label="More options"
                        disabled={disabled}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </button>
                    
                    {currentMode !== 'normal' && currentModeData && (
                        <div 
                            title={`Modo activo: ${currentModeData.title}`} 
                            className="relative flex-shrink-0 self-center animate-fade-in mx-1"
                        >
                            <div className="p-2 bg-accent/10 rounded-full flex items-center justify-center">
                                <currentModeData.icon className="w-5 h-5 text-accent" />
                            </div>
                            <button 
                                onClick={onResetMode} 
                                className="absolute -top-1 -right-1 bg-surface-primary rounded-full p-0.5 shadow hover:scale-110 transition-transform border border-border-subtle" 
                                aria-label={`Desactivar modo ${currentModeData.title}`}
                            >
                                <XMarkIcon className="w-3.5 h-3.5 text-text-secondary" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative flex-1 flex flex-col">
                     <div className="flex justify-between items-center px-2">
                        <div ref={modelMenuRef} className="relative">
                            <button onClick={() => setIsModelMenuOpen(prev => !prev)} className="flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-main transition-colors">
                                {selectedModel === 'sm-i1' ? (
                                    <span>SM-I1</span>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-4 h-4 text-yellow-400"/>
                                        <span>SM-I3</span>
                                    </>
                                )}
                                <ChevronDownIcon className="w-4 h-4" />
                            </button>
                            {isModelMenuOpen && (
                                <div className="absolute bottom-full mb-2 bg-surface-secondary p-1 rounded-lg shadow-xl border border-border-subtle w-48 animate-fade-in-up-sm">
                                    <button
                                        onClick={() => { onSetSelectedModel('sm-i1'); setIsModelMenuOpen(false); }}
                                        className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-border-subtle"
                                    >
                                        SM-I1
                                    </button>
                                     <button
                                        onClick={() => { onSetSelectedModel('sm-i3'); setIsModelMenuOpen(false); }}
                                        disabled={!settings.isPremiumUnlocked}
                                        className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm rounded-md hover:bg-border-subtle disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <SparklesIcon className="w-4 h-4 text-yellow-400"/>
                                        <span>SM-I3 (Premium)</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <textarea
                        ref={textareaRef}
                        id="chat-textarea"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pregunta a SAM"
                        className="w-full bg-transparent resize-none outline-none text-text-main max-h-48 py-2 px-2"
                        rows={1}
                        disabled={disabled}
                    />
                </div>

                <button 
                    onClick={handleSend}
                    disabled={disabled || (!text.trim() && !attachment)}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-text-main text-bg-main hover:opacity-90 disabled:bg-surface-secondary disabled:text-text-secondary self-end"
                    aria-label="Send message"
                >
                    <ArrowUpIcon className="w-6 h-6" />
                </button>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                @keyframes fade-in-up-sm {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up-sm {
                    animation: fade-in-up-sm 0.15s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ChatInput;