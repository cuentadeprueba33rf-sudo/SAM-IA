import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MessageAuthor } from '../types';
import type { ChatMessage, Attachment, Essay } from '../types';
import MessageActions from './MessageActions';
import { DocumentTextIcon, GlobeAltIcon, CodeBracketIcon, AcademicCapIcon, SparklesIcon, ShareIcon } from './icons';


// A more robust markdown parser that handles code blocks and images separately.
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
    const images: string[] = [];
    
    // 1. Extract code blocks
    let processedText = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const escapedCode = escapeHtml(code);
        codeBlocks.push(`<pre class="bg-surface-secondary p-3 rounded-md not-prose"><code class="language-${lang}">${escapedCode}</code></pre>`);
        return `__CODEBLOCK_${codeBlocks.length - 1}__`;
    });
    
    // 2. Extract images
    processedText = processedText.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
        const escapedAlt = escapeHtml(alt);
        // Do not escape src, as it's a URL
        images.push(`<img src="${src}" alt="${escapedAlt}" class="rounded-lg my-2 max-w-full h-auto cursor-pointer" />`);
        return `__IMAGE_${images.length - 1}__`;
    });
    
    // 3. Escape the rest of the HTML
    processedText = escapeHtml(processedText);
    
    // 4. Apply other markdown formatting
    processedText = processedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    processedText = processedText.replace(/^\s*-\s(.*)/gm, '<li>$1</li>');
    const listMatches = processedText.match(/(<li>.*<\/li>)/s);
    if(listMatches) {
        processedText = processedText.replace(listMatches[0], `<ul class="list-disc pl-5">${listMatches[0]}</ul>`);
    }

    // 5. Re-insert images and code blocks
    processedText = processedText.replace(/__IMAGE_(\d+)__/g, (match, index) => {
        return images[parseInt(index, 10)];
    });
     processedText = processedText.replace(/__CODEBLOCK_(\d+)__/g, (match, index) => {
        return codeBlocks[parseInt(index, 10)];
    });

    return { __html: processedText };
};


declare global {
    interface Window {
      renderMath: () => void;
      anime: any;
    }
}

