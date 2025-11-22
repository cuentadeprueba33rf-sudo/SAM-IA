
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PlusMenu from './PlusMenu';
import FilePreview from './FilePreview';
import type { Attachment, ModeID, Settings, UsageTracker } from '../types';
import { MODES } from '../constants';
import { ArrowUpIcon, XMarkIcon, ChevronDownIcon, SparklesIcon, PlusIcon, AdjustmentsHorizontalIcon, PhotoIcon, Bars3Icon, MicrophoneIcon, BoltIcon, LockClosedIcon, GiftIcon, CheckBadgeIcon, SpeakerWaveIcon } from './icons';

type VoiceModeState = 'inactive' | 'activeConversation';
type ActiveConversationState = 'LISTENING' | 'RESPONDING' | 'THINKING';


interface ChatInputProps {
    onSendMessage: (message: string, attachment?: Attachment) => void;
    onModeAction: (mode: ModeID, accept?: string, capture?: string) => void;
    attachment: Attachment | null;
    onRemoveAttachment: () => void;
    disabled: boolean;
    currentMode: ModeID;
    onResetMode: () => void;
    onToggleSidebar: () => void;
    settings: Settings;
    onSaveSettings: (settings: Settings) => void;
    voiceModeState: VoiceModeState;
    activeConversationState: ActiveConversationState;
    liveTranscription: string;
    onEndVoiceSession: () => void;
    usage: UsageTracker;
    isThemeActive: boolean;
    inputText: string;
    onInputTextChange: (text: string) => void;
    isPlusMenuOpen: boolean;
    onSetPlusMenuOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
    isPreregisteredForSML3_9: boolean;
    onOpenPreregistrationModal: () => void;
}

