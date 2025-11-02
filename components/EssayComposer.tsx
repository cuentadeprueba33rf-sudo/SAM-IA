import React, { useState, useMemo } from 'react';
import type { Essay } from '../types';
import { AcademicCapIcon, DocumentDuplicateIcon, ArrowDownTrayIcon, ClipboardDocumentCheckIcon, ChevronDownIcon } from './icons';

interface EssayCardProps {
    essay: Essay;
}

const TypingIndicator: React.FC = () => (
    <div className="typing-indicator ml-2 inline-block">
        <span className="h-1.5 w-1.5 bg-current rounded-full"></span>
        <span className="h-1.5 w-1.5 bg-current rounded-full"></span>
        <span className="h-1.5 w-1.5 bg-current rounded-full"></span>
    </div>
);

const AccordionSection: React.FC<{
    title: string;
    points?: string[];
    content: string;
    status: Essay['status'];
    isCurrent: boolean;
    isInitiallyOpen: boolean;
}> = ({ title, points, content, status, isCurrent, isInitiallyOpen }) => {
    const [isOpen, setIsOpen] = useState(isInitiallyOpen);

    React.useEffect(() => {
        if (isCurrent) {
            setIsOpen(true);
        }
    }, [isCurrent]);

    return (
        <div className="border-b border-border-subtle last:border-b-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left">
                <h3 className={`font-semibold text-text-main flex items-center ${isCurrent ? 'text-accent' : ''}`}>
                    {title}
                    {isCurrent && status === 'writing' && <TypingIndicator />}
                </h3>
                <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 pt-0">
                    {points && points.length > 0 && (
                        <ul className="pl-5 mb-3 space-y-1 list-disc">
                            {points.map((point, i) => (
                                <li key={i} className="text-sm text-text-secondary">{point}</li>
                            ))}
                        </ul>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words text-text-main">
                        <p>{content}</p>
                        {isCurrent && status === 'writing' && content && <div className="inline-block"><TypingIndicator/></div>}
                    </div>
                </div>
            )}
        </div>
    );
};


const EssayCard: React.FC<EssayCardProps> = ({ essay }) => {
    const [copied, setCopied] = useState(false);
    
    const fullText = useMemo(() => {
        let text = `# Ensayo sobre: ${essay.topic}\n\n`;
        essay.outline.forEach(section => {
            text += `## ${section.title}\n\n`;
            text += (essay.content[section.title] || '') + '\n\n';
        });
        if(essay.references.length > 0) {
            text += "## Referencias\n\n";
            essay.references.forEach(ref => {
                text += `* ${ref}\n`;
            });
        }
        return text;
    }, [essay]);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handleDownload = () => {
        const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${essay.topic.replace(/ /g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-2xl w-full bg-surface-primary rounded-2xl shadow-md border border-border-subtle overflow-hidden">
            <header className="flex items-center gap-4 p-4 border-b border-border-subtle">
                <div className="p-2 bg-accent/10 rounded-lg">
                    <AcademicCapIcon className="w-6 h-6 text-accent" />
                </div>
                <div>
                    <h2 className="font-bold text-text-main">Compositor de Ensayos</h2>
                    <p className="text-sm text-text-secondary truncate">{essay.topic}</p>
                </div>
            </header>
            
            <main className="flex flex-col">
                {essay.status === 'outlining' ? (
                    <div className="p-4 text-center text-text-secondary">
                        <p>Generando esquema...</p>
                        <TypingIndicator />
                    </div>
                ) : (
                    <>
                        {essay.outline.map((section, index) => (
                             <AccordionSection
                                key={section.title}
                                title={section.title}
                                points={section.points}
                                content={essay.content[section.title] || ''}
                                status={essay.status}
                                isCurrent={essay.currentSection === section.title}
                                isInitiallyOpen={index === 0}
                            />
                        ))}
                         <AccordionSection
                            key="references"
                            title="Referencias"
                            content={essay.references.join('\n')}
                            status={essay.status}
                            isCurrent={essay.currentSection === 'References'}
                            isInitiallyOpen={false}
                        />
                    </>
                )}
            </main>

            {essay.status === 'complete' && (
                 <footer className="p-3 bg-surface-secondary/50 border-t border-border-subtle flex items-center justify-end gap-2">
                     <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-medium bg-surface-secondary text-text-main px-3 py-1.5 rounded-lg hover:bg-border-subtle">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>Descargar</span>
                    </button>
                    <button onClick={handleCopy} className="flex items-center gap-2 text-sm font-medium bg-accent text-white px-3 py-1.5 rounded-lg hover:opacity-90">
                        {copied ? <ClipboardDocumentCheckIcon className="w-4 h-4" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                        <span>{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                </footer>
            )}
             <style>{`
                 .typing-indicator span { animation: wave 1.4s infinite ease-in-out both; margin: 0 1px; } 
                 .typing-indicator span:nth-of-type(1) { animation-delay: -0.4s; } 
                 .typing-indicator span:nth-of-type(2) { animation-delay: -0.2s; } 
                 @keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-3px); } }
            `}</style>
        </div>
    );
};

export default EssayCard;
