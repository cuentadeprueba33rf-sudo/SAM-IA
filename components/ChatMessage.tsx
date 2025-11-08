import React, { useEffect, useState } from 'react';
import { MessageAuthor } from '../types';
import type { ChatMessage, Attachment, Artifact } from '../types';
import MessageActions from './MessageActions';
import { DocumentTextIcon, GlobeAltIcon, CodeBracketIcon, AcademicCapIcon } from './icons';


// A more robust markdown parser that handles code blocks separately to prevent nested parsing.
const parseMarkdown = (text: string) => {
    const escapeHtml = (unsafe: string) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const codeBlocks: string[] = [];
    let processedText = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const escapedCode = escapeHtml(code);
        codeBlocks.push(`<pre class="bg-surface-secondary p-3 rounded-md not-prose"><code class="language-${lang}">${escapedCode}</code></pre>`);
        return `__CODEBLOCK_${codeBlocks.length - 1}__`;
    });
    
    processedText = escapeHtml(processedText);
    processedText = processedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    processedText = processedText.replace(/^\s*-\s(.*)/gm, '<li>$1</li>');
    const listMatches = processedText.match(/(<li>.*<\/li>)/s);
    if(listMatches) {
        processedText = processedText.replace(listMatches[0], `<ul class="list-disc pl-5">${listMatches[0]}</ul>`);
    }

    processedText = processedText.replace(/__CODEBLOCK_(\d+)__/g, (match, index) => {
        return codeBlocks[parseInt(index, 10)];
    });

    return { __html: processedText };
};


declare global {
    interface Window {
      renderMath: () => void;
    }
}

interface ChatMessageItemProps {
    message: ChatMessage;
    onOpenArtifact: (artifact: Artifact) => void;
    onPinArtifact: (artifact: Artifact) => void;
    onPreviewImage: (attachment: Attachment) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onOpenArtifact, onPinArtifact, onPreviewImage }) => {
    const isUser = message.author === MessageAuthor.USER;
    const [pinnedArtifacts, setPinnedArtifacts] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window.renderMath === 'function') {
            window.renderMath();
        }
    }, [message.text]);

    const handlePinArtifact = (artifact: Artifact) => {
        if (!pinnedArtifacts.includes(artifact.id)) {
            onPinArtifact(artifact);
            setPinnedArtifacts(prev => [...prev, artifact.id]);
        }
    };
    
    return (
        <div className={`py-4 flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xl lg:max-w-2xl flex flex-col">
                <p className={`font-bold text-sm mb-2 text-text-main ${isUser ? 'text-right' : 'text-left'}`}>
                    {isUser ? 'Tú' : 'SAM'}
                </p>
                
                <div className={`p-4 ${isUser ? 'rounded-2xl bg-accent/10 text-text-main' : ''}`}>
                    {message.attachment && (
                        <div className="mb-2">
                            {message.attachment.type.startsWith('image/') ? (
                                <img 
                                    src={message.attachment.data} 
                                    alt={message.attachment.name} 
                                    className="max-w-xs rounded-lg cursor-pointer" 
                                    onClick={() => onPreviewImage(message.attachment)}
                                />
                            ) : (
                                <div className="flex items-center gap-2 p-2 bg-surface-primary rounded-lg text-text-secondary border border-border-subtle">
                                    <DocumentTextIcon className="w-6 h-6" />
                                    <span>{message.attachment.name}</span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {message.essayContent && (
                         <div className="p-4 rounded-lg bg-surface-primary border border-border-subtle cursor-pointer hover:border-accent/50 transition-colors mb-2">
                            <div className="flex items-center gap-2 mb-2">
                                 <AcademicCapIcon className="w-5 h-5 text-accent"/>
                                 <h4 className="font-bold text-text-main">Ensayo: {message.essayContent.topic}</h4>
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-3">
                               {message.essayContent.outline.map(s => message.essayContent.content[s.id]).join(' ')}
                            </p>
                        </div>
                    )}

                    {message.text && (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words" dangerouslySetInnerHTML={parseMarkdown(message.text)} />
                    )}
                    
                    {message.artifacts && message.artifacts.map(artifact => (
                         <div key={artifact.id} className="mt-2 p-3 bg-surface-primary dark:bg-surface-secondary rounded-lg border border-border-subtle">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-sm text-text-main">{artifact.title}</p>
                                    <p className="text-xs text-text-secondary">{artifact.language}</p>
                                </div>
                                <button onClick={() => onOpenArtifact(artifact)} className="text-sm bg-accent text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">Ver</button>
                            </div>
                        </div>
                    ))}
                    
                    {message.generatingArtifact && (
                        <div className="flex items-center gap-2 text-text-secondary mt-2 text-sm">
                            <CodeBracketIcon className="w-4 h-4 animate-pulse" />
                            <span>Generando componente...</span>
                        </div>
                    )}
                     {message.isSearching && (
                        <div className="flex items-center gap-2 text-text-secondary mt-2 text-sm">
                            <GlobeAltIcon className="w-4 h-4 animate-spin" />
                            <span>Buscando en la web...</span>
                        </div>
                    )}
                </div>
                
                <MessageActions 
                    message={message}
                    text={message.text}
                    groundingMetadata={message.groundingMetadata}
                    onPin={() => {
                        if (message.artifacts && message.artifacts.length > 0) {
                            handlePinArtifact(message.artifacts[0]);
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ChatMessageItem;