// Reusable Model Selector Component
const ModelSelector: React.FC<{
    settings: Settings;
    onSaveSettings: (s: Settings) => void;
    usage: UsageTracker;
    isChristmasModelUnlocked: boolean;
    isPreregisteredForSML3_9: boolean;
    onOpenPreregistrationModal: () => void;
}> = ({ settings, onSaveSettings, usage, isChristmasModelUnlocked, isPreregisteredForSML3_9, onOpenPreregistrationModal }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const limit = usage.hasAttachment ? 15 : 20;
    const usagePercentage = Math.round((usage.count / limit) * 100);
    const isNearingLimit = usagePercentage >= 80 && usagePercentage < 100;
    const isLimitReached = usagePercentage >= 100;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative">
             <button 
                onClick={() => setIsOpen(prev => !prev)} 
                className="flex items-center gap-1 text-xs font-semibold text-text-secondary/70 hover:text-text-main transition-colors px-3 py-1 rounded-full hover:bg-surface-secondary/50 border border-transparent hover:border-border-subtle"
            >
                {settings.defaultModel === 'sm-i1' ? (
                    <span>SM-I1</span>
                ) : settings.defaultModel === 'sm-i3' ? (
                    <span className="flex items-center gap-1"><SparklesIcon className="w-3 h-3 text-yellow-400"/>SM-I3</span>
                ) : (
                    <span className="flex items-center gap-1"><GiftIcon className="w-3 h-3 text-red-400" />SM-l3.9</span>
                )}
                <ChevronDownIcon className="w-3 h-3" />
            </button>
            {isOpen && (
                <div className="absolute bottom-full mb-2 left-0 bg-surface-secondary p-1 rounded-xl shadow-xl border border-border-subtle w-60 animate-fade-in-up-sm z-50">
                    <div className="space-y-1">
                        {/* SM-I1 */}
                        <button
                            onClick={() => { onSaveSettings({...settings, defaultModel: 'sm-i1'}); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-border-subtle transition-colors"
                        >
                            <div className="font-medium text-text-main">SM-I1</div>
                            <p className="text-xs text-text-secondary mt-0.5">Rápido y eficiente</p>
                        </button>
                        
                        {/* SM-I3 */}
                            <button
                            onClick={() => { onSaveSettings({...settings, defaultModel: 'sm-i3'}); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-border-subtle transition-colors"
                        >
                            <div className="flex items-center gap-2 font-medium text-text-main">
                                <SparklesIcon className="w-4 h-4 text-yellow-400"/>
                                <span>SM-I3</span>
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5">Para tareas complejas</p>
                            <div className="mt-1.5 flex items-center gap-2">
                                    <div className="flex-1 bg-border-subtle rounded-full h-1">
                                    <div className={`h-1 rounded-full ${isLimitReached ? 'bg-danger' : isNearingLimit ? 'bg-yellow-500' : 'bg-accent'}`} style={{ width: `${Math.min(usagePercentage, 100)}%` }}></div>
                                </div>
                                <span className="text-[10px] text-text-secondary tabular-nums">{usage.count}/{limit}</span>
                            </div>
                        </button>

                        {/* SM-l3.9 */}
                            <button
                            disabled={!isChristmasModelUnlocked && isPreregisteredForSML3_9}
                            onClick={() => { 
                                if(isChristmasModelUnlocked) {
                                    onSaveSettings({...settings, defaultModel: 'sm-l3.9'}); 
                                    setIsOpen(false); 
                                } else if (!isPreregisteredForSML3_9) {
                                    onOpenPreregistrationModal();
                                    setIsOpen(false);
                                }
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-border-subtle transition-colors disabled:opacity-50 disabled:cursor-default"
                        >
                            <div className="flex items-center gap-2 font-medium text-text-main">
                                <GiftIcon className="w-4 h-4 text-red-400"/>
                                <span>SM-l3.9</span>
                                {!isChristmasModelUnlocked && (
                                    isPreregisteredForSML3_9 ? (
                                         <CheckBadgeIcon className="w-4 h-4 text-green-400 ml-auto" fill="currentColor" />
                                    ) : (
                                         <LockClosedIcon className="w-3 h-3 text-text-secondary ml-auto" />
                                    )
                                )}
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5">
                                {isChristmasModelUnlocked ? 'Máxima potencia' : (isPreregisteredForSML3_9 ? 'Pre-inscrito' : 'Inscríbete para el 2 Dic')}
                            </p>
                        </button>
                    </div>
                </div>
            )}
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
    settings: Settings;
    onSaveSettings: (settings: Settings) => void;
    usage: UsageTracker;
    isChristmasModelUnlocked: boolean;
    isPreregisteredForSML3_9: boolean;
    onOpenPreregistrationModal: () => void;
}> = ({ onSend, disabled, attachment, onRemoveAttachment, onModeAction, onResetMode, settings, onSaveSettings, usage, isChristmasModelUnlocked, isPreregisteredForSML3_9, onOpenPreregistrationModal }) => {
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
        <div className="bg-surface-primary dark:bg-[#1E1F20] p-3 rounded-[2rem] border border-border-subtle shadow-lg w-full transition-all relative st-border">
            <button
                onClick={onResetMode}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-surface-secondary transition-colors z-10"
                aria-label="Salir del modo imagen"
            >
                <XMarkIcon className="w-5 h-5 text-text-secondary st-icon" />
            </button>
            <div className="flex items-center justify-between gap-4 px-2 pt-1">
                <div className="flex items-center gap-2">
                     {/* Replaced Static Button with Model Selector */}
                     <div className="bg-surface-secondary/30 rounded-full border border-border-subtle/50">
                         <ModelSelector 
                            settings={settings} 
                            onSaveSettings={onSaveSettings} 
                            usage={usage} 
                            isChristmasModelUnlocked={isChristmasModelUnlocked}
                            isPreregisteredForSML3_9={isPreregisteredForSML3_9}
                            onOpenPreregistrationModal={onOpenPreregistrationModal}
                         />
                     </div>
                </div>
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachment ? "Describe los cambios..." : "Genera una imagen..."}
                className="w-full bg-transparent resize-none outline-none text-text-main my-3 text-lg placeholder:text-text-secondary/60 px-4"
                rows={2}
                disabled={disabled}
            />

            <div className="flex items-center justify-between gap-2 px-2 pb-1">
                <div className="flex items-center gap-2">
                    {attachment ? (
                        <div className="relative group">
                            <img src={attachment.data} alt="Source" className="w-12 h-12 rounded-lg object-cover border border-border-subtle"/>
                            <button onClick={onRemoveAttachment} className="absolute -top-1 -right-1 bg-danger text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <XMarkIcon className="w-3 h-3"/>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => onModeAction('photo_upload', 'image/*')}
                            className="p-2 bg-surface-secondary rounded-full flex items-center justify-center text-text-secondary hover:bg-border-subtle transition-colors"
                        >
                            <PlusIcon className="w-6 h-6 st-icon"/>
                        </button>
                    )}
                </div>
                <button
                    onClick={handleSendClick}
                    disabled={disabled || (!prompt.trim() && !attachment)}
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-text-main text-bg-main hover:opacity-90 disabled:bg-surface-secondary disabled:text-text-secondary self-end st-mic-button"
                    aria-label="Generate image"
                >
                    <ArrowUpIcon className="w-5 h-5 st-icon" />
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
    onToggleSidebar,
    settings,
    onSaveSettings,
    voiceModeState,
    activeConversationState,
    liveTranscription,
    onEndVoiceSession,
    usage,
    isThemeActive,
    inputText,
    onInputTextChange,
    isPlusMenuOpen,
    onSetPlusMenuOpen,
    isPreregisteredForSML3_9,
    onOpenPreregistrationModal,
}) => {
    const [placeholder, setPlaceholder] = useState('Pregunta a SAM');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const currentModeData = MODES.find(m => m.id === currentMode);

    const isChristmasModelUnlocked = useMemo(() => {
        const now = new Date();
        const unlockDate = new Date(now.getFullYear(), 11, 2); // Dec 2
        return now >= unlockDate;
    }, []);

    const handleSend = () => {
        if ((inputText.trim() || attachment) && !disabled) {
            onSendMessage(inputText, attachment);
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
        if (!isThemeActive) {
            setPlaceholder('Pregunta a SAM');
            return;
        }

        let isMounted = true;
        let timeoutId: number;
        const placeholderText = "stranger things 5";
        let currentIndex = 0;
        let isDeleting = false;
        
        const animatePlaceholder = () => {
            if (!isMounted) return;

            const currentFullText = isDeleting
                ? placeholderText.substring(0, currentIndex - 1)
                : placeholderText.substring(0, currentIndex + 1);
            
            setPlaceholder(currentFullText);

            currentIndex = isDeleting ? currentIndex - 1 : currentIndex + 1;

            if (!isDeleting && currentIndex === placeholderText.length + 1) {
                isDeleting = true;
                timeoutId = window.setTimeout(animatePlaceholder, 2000);
            } else if (isDeleting && currentIndex === 0) {
                isDeleting = false;
                timeoutId = window.setTimeout(animatePlaceholder, 500);
            } else {
                const delay = isDeleting ? 100 : 150;
                timeoutId = window.setTimeout(animatePlaceholder, delay);
            }
        };
        
        animatePlaceholder();
        
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };

    }, [isThemeActive]);

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputText, adjustTextareaHeight]);
    
    // Ensure focus only when enabled and not in voice mode (optionally, though user requested typing during voice)
    // We'll keep focus management loose to allow user override
    useEffect(() => {
        if(!disabled && textareaRef.current && voiceModeState === 'inactive') {
            textareaRef.current.focus();
        }
    }, [disabled, voiceModeState]);

    if (currentMode === 'image_generation') {
        return (
            <ImageGenInput 
                onSend={onSendMessage} 
                disabled={disabled} 
                attachment={attachment}
                onRemoveAttachment={onRemoveAttachment}
                onModeAction={onModeAction}
                onResetMode={onResetMode}
                settings={settings}
                onSaveSettings={onSaveSettings}
                usage={usage}
                isChristmasModelUnlocked={isChristmasModelUnlocked}
                isPreregisteredForSML3_9={isPreregisteredForSML3_9}
                onOpenPreregistrationModal={onOpenPreregistrationModal}
            />
        );
    }
    
    return (
        <>
            <div className="w-full relative">
                {isPlusMenuOpen && <PlusMenu onAction={(mode, accept, capture) => {
                    onModeAction(mode, accept, capture);
                    onSetPlusMenuOpen(false);
                }} settings={settings} />}
                
                {attachment && (
                    <div className="mb-2 transition-all ml-4">
                        <FilePreview attachment={attachment} onRemove={onRemoveAttachment} />
                    </div>
                )}
                
                <div className={`flex items-end bg-surface-primary dark:bg-[#1E1F20] rounded-[2rem] p-3 gap-3 shadow-2xl border border-border-subtle st-border relative z-20 ${voiceModeState === 'activeConversation' ? 'ring-2 ring-accent/50' : ''}`}>
                    
                    {/* Left Actions (Grouped: Sidebar Toggle & Plus Menu) */}
                    <div className="flex items-center gap-2 mb-1">
                        <button 
                            id="btn-toggle-sidebar"
                            onClick={onToggleSidebar}
                            className="flex-shrink-0 p-2.5 bg-surface-secondary dark:bg-[#2C2C2E] text-text-main hover:bg-border-subtle transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                            aria-label="Toggle sidebar"
                        >
                            <Bars3Icon className="w-5 h-5 st-icon" />
                        </button>

                        <button 
                            id="btn-plus-menu"
                            onClick={() => onSetPlusMenuOpen((prev: boolean) => !prev)}
                            className="flex-shrink-0 p-2.5 bg-surface-secondary dark:bg-[#2C2C2E] text-text-main hover:bg-border-subtle transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                            aria-label="More options"
                            disabled={disabled}
                        >
                            <PlusIcon className="w-5 h-5 st-icon transform transition-transform" style={{ transform: isPlusMenuOpen ? 'rotate(45deg)' : 'none' }} />
                        </button>

                        {currentMode !== 'normal' && currentModeData && (
                            <div 
                                title={`Modo activo: ${currentModeData.title}`} 
                                className="relative flex-shrink-0 self-center animate-fade-in"
                            >
                                <div className="p-2.5 bg-accent/10 rounded-full flex items-center justify-center">
                                    <currentModeData.icon className="w-5 h-5 text-accent st-icon" />
                                </div>
                                <button 
                                    onClick={onResetMode} 
                                    className="absolute -top-1 -right-1 bg-surface-primary rounded-full p-0.5 shadow hover:scale-110 transition-transform border border-border-subtle" 
                                    aria-label={`Desactivar modo ${currentModeData.title}`}
                                >
                                    <XMarkIcon className="w-3 h-3 text-text-secondary st-icon" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="relative flex-1 flex flex-col justify-center min-h-[3rem]">
                        {/* Model Selector (Floating Inside Input) */}
                        <div className="absolute -top-1 left-0 right-0 flex justify-start z-10">
                            <ModelSelector 
                                settings={settings} 
                                onSaveSettings={onSaveSettings} 
                                usage={usage} 
                                isChristmasModelUnlocked={isChristmasModelUnlocked} 
                                isPreregisteredForSML3_9={isPreregisteredForSML3_9}
                                onOpenPreregistrationModal={onOpenPreregistrationModal}
                            />
                        </div>

                        <textarea
                            ref={textareaRef}
                            id="chat-textarea"
                            value={inputText}
                            onChange={(e) => onInputTextChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={voiceModeState === 'activeConversation' ? "Escuchando... (puedes escribir también)" : placeholder}
                            className="w-full bg-transparent resize-none outline-none text-text-main max-h-48 py-2 px-2 mt-4 text-base leading-relaxed placeholder:text-text-secondary/60"
                            rows={1}
                            disabled={disabled}
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 mb-1">
                        {inputText.trim() || attachment ? (
                            <button 
                                id="btn-send-message"
                                onClick={handleSend}
                                disabled={disabled}
                                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-white text-black hover:bg-gray-200 disabled:bg-surface-secondary disabled:text-text-secondary st-mic-button"
                                aria-label="Send message"
                            >
                                <ArrowUpIcon className="w-5 h-5 st-icon" />
                            </button>
                        ) : (
                            <button
                                id="btn-mode-voice-input" 
                                onClick={voiceModeState === 'activeConversation' ? onEndVoiceSession : () => onModeAction('voice')}
                                disabled={disabled && voiceModeState === 'inactive'}
                                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-50 st-mic-button ${voiceModeState === 'activeConversation' ? 'bg-red-500 text-white animate-pulse' : 'text-text-main hover:bg-white/10'}`}
                                aria-label={voiceModeState === 'activeConversation' ? "Stop voice" : "Use voice"}
                            >
                                {voiceModeState === 'activeConversation' ? (
                                    <div className="w-3 h-3 bg-white rounded-sm" />
                                ) : (
                                    <MicrophoneIcon className="w-6 h-6 st-icon"/>
                                )}
                            </button>
                        )}
                    </div>
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
        </>
    );
};

export default ChatInput;
