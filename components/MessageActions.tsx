import React, { useState, useRef, useEffect } from 'react';
import { DocumentDuplicateIcon, CheckIcon, GlobeAltIcon, PinIcon } from './icons';
import type { ChatMessage } from '../types';
import { MessageAuthor } from '../types';

interface MessageActionsProps {
    message: ChatMessage;
    onPin: () => void;
    text: string;
    groundingMetadata?: any[];
}

const MessageActions: React.FC<MessageActionsProps> = ({ message, onPin, text, groundingMetadata }) => {
    const [copied, setCopied] = useState(false);
    const [showSources, setShowSources] = useState(false);
    const sourcesRef = useRef<HTMLDivElement>(null);
    const iconClasses = "w-5 h-5 text-text-secondary group-hover:text-text-main transition-colors";
    const isUser = message.author === MessageAuthor.USER;

    const hasSources = groundingMetadata && groundingMetadata.length > 0 && groundingMetadata.some(c => c.web);
    const isPinnable = message.artifacts && message.artifacts.length > 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sourcesRef.current && !sourcesRef.current.contains(event.target as Node)) {
                setShowSources(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleCopy = () => {
        if (copied || !text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => console.error("Failed to copy text: ", err));
    };
    
    return (
        <div ref={sourcesRef} className={`relative flex items-center gap-3 mt-3 ${isUser ? 'justify-end' : ''}`}>
            {isPinnable && (
                <button 
                    onClick={onPin} 
                    aria-label="Anclar al Canvas" 
                    className="p-1 focus:outline-none focus:ring-2 focus:ring-accent rounded group"
                >
                    <PinIcon className={iconClasses} />
                </button>
            )}
            {text && (
                <button 
                    onClick={handleCopy} 
                    aria-label="Copiar" 
                    className="p-1 focus:outline-none focus:ring-2 focus:ring-accent rounded group"
                >
                    {copied ? (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                    ) : (
                        <DocumentDuplicateIcon className={iconClasses} />
                    )}
                </button>
            )}
            
            {hasSources && (
                <button 
                    onClick={() => setShowSources(prev => !prev)} 
                    aria-label="Fuentes" 
                    className="p-1 focus:outline-none focus:ring-2 focus:ring-accent rounded group"
                >
                    <GlobeAltIcon className={iconClasses} />
                </button>
            )}

            {showSources && hasSources && (
                <div 
                    className="absolute bottom-full left-0 mb-2 w-72 bg-surface-primary rounded-lg shadow-lg border border-border-subtle p-2 z-10"
                    style={{ animation: 'fade-in-up-sm 0.1s ease-out' }}
                >
                   <h4 className="font-semibold text-sm text-text-main px-2 pb-1">Fuentes</h4>
                   <ul className="max-h-48 overflow-y-auto">
                       {groundingMetadata.map((chunk, index) => (
                           chunk.web && (
                            <li key={index}>
                                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" title={chunk.web.title} className="block text-xs text-accent-blue hover:underline truncate p-2 rounded hover:bg-surface-secondary">
                                    {chunk.web.title || chunk.web.uri}
                                </a>
                            </li>
                           )
                       ))}
                   </ul>
                </div>
            )}
        </div>
    );
};

export default MessageActions;