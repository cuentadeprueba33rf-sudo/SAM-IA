import React, { useRef, useEffect } from 'react';
import { CalculatorIcon, ChevronDownIcon } from './icons';

interface MathConsoleProps {
    logs: string[];
    isOpen: boolean;
    onToggle: () => void;
}

const MathConsole: React.FC<MathConsoleProps> = ({ logs, isOpen, onToggle }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const formatLog = (log: string) => {
        if (log.startsWith('[SUCCESS]')) {
            return <span className="text-green-400">{log}</span>;
        }
        if (log.startsWith('[ERROR]') || log.startsWith('[FATAL]')) {
            return <span className="text-red-400">{log}</span>;
        }
        if (log.startsWith('[INFO]') || log.startsWith('[VERIFY]')) {
            return <span className="text-blue-400">{log}</span>;
        }
        if (log.startsWith('[RECV]')) {
            return <span className="text-purple-400">{log}</span>;
        }
        return <span className="text-text-secondary">{log}</span>;
    };
    
    if (!isOpen) {
        return (
            <div className="w-full max-w-3xl mx-auto px-4">
                 <button 
                    onClick={onToggle}
                    className="w-full flex justify-between items-center px-4 py-2 bg-surface-primary border-t border-x border-border-subtle rounded-t-lg shadow-lg"
                >
                    <div className="flex items-center gap-2">
                        <CalculatorIcon className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-sm text-text-main">Consola de Verificación</span>
                    </div>
                    <ChevronDownIcon className="w-5 h-5 text-text-secondary transform rotate-180" />
                </button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-3xl mx-auto px-4">
            <div className="bg-surface-primary border-t border-x border-border-subtle rounded-t-lg shadow-lg transition-all duration-300 ease-in-out">
                <button 
                    onClick={onToggle}
                    className="w-full flex justify-between items-center px-4 py-2 border-b border-border-subtle"
                >
                    <div className="flex items-center gap-2">
                        <CalculatorIcon className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-sm text-text-main">Consola de Verificación</span>
                    </div>
                    <ChevronDownIcon className="w-5 h-5 text-text-secondary" />
                </button>
                <div ref={logContainerRef} className="h-48 overflow-y-auto p-3 bg-surface-secondary/50">
                    <pre className="font-mono text-xs whitespace-pre-wrap">
                        {logs.map((log, index) => (
                            <div key={index} className="flex gap-2">
                                <span className="select-none text-text-secondary/50">{String(index + 1).padStart(2, ' ')}</span>
                                <code className="flex-1">{formatLog(log)}</code>
                            </div>
                        ))}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default MathConsole;
