import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Essay, EssaySection, ModelType } from '../types';
import { AcademicCapIcon, DocumentDuplicateIcon, ArrowDownTrayIcon, ClipboardDocumentCheckIcon, SparklesIcon, XMarkIcon, TrashIcon, PlusIcon, ArrowPathIcon, CheckIcon, ExclamationTriangleIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';
import { generateEssayOutline, streamEssaySection, generateEssayReferences } from '../services/geminiService';

interface EssayComposerProps {
    initialEssay: Essay;
    onClose: () => void;
    onSave: (essay: Essay) => void;
    systemInstruction: string;
    modelName: ModelType;
}

type EssayStatus = 'briefing' | 'generating_outline' | 'editing_outline' | 'generating_section' | 'generating_refs' | 'idle' | 'error';


const EssayComposer: React.FC<EssayComposerProps> = ({ initialEssay, onClose, onSave, systemInstruction, modelName }) => {
    const [essay, setEssay] = useState<Essay>(initialEssay);
    const [status, setStatus] = useState<EssayStatus>(initialEssay.outline.length > 0 ? 'idle' : 'briefing');
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const workspaceRef = useRef<HTMLTextAreaElement>(null);

    const wordCount = useMemo(() => {
        return Object.values(essay.content).reduce((acc: number, sectionText) => {
            if (typeof sectionText === 'string') {
                return acc + (sectionText.split(/\s+/).filter(Boolean).length);
            }
            return acc;
        }, 0);
    }, [essay.content]);

    useEffect(() => {
        // Auto-select the first section when outline is ready
        if ((status === 'editing_outline' || status === 'idle') && essay.outline.length > 0 && !activeSectionId) {
            setActiveSectionId(essay.outline[0].id);
        }
    }, [status, essay.outline, activeSectionId]);

    const updateEssay = (updates: Partial<Essay>) => {
        setEssay(prev => ({ ...prev, ...updates }));
    };

    const handleGenerateOutline = async () => {
        setStatus('generating_outline');
        setErrorMessage(null);
        const prompt = `Topic: "${essay.topic}", Level: ${essay.academicLevel}, Tone: ${essay.tone}, Word Count: ~${essay.wordCountTarget}`;
        try {
            const outlineFromApi = await generateEssayOutline({ prompt, systemInstruction, modelName });
            const outlineWithIds = outlineFromApi.map(s => ({ ...s, id: uuidv4() }));
            // Add a dedicated references section
            outlineWithIds.push({ id: 'references', title: 'Referencias', points: [] });
            updateEssay({ outline: outlineWithIds });
            setStatus('editing_outline');
        } catch (e) {
            console.error("Error generating outline:", e);
            setErrorMessage(e instanceof Error ? e.message : 'Ocurrió un error desconocido.');
            setStatus('error');
        }
    };

    const handleGenerateSection = useCallback(async (sectionId: string) => {
        const section = essay.outline.find(s => s.id === sectionId);
        if (!section || status === 'generating_section') return;

        setStatus('generating_section');
        setErrorMessage(null);
        abortControllerRef.current = new AbortController();
        updateEssay({ content: { ...essay.content, [sectionId]: '' } }); // Clear previous content

        const prompt = `Essay Topic: "${essay.topic}"\nFull Outline: ${JSON.stringify(essay.outline)}\n\nCurrent Section to Write: "${section.title}"\nKey Points for this section: ${section.points.join(', ')}`;
        
        try {
            let currentText = '';
            await streamEssaySection({
                prompt,
                systemInstruction,
                modelName,
                abortSignal: abortControllerRef.current.signal,
                onUpdate: (chunk) => {
                    currentText += chunk;
                    setEssay(prev => ({
                        ...prev,
                        content: { ...prev.content, [sectionId]: currentText }
                    }));
                }
            });
        } catch (e) {
            const err = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
            console.error(`Error generating content for section ${section.title}:`, e);
            setErrorMessage(err);
            setEssay(prev => ({
                 ...prev,
                 content: { ...prev.content, [sectionId]: `Error: ${err}` }
             }));
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                setStatus('idle');
            }
        }
    }, [essay, modelName, systemInstruction, status]);

    const handleGenerateReferences = async () => {
        setStatus('generating_refs');
        setErrorMessage(null);
        const fullText = essay.outline
            .map(s => essay.content[s.id] || '')
            .join('\n\n');
        
        const prompt = `Based on the following essay, please generate a list of relevant references.\n\n---\n\n${fullText}`;

        try {
            const refs = await generateEssayReferences({ prompt, systemInstruction, modelName });
            updateEssay({ references: refs });
        } catch(e) {
            const err = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
            console.error("Error generating references:", e);
            setErrorMessage(err);
            updateEssay({ references: [`Hubo un error: ${err}`] });
        } finally {
            setStatus('idle');
        }
    };
    
    const handleClose = () => {
        abortControllerRef.current?.abort();
        onClose();
    };

    const copyAsMarkdown = () => {
        let text = `# ${essay.topic}\n\n`;
        essay.outline.forEach(section => {
            if(section.id === 'references') return;
            text += `## ${section.title}\n\n`;
            text += (essay.content[section.id] || '') + '\n\n';
        });
        if (essay.references.length > 0) {
            text += "## Referencias\n\n";
            essay.references.forEach(ref => {
                text += `* ${ref}\n`;
            });
        }
        navigator.clipboard.writeText(text);
    };

    const downloadAsTxt = () => {
         let text = `${essay.topic}\n\n`;
        essay.outline.forEach(section => {
            if(section.id === 'references') return;
            text += `${section.title}\n\n`;
            text += (essay.content[section.id] || '') + '\n\n';
        });
        if (essay.references.length > 0) {
            text += "Referencias\n\n";
            essay.references.forEach(ref => {
                text += `- ${ref}\n`;
            });
        }
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${essay.topic.replace(/\s/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };
    

    const renderBriefing = () => (
        <div className="p-8 flex flex-col h-full max-w-2xl mx-auto">
             <div className="text-center">
                <h2 className="text-2xl font-bold text-text-main mb-2">Comienza tu Ensayo</h2>
                <p className="text-text-secondary mb-8">Define el tema y los parámetros para que SAM cree un esquema a tu medida.</p>
            </div>
            {status === 'error' && errorMessage && (
                <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm my-4 flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}
            <div className="space-y-6 flex-1">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-text-secondary mb-1">Tema del Ensayo</label>
                    <input type="text" id="topic" value={essay.topic} onChange={(e) => updateEssay({ topic: e.target.value })} placeholder="Ej: El impacto de la IA en la educación superior" className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main placeholder:text-text-secondary focus:ring-accent focus:border-accent outline-none"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="academicLevel" className="block text-sm font-medium text-text-secondary mb-1">Nivel Académico</label>
                        <select id="academicLevel" value={essay.academicLevel} onChange={e => updateEssay({ academicLevel: e.target.value as any })} className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main focus:ring-accent focus:border-accent outline-none">
                            <option value="high_school">Secundaria</option>
                            <option value="university">Universidad</option>
                            <option value="masters">Maestría</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-text-secondary mb-1">Tono</label>
                        <select id="tone" value={essay.tone} onChange={e => updateEssay({ tone: e.target.value as any })} className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main focus:ring-accent focus:border-accent outline-none">
                            <option value="formal">Formal</option>
                            <option value="persuasive">Persuasivo</option>
                            <option value="analytical">Analítico</option>
                            <option value="expository">Expositivo</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="wordCount" className="block text-sm font-medium text-text-secondary mb-1">Longitud</label>
                        <select id="wordCount" value={essay.wordCountTarget} onChange={e => updateEssay({ wordCountTarget: parseInt(e.target.value) })} className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main focus:ring-accent focus:border-accent outline-none">
                            <option value={500}>~500 palabras</option>
                            <option value={1000}>~1000 palabras</option>
                            <option value={2000}>~2000 palabras</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="mt-8">
                <button onClick={handleGenerateOutline} disabled={essay.topic.trim().length < 5 || status === 'generating_outline'} className="w-full flex items-center justify-center gap-2 bg-accent text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                    {status === 'generating_outline' ? 'Generando...' : 'Generar Esquema'}
                </button>
            </div>
        </div>
    );
    
    const renderWorkspace = () => {
        const activeSection = essay.outline.find(s => s.id === activeSectionId);
        return (
            <div className="flex h-full">
                {/* Left Panel: Outline */}
                <div className="w-1/3 h-full bg-surface-secondary border-r border-border-subtle p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-text-main mb-4 px-2">Esquema del Ensayo</h3>
                    <nav className="flex-1 overflow-y-auto space-y-1">
                        {essay.outline.map(section => (
                            <button key={section.id} onClick={() => setActiveSectionId(section.id)} className={`w-full text-left p-2 rounded-lg transition-colors ${activeSectionId === section.id ? 'bg-accent/10' : 'hover:bg-border-subtle'}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`font-semibold text-sm ${activeSectionId === section.id ? 'text-accent' : 'text-text-main'}`}>{section.title}</span>
                                    {status === 'generating_section' && essay.content[section.id] === '' ? <SparklesIcon className="w-4 h-4 text-accent animate-pulse"/> : (essay.content[section.id] || (section.id === 'references' && essay.references.length > 0)) && <CheckIcon className="w-4 h-4 text-green-500"/>}
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>
                {/* Right Panel: Content */}
                <div className="w-2/3 h-full p-6 flex flex-col">
                    {activeSection?.id === 'references' ? (
                        <>
                            <h4 className="font-bold text-2xl text-text-main mb-4">{activeSection.title}</h4>
                            <div className="flex-1 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                                {essay.references.length > 0 ? (
                                    <ul>{essay.references.map((ref, i) => <li key={i}>{ref}</li>)}</ul>
                                ) : (
                                    <p className="text-text-secondary">Aún no se han generado referencias.</p>
                                )}
                            </div>
                            <div className="flex-shrink-0 pt-4 flex items-center justify-end">
                                <button onClick={handleGenerateReferences} disabled={status === 'generating_refs'} className="bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                    {status === 'generating_refs' ? 'Generando...' : 'Generar Referencias'}
                                </button>
                            </div>
                        </>
                    ) : activeSection ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                               <h4 className="font-bold text-2xl text-text-main">{activeSection.title}</h4>
                                <button onClick={() => handleGenerateSection(activeSectionId!)} disabled={status === 'generating_section'} className="flex items-center gap-1.5 text-sm font-medium bg-surface-secondary text-text-main px-3 py-1.5 rounded-lg hover:bg-border-subtle disabled:opacity-50">
                                    <ArrowPathIcon className={`w-4 h-4 ${status === 'generating_section' ? 'animate-spin' : ''}`} />
                                    <span>{essay.content[activeSectionId!] ? 'Regenerar' : 'Generar'}</span>
                                </button>
                            </div>
                            <textarea 
                                ref={workspaceRef}
                                value={essay.content[activeSectionId!] || ''}
                                onChange={(e) => updateEssay({ content: { ...essay.content, [activeSectionId!]: e.target.value } })}
                                className="w-full h-full bg-transparent outline-none resize-none text-text-main text-base leading-relaxed"
                                placeholder="Genera o escribe el contenido para esta sección..."
                            />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-text-secondary">Selecciona una sección para comenzar.</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 sm:p-4" onClick={handleClose}>
            <div className="bg-surface-primary rounded-none sm:rounded-2xl max-w-5xl w-full h-full sm:h-[90vh] shadow-2xl animate-fade-in-up border border-border-subtle flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-border-subtle flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-6 h-6 text-accent" />
                        <h3 className="text-xl font-semibold text-text-main">Compositor de Ensayos</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-secondary">
                            <XMarkIcon className="w-6 h-6 text-text-secondary" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-hidden relative">
                    {status === 'briefing' || status === 'generating_outline' || status === 'error' ? renderBriefing() : renderWorkspace()}
                </main>
                 {status !== 'briefing' && (
                     <footer className="p-3 border-t border-border-subtle flex-shrink-0 flex items-center justify-between">
                         <div className="text-sm text-text-secondary">
                             {wordCount} / {essay.wordCountTarget} palabras
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={copyAsMarkdown} className="text-sm font-medium bg-surface-secondary text-text-main px-3 py-1.5 rounded-lg hover:bg-border-subtle">Copiar</button>
                            <button onClick={downloadAsTxt} className="text-sm font-medium bg-surface-secondary text-text-main px-3 py-1.5 rounded-lg hover:bg-border-subtle">Descargar</button>
                             <button onClick={() => onSave(essay)} className="bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm">
                                Guardar en el Chat
                            </button>
                         </div>
                     </footer>
                 )}
            </div>
        </div>
    );
};

export default EssayComposer;