const CognitiveArchitect: React.FC<{ mapData: { nodes: any[], edges: any[] } }> = ({ mapData }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [viewBox, setViewBox] = useState('0 0 500 400');

    useEffect(() => {
        if (!mapData || !svgRef.current || typeof window.anime === 'undefined') return;

        const { nodes, edges } = mapData;
        const svg = svgRef.current;
        svg.innerHTML = ''; // Clear previous render

        const width = 500;
        const height = 400;
        setViewBox(`0 0 ${width} ${height}`);

        const center = { x: width / 2, y: height / 2 };

        const positions: { [key: string]: { x: number, y: number } } = {};
        const level0 = nodes.find(n => n.level === 0);
        const level1 = nodes.filter(n => n.level === 1);

        if (level0) {
            positions[level0.id] = center;
        }

        const radius1 = Math.min(width, height) / 3.5;
        level1.forEach((node, i) => {
            const angle = (i / level1.length) * 2 * Math.PI - Math.PI / 2; // Start from top
            positions[node.id] = {
                x: center.x + radius1 * Math.cos(angle),
                y: center.y + radius1 * Math.sin(angle),
            };
        });
        
        const radius2 = Math.min(width, height) / 2.5;
        level1.forEach((l1Node) => {
            const children = edges.filter(e => e.from === l1Node.id).map(e => nodes.find(n => n.id === e.to)).filter(n => n && n.level === 2);
            const parentPos = positions[l1Node.id];
            
            children.forEach((child, i) => {
                if (!child) return;
                const parentAngle = Math.atan2(parentPos.y - center.y, parentPos.x - center.x);
                const spreadAngle = children.length > 1 ? Math.PI / 6 : 0;
                const childAngle = parentAngle - spreadAngle / 2 + (i / (children.length - 1 || 1)) * spreadAngle;
                
                positions[child.id] = {
                    x: parentPos.x + (radius2 - radius1) * Math.cos(childAngle),
                    y: parentPos.y + (radius2 - radius1) * Math.sin(childAngle),
                };
            });
        });

        const gEdges = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const gNodes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(gEdges);
        svg.appendChild(gNodes);

        edges.forEach(edge => {
            const fromPos = positions[edge.from];
            const toPos = positions[edge.to];
            if (!fromPos || !toPos) return;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            const pathData = `M${fromPos.x},${fromPos.y} A${dr},${dr} 0 0,1 ${toPos.x},${toPos.y}`;
            
            line.setAttribute('d', pathData);
            line.setAttribute('stroke', 'var(--color-border-subtle)');
            line.setAttribute('stroke-width', '1.5');
            line.setAttribute('fill', 'none');
            line.setAttribute('class', 'edge-line');
            gEdges.appendChild(line);
        });

        nodes.forEach(node => {
            const pos = positions[node.id];
            if (!pos) return;

            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.setAttribute('class', 'node-group');
            nodeGroup.style.opacity = '0';

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const radius = node.level === 0 ? 12 : node.level === 1 ? 9 : 6;
            circle.setAttribute('cx', String(pos.x));
            circle.setAttribute('cy', String(pos.y));
            circle.setAttribute('r', String(radius));
            circle.setAttribute('stroke', 'var(--color-accent)');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('fill', 'var(--color-surface-primary)');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', String(pos.x));
            text.setAttribute('y', String(pos.y > center.y ? pos.y + radius + 14 : pos.y - radius - 8));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', 'var(--color-text-secondary)');
            text.setAttribute('font-weight', '500');
            text.textContent = node.label;

            nodeGroup.appendChild(circle);
            nodeGroup.appendChild(text);
            gNodes.appendChild(nodeGroup);
        });

        const tl = window.anime.timeline({
            easing: 'easeOutExpo',
            duration: 750
        });

        tl.add({
            targets: '.edge-line',
            strokeDashoffset: [window.anime.setDashoffset, 0],
            delay: window.anime.stagger(50)
        }).add({
            targets: '.node-group',
            opacity: [0, 1],
            translateY: [-10, 0],
            delay: window.anime.stagger(75)
        }, '-=500');

    }, [mapData]);

    return (
        <div className="my-2 p-2 bg-surface-primary border border-border-subtle rounded-lg animate-fade-in">
            <svg ref={svgRef} viewBox={viewBox} width="100%" height="auto" style={{ minHeight: '300px' }}></svg>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};


interface ChatMessageItemProps {
    message: ChatMessage;
    isStreaming: boolean;
    onPreviewImage: (attachment: Attachment) => void;
    onOpenEssay: (essay: Essay, messageId: string) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isStreaming, onPreviewImage, onOpenEssay }) => {
    
    const contentRef = useRef<HTMLDivElement>(null);
    
    const wordCount = useMemo(() => {
        if (!message.essayContent) return 0;
        return Object.values(message.essayContent.content).reduce((acc: number, sectionText) => {
            if (typeof sectionText === 'string') {
                return acc + (sectionText.split(/\s+/).filter(Boolean).length);
            }
            return acc;
        }, 0);
    }, [message.essayContent]);

    useEffect(() => {
        if (typeof window.renderMath === 'function') {
            window.renderMath();
        }
    }, [message.text, isStreaming]);

    const { mapData, architectText, isArchitectMode, isArchitectLoading } = useMemo(() => {
        if (message.mode !== 'architect') {
            return { mapData: null, architectText: message.text, isArchitectMode: false, isArchitectLoading: false };
        }

        const delimiter = '---MAP_END---';
        const parts = message.text.split(delimiter);
        const hasDelimiter = message.text.includes(delimiter);

        let parsedMap = null;
        try {
            parsedMap = JSON.parse(parts[0]);
            if (!parsedMap.nodes || !parsedMap.edges) parsedMap = null; // Basic validation
        } catch (e) {
            parsedMap = null;
        }

        const isLoading = isStreaming && !parsedMap;
        const finalArchitectText = hasDelimiter ? parts.slice(1).join(delimiter) : '';

        return {
            mapData: parsedMap,
            architectText: finalArchitectText,
            isArchitectMode: true,
            isArchitectLoading: isLoading
        };
    }, [message.text, message.mode, isStreaming]);

    const textToDisplay = message.text;
    const parsedContent = useMemo(() => parseMarkdown(textToDisplay), [textToDisplay]);
    const parsedArchitectContent = useMemo(() => parseMarkdown(architectText), [architectText]);


    // Effect to handle clicks on dynamically rendered images from markdown
    useEffect(() => {
        const contentDiv = contentRef.current;
        if (!contentDiv) return;

        const handleImageClick = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG' && target.hasAttribute('src')) {
                onPreviewImage({
                    name: target.getAttribute('alt') || 'Imagen de la web',
                    type: 'image/jpeg', // Assumption, can't know for sure
                    data: target.getAttribute('src')!
                });
            }
        };

        contentDiv.addEventListener('click', handleImageClick);
        return () => {
            contentDiv.removeEventListener('click', handleImageClick);
        };
    }, [parsedContent, parsedArchitectContent, onPreviewImage]);

    if (message.author === MessageAuthor.SYSTEM) {
        return (
            <div className="py-4 flex justify-center w-full">
                <div className="flex items-center gap-2 text-sm text-text-secondary px-3 py-1.5 bg-surface-secondary rounded-full">
                    <SparklesIcon className="w-4 h-4 text-accent" />
                    <span>{message.text}</span>
                </div>
            </div>
        );
    }

    const isUser = message.author === MessageAuthor.USER;
    
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
                         <div className="p-4 rounded-lg bg-surface-primary border border-border-subtle">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-accent/10 rounded-full mt-1">
                                    <AcademicCapIcon className="w-6 h-6 text-accent"/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main">Ensayo: {message.essayContent.topic}</h4>
                                    <p className="text-xs text-text-secondary">{wordCount} / {message.essayContent.wordCountTarget} palabras</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-3 mb-4">
                               {message.essayContent.outline.map(s => message.essayContent.content[s.id]).join(' ').substring(0, 200)}...
                            </p>
                            <button 
                                onClick={() => onOpenEssay(message.essayContent!, message.id)}
                                className="w-full text-center bg-surface-secondary text-text-main font-semibold px-4 py-2 rounded-lg hover:bg-border-subtle transition-colors text-sm"
                            >
                                Abrir en el Compositor
                            </button>
                        </div>
                    )}
                    
                    {isArchitectMode && (
                        <>
                            {isArchitectLoading && !mapData && (
                                <div className="flex items-center gap-2 text-text-secondary text-sm p-2">
                                    <ShareIcon className="w-4 h-4 animate-pulse" />
                                    <span>Construyendo mapa cognitivo...</span>
                                </div>
                            )}
                            {mapData && <CognitiveArchitect mapData={mapData} />}
                        </>
                    )}

                    {isArchitectMode ? (
                        architectText && <div ref={contentRef} className={`prose prose-sm dark:prose-invert max-w-none break-words ${isStreaming && !mapData ? 'streaming-message' : ''}`} dangerouslySetInnerHTML={parsedArchitectContent} />
                    ) : textToDisplay && !message.essayContent ? (
                        <div ref={contentRef} className={`prose prose-sm dark:prose-invert max-w-none break-words ${isStreaming ? 'streaming-message' : ''}`} dangerouslySetInnerHTML={parsedContent} />
                    ) : null}
                    
                    {message.generatingArtifact && (
                        <div className="flex items-center gap-2 text-text-secondary mt-2 text-sm">
                            <CodeBracketIcon className="w-4 h-4 animate-pulse" />
                            <span>Generando componente...</span>
                        </div>
                    )}
                </div>
                
                {!isArchitectLoading && (
                    <MessageActions 
                        message={message}
                        text={isArchitectMode ? architectText : message.text}
                        groundingMetadata={message.groundingMetadata}
                        onPin={() => {}}
                        isPinned={false}
                    />
                )}
            </div>
        </div>
    );
};

export default ChatMessageItem;