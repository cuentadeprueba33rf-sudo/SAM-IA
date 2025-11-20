
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, PlayIcon, StopIcon, TrashIcon, CpuChipIcon, AdjustmentsVerticalIcon, CommandLineIcon, BeakerIcon } from './icons';
import { streamGenerateContent } from '../services/geminiService';
import type { ChatMessage, ModelType } from '../types';
import { MessageAuthor } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface LogicLabProps {
    onNavigateBack: () => void;
}

const LogicLab: React.FC<LogicLabProps> = ({ onNavigateBack }) => {
    // --- Config State ---
    const [systemInstruction, setSystemInstruction] = useState<string>('You are a helpful AI assistant.');
    const [selectedModel, setSelectedModel] = useState<ModelType>('sm-i1');
    const [temperature, setTemperature] = useState<number>(1.0);
    const [tokenLimit, setTokenLimit] = useState<number>(2048);
    
    // --- Simulation State ---
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // --- UI State ---
    const [activeMobileTab, setActiveMobileTab] = useState<'config' | 'simulation'>('config');

    const abortControllerRef = useRef<AbortController | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeMobileTab === 'simulation') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, activeMobileTab]);

    const handleRunSimulation = async () => {
        if (!inputMessage.trim() && chatHistory.length === 0) return;
        if (isGenerating) {
            abortControllerRef.current?.abort();
            setIsGenerating(false);
            return;
        }

        // Auto-switch to simulation view on mobile when running
        setActiveMobileTab('simulation');

        const userMsgId = uuidv4();
        const samMsgId = uuidv4();
        const userMessage: ChatMessage = { 
            id: userMsgId, 
            author: MessageAuthor.USER, 
            text: inputMessage, 
            timestamp: Date.now() 
        };

        setChatHistory(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsGenerating(true);
        setError(null);

        const samMessage: ChatMessage = {
            id: samMsgId,
            author: MessageAuthor.SAM,
            text: '',
            timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, samMessage]);

        abortControllerRef.current = new AbortController();

        try {
            await streamGenerateContent({
                prompt: userMessage.text,
                systemInstruction: systemInstruction,
                history: chatHistory, // Pass previous history context
                mode: 'normal', // Use 'normal' as generic logic lab mode
                modelName: selectedModel,
                abortSignal: abortControllerRef.current.signal,
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: tokenLimit
                },
                onUpdate: (chunk) => {
                    setChatHistory(prev => prev.map(msg => 
                        msg.id === samMsgId ? { ...msg, text: msg.text + chunk } : msg
                    ));
                },
                onLogUpdate: () => {},
                onComplete: () => {
                    setIsGenerating(false);
                },
                onError: (err) => {
                    setError(err.message);
                    setIsGenerating(false);
                }
            });
        } catch (e: any) {
             setError(e.message);
             setIsGenerating(false);
        }
    };

    const handleClearSimulation = () => {
        setChatHistory([]);
        setInputMessage('');
        setError(null);
        abortControllerRef.current?.abort();
        setIsGenerating(false);
    };

    return (
        <div className="flex flex-col h-full w-full bg-bg-main overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 flex flex-col bg-surface-primary border-b border-border-subtle z-30">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onNavigateBack} className="p-2 rounded-full hover:bg-surface-secondary transition-colors text-text-secondary">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-teal-500/10 rounded-lg">
                                 <BeakerIcon className="w-5 h-5 text-teal-500" />
                            </div>
                            <h1 className="text-lg font-bold text-text-main">Logic Lab</h1>
                        </div>
                    </div>
                    <div className="hidden sm:block text-xs text-text-secondary font-mono border border-border-subtle px-2 py-1 rounded bg-surface-secondary">
                        v1.0.0 BETA
                    </div>
                </div>
                
                {/* Mobile Tab Switcher */}
                <div className="flex md:hidden px-4 pb-4 gap-2">
                    <button 
                        onClick={() => setActiveMobileTab('config')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeMobileTab === 'config' ? 'bg-accent text-white shadow-md' : 'bg-surface-secondary text-text-secondary'}`}
                    >
                        Configuración
                    </button>
                    <button 
                        onClick={() => setActiveMobileTab('simulation')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeMobileTab === 'simulation' ? 'bg-accent text-white shadow-md' : 'bg-surface-secondary text-text-secondary'}`}
                    >
                        Simulación
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Left Panel: Configuration */}
                <div className={`
                    w-full md:w-96 border-r border-border-subtle bg-surface-primary flex-col z-20 shadow-xl md:shadow-none md:flex
                    ${activeMobileTab === 'config' ? 'flex h-full' : 'hidden'}
                `}>
                    <div className="p-4 border-b border-border-subtle bg-surface-secondary/30 flex items-center gap-2 flex-shrink-0">
                        <AdjustmentsVerticalIcon className="w-4 h-4 text-text-secondary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">System Core</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* System Instruction */}
                        <div>
                            <label className="block text-sm font-semibold text-text-main mb-2 flex items-center gap-2">
                                <CommandLineIcon className="w-4 h-4 text-accent" />
                                System Instructions
                            </label>
                            <textarea 
                                value={systemInstruction}
                                onChange={(e) => setSystemInstruction(e.target.value)}
                                className="w-full h-40 bg-surface-secondary border border-border-subtle rounded-xl p-3 text-sm font-mono text-text-main resize-none focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                                placeholder="Define the AI persona and rules here..."
                            />
                            <p className="text-xs text-text-secondary mt-2">
                                Defines the behavior, tone, and capabilities of the model.
                            </p>
                        </div>

                        <div className="h-px bg-border-subtle" />

                        {/* Parameters */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-2">Model</label>
                                <div className="relative">
                                    <select 
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                                        className="w-full bg-surface-secondary border border-border-subtle rounded-lg p-2.5 text-sm text-text-main appearance-none focus:ring-2 focus:ring-accent outline-none"
                                    >
                                        <option value="sm-i1">SM-I1 (Flash)</option>
                                        <option value="sm-i3">SM-I3 (Pro)</option>
                                        <option value="sm-l3">SM-L3 (Legacy)</option>
                                        <option value="sm-l3.9">SM-L3.9 (Preview)</option>
                                    </select>
                                    <CpuChipIcon className="absolute right-3 top-2.5 w-5 h-5 text-text-secondary pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-semibold text-text-main">Temperature</label>
                                    <span className="text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded text-text-main">{temperature.toFixed(1)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="2" 
                                    step="0.1" 
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="w-full accent-accent h-1.5 bg-surface-secondary rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                                    <span>Precise</span>
                                    <span>Creative</span>
                                </div>
                            </div>

                             <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-semibold text-text-main">Max Tokens</label>
                                    <span className="text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded text-text-main">{tokenLimit}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="100" 
                                    max="8192" 
                                    step="100" 
                                    value={tokenLimit}
                                    onChange={(e) => setTokenLimit(parseInt(e.target.value))}
                                    className="w-full accent-accent h-1.5 bg-surface-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Simulation */}
                <div className={`
                    flex-1 flex-col bg-surface-secondary/30 relative md:flex
                    ${activeMobileTab === 'simulation' ? 'flex h-full' : 'hidden'}
                `}>
                     <div className="p-3 border-b border-border-subtle bg-surface-primary/50 backdrop-blur-sm flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                             <PlayIcon className="w-4 h-4" />
                             Simulation
                        </div>
                        <button 
                            onClick={handleClearSimulation} 
                            className="p-1.5 hover:bg-danger/10 text-text-secondary hover:text-danger rounded-md transition-colors text-xs flex items-center gap-1"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Clear Chat
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatHistory.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50">
                                <BeakerIcon className="w-16 h-16 mb-4 stroke-1" />
                                <p className="text-sm">Ready to test. Configure your agent and start typing.</p>
                            </div>
                        ) : (
                            chatHistory.map((msg) => (
                                <div key={msg.id} className={`flex w-full ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                                        msg.author === MessageAuthor.USER 
                                        ? 'bg-accent text-white rounded-br-none' 
                                        : 'bg-surface-primary border border-border-subtle text-text-main rounded-bl-none shadow-sm'
                                    }`}>
                                        <div className="whitespace-pre-wrap font-medium leading-relaxed">
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                         {error && (
                            <div className="w-full p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs text-center font-medium">
                                {error}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-surface-primary border-t border-border-subtle">
                        <div className="flex gap-2">
                            <textarea 
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleRunSimulation();
                                    }
                                }}
                                placeholder="Type a message to simulate..."
                                className="flex-1 bg-surface-secondary border border-border-subtle rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-accent focus:bg-surface-primary transition-all h-12 max-h-32"
                            />
                            <button 
                                onClick={handleRunSimulation}
                                disabled={(!inputMessage.trim() && !isGenerating)}
                                className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${
                                    isGenerating 
                                    ? 'bg-danger text-white hover:bg-danger/90' 
                                    : 'bg-accent text-white hover:bg-accent/90 disabled:bg-surface-secondary disabled:text-text-secondary disabled:cursor-not-allowed'
                                }`}
                            >
                                {isGenerating ? <StopIcon className="w-5 h-5 animate-pulse" /> : <PlayIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogicLab;
