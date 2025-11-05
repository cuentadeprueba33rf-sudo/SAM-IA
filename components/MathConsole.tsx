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
        const prefixMatch = log.match(/^(\[[A-Z]+\])/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        const message = prefix ? log.substring(prefix.length) : log;

        let colorClass = "text-gray-400";
        if (prefix === '[SUCCESS]') colorClass = "text-green-400";
        else if (prefix === '[ERROR]' || prefix === '[FATAL]') colorClass = "text-red-400";
        else if (prefix === '[INFO]' || prefix === '[VERIFY]') colorClass = "text-blue-400";
        else if (prefix === '[RECV]') colorClass = "text-purple-400";

        return <><strong className={`font-semibold ${colorClass}`}>{prefix}</strong><span className="text-gray-300">{message}</span></>;
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
                <div ref={logContainerRef} className="h-48 overflow-y-auto p-3 bg-[#1E1F20] dark:bg-[#111213]">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                        {logs.map((log, index) => (
                            <div key={index} className="flex gap-2">
                                <span className="select-none text-gray-600">{String(index + 1).padStart(2, ' ')}</span>
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