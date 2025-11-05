import React, { useState, useMemo } from 'react';
import type { Essay, EssaySection } from '../types';
// Fix: Removed non-existent 'PencilIcon' from imports.
import { AcademicCapIcon, DocumentDuplicateIcon, ArrowDownTrayIcon, ClipboardDocumentCheckIcon, ChevronDownIcon, SparklesIcon, XMarkIcon, TrashIcon, PlusIcon, ArrowPathIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type } from '@google/genai';

interface EssayModalProps {
    initialEssay: Essay;
    onClose: () => void;
    onSave: (essay: Essay) => void;
    systemInstruction: string;
    modelName: string;
}

// Sub-components for each step of the process

const BriefingStep: React.FC<{ essay: Essay; onUpdate: (updates: Partial<Essay>) => void; onNext: () => void; }> = ({ essay, onUpdate, onNext }) => {
    const isReady = essay.topic.trim().length > 3;
    return (
        <div className="p-8 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-text-main mb-2">Comienza tu Ensayo</h2>
            <p className="text-text-secondary mb-8">Define el tema y los parámetros para que SAM cree un esquema a tu medida.</p>
            <div className="space-y-6 flex-1">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-text-secondary mb-1">Tema del Ensayo</label>
                    <input
                        type="text"
                        id="topic"
                        value={essay.topic}
                        onChange={(e) => onUpdate({ topic: e.target.value })}
                        placeholder="Ej: El impacto de la IA en la educación superior"
                        className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main placeholder:text-text-secondary focus:ring-accent focus:border-accent outline-none"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="academicLevel" className="block text-sm font-medium text-text-secondary mb-1">Nivel Académico</label>
                        <select id="academicLevel" value={essay.academicLevel} onChange={e => onUpdate({ academicLevel: e.target.value as any })} className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main focus:ring-accent focus:border-accent outline-none">
                            <option value="high_school">Secundaria</option>
                            <option value="university">Universidad</option>
                            <option value="masters">Maestría</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-text-secondary mb-1">Tono</label>
                        <select id="tone" value={essay.tone} onChange={e => onUpdate({ tone: e.target.value as any })} className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main focus:ring-accent focus:border-accent outline-none">
                            <option value="formal">Formal</option>
                            <option value="persuasive">Persuasivo</option>
                            <option value="analytical">Analítico</option>
                            <option value="expository">Expositivo</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="wordCount" className="block text-sm font-medium text-text-secondary mb-1">Longitud</label>
                        <select id="wordCount" value={essay.wordCountTarget} onChange={e => onUpdate({ wordCountTarget: parseInt(e.target.value) })} className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main focus:ring-accent focus:border-accent outline-none">
                            <option value={500}>~500 palabras</option>
                            <option value={1000}>~1000 palabras</option>
                            <option value={2000}>~2000 palabras</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="mt-8">
                <button onClick={onNext} disabled={!isReady} className="w-full flex items-center justify-center gap-2 bg-accent text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                    <SparklesIcon className="w-5 h-5" />
                    <span>Generar Esquema</span>
                </button>
            </div>
        </div>
    );
};

const OutlineStep: React.FC<{ essay: Essay; onUpdate: (updates: Partial<Essay>) => void; onNext: () => void; }> = ({ essay, onUpdate, onNext }) => {
    
    const handleSectionChange = (id: string, newTitle: string) => {
        const newOutline = essay.outline.map(s => s.id === id ? { ...s, title: newTitle } : s);
        onUpdate({ outline: newOutline });
    };

    const handlePointChange = (sectionId: string, pointIndex: number, newText: string) => {
        const newOutline = essay.outline.map(s => {
            if (s.id === sectionId) {
                const newPoints = [...s.points];
                newPoints[pointIndex] = newText;
                return { ...s, points: newPoints };
            }
            return s;
        });
        onUpdate({ outline: newOutline });
    };
    
    // Add/remove functions
    const addSection = () => {
        const newSection: EssaySection = { id: uuidv4(), title: "Nueva Sección", points: ["Nuevo punto a desarrollar."] };
        onUpdate({ outline: [...essay.outline, newSection] });
    };

    const removeSection = (id: string) => {
        onUpdate({ outline: essay.outline.filter(s => s.id !== id) });
    };

    const addPoint = (sectionId: string) => {
        const newOutline = essay.outline.map(s => {
            if (s.id === sectionId) {
                return { ...s, points: [...s.points, "Nuevo punto."] };
            }
            return s;
        });
        onUpdate({ outline: newOutline });
    };

    const removePoint = (sectionId: string, pointIndex: number) => {
        const newOutline = essay.outline.map(s => {
            if (s.id === sectionId) {
                return { ...s, points: s.points.filter((_, i) => i !== pointIndex) };
            }
            return s;
        });
        onUpdate({ outline: newOutline });
    };


    return (
        <div className="p-8 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-text-main mb-2">Revisa y Edita el Esquema</h2>
            <p className="text-text-secondary mb-6">Ajusta la estructura de tu ensayo. Puedes cambiar títulos, puntos, y añadir o eliminar secciones.</p>
            <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-4">
                {essay.outline.map(section => (
                    <div key={section.id} className="p-4 bg-surface-secondary rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <input 
                                value={section.title} 
                                onChange={e => handleSectionChange(section.id, e.target.value)}
                                className="font-semibold text-text-main bg-transparent outline-none border-b-2 border-transparent focus:border-accent w-full"
                            />
                            <button onClick={() => removeSection(section.id)} className="p-1 text-text-secondary hover:text-danger rounded-full"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                        <ul className="pl-5 space-y-2">
                            {section.points.map((point, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <span className="text-accent">•</span>
                                    <input 
                                        value={point}
                                        onChange={e => handlePointChange(section.id, i, e.target.value)}
                                        className="text-sm text-text-secondary bg-transparent outline-none border-b-2 border-transparent focus:border-accent w-full"
                                    />
                                    <button onClick={() => removePoint(section.id, i)} className="p-1 text-text-secondary hover:text-danger rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                </li>
                            ))}
                            <li>
                               <button onClick={() => addPoint(section.id)} className="flex items-center gap-1 text-sm text-accent hover:underline">
                                   <PlusIcon className="w-3 h-3" />
                                   Añadir punto
                               </button>
                            </li>
                        </ul>
                    </div>
                ))}
                 <div>
                    <button onClick={addSection} className="w-full text-center py-2 border-2 border-dashed border-border-subtle rounded-lg text-text-secondary hover:bg-surface-secondary hover:border-accent transition-colors">
                        Añadir Sección
                    </button>
                </div>
            </div>
            <div className="mt-8">
                <button onClick={onNext} className="w-full bg-accent text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                    Comenzar a Escribir Ensayo
                </button>
            </div>
        </div>
    );
};

const WritingStep: React.FC<{ essay: Essay; onRegenerate: (sectionId: string) => void; onUpdateContent: (sectionId: string, content: string) => void; onSave: () => void }> = ({ essay, onRegenerate, onUpdateContent, onSave }) => {
    
    const fullText = useMemo(() => {
         let text = `# Ensayo sobre: ${essay.topic}\n\n`;
        essay.outline.forEach(section => {
            text += `## ${section.title}\n\n`;
            text += (essay.content[section.id] || '') + '\n\n';
        });
        if(essay.references.length > 0) {
            text += "## Referencias\n\n";
            essay.references.forEach(ref => {
                text += `* ${ref}\n`;
            });
        }
        return text;
    }, [essay]);
    
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(fullText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };
    
    return (
        <div className="flex h-full">
            {/* Left Panel: Outline */}
            <div className="w-1/3 h-full bg-surface-secondary border-r border-border-subtle p-4 flex flex-col">
                <h3 className="text-lg font-bold text-text-main mb-4">Esquema</h3>
                <nav className="flex-1 overflow-y-auto">
                    <ul>
                        {essay.outline.map(section => (
                            <li key={section.id} className={`p-2 rounded-lg ${essay.currentSectionId === section.id ? 'bg-accent/10 text-accent' : ''}`}>
                                <span className="font-semibold text-sm">{section.title}</span>
                                {essay.content[section.id] && <div className="text-xs text-text-secondary mt-1 truncate">{essay.content[section.id]}</div>}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            {/* Right Panel: Content */}
            <div className="w-2/3 h-full p-6 flex flex-col">
                <div className="flex-1 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                     {essay.outline.map(section => (
                        <div key={section.id} className="mb-6 group">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-xl">{section.title}</h4>
                                <button onClick={() => onRegenerate(section.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-surface-secondary">
                                    <ArrowPathIcon className="w-4 h-4 text-text-secondary" />
                                </button>
                            </div>
                            <textarea 
                                value={essay.content[section.id] || ''}
                                onChange={(e) => onUpdateContent(section.id, e.target.value)}
                                className="w-full bg-transparent outline-none resize-none text-text-secondary mt-2 h-auto"
                                placeholder="Escribiendo..."
                            />
                        </div>
                    ))}
                </div>
                <div className="flex-shrink-0 pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
                     <button onClick={handleCopy} className="flex items-center gap-2 text-sm font-medium bg-surface-secondary text-text-main px-3 py-1.5 rounded-lg hover:bg-border-subtle">
                        {copied ? <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                        <span>{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    <button onClick={onSave} className="bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                        Guardar Ensayo
                    </button>
                </div>
            </div>
        </div>
    );
};

// Fix: Using hardcoded API key for consistency with the rest of the project.
const API_KEY = "AIzaSyDB-CXyCAp6CrquNDM7uMq_SoKDITRA9zI";

const EssayModal: React.FC<EssayModalProps> = ({ initialEssay, onClose, onSave, systemInstruction, modelName }) => {
    const [essay, setEssay] = useState<Essay>(initialEssay);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const updateEssay = (updates: Partial<Essay>) => {
        setEssay(prev => ({ ...prev, ...updates }));
    };

    const handleGenerateOutline = async () => {
        updateEssay({ status: 'outlining' });
        
        const prompt = `Topic: "${essay.topic}", Level: ${essay.academicLevel}, Tone: ${essay.tone}, Word Count: ~${essay.wordCountTarget}`;
        
        // Fix: Replaced mocked fetch with a real Gemini API call for generating the outline.
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            outline: {
                                type: Type.ARRAY,
                                description: "The essay outline, with each object being a section.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING, description: "The title of the essay section." },
                                        points: {
                                            type: Type.ARRAY,
                                            description: "An array of strings, where each string is a key point to cover in this section.",
                                            items: { type: Type.STRING }
                                        },
                                    },
                                    required: ['title', 'points'],
                                },
                            },
                        },
                        required: ['outline'],
                    },
                },
            });

            const result = JSON.parse(response.text);
            const outlineFromApi: Omit<EssaySection, 'id'>[] = result.outline;
            
            updateEssay({ outline: outlineFromApi.map(s => ({...s, id: uuidv4()})), status: 'editing_outline' });
        } catch (e) {
             console.error("Error generating outline:", e);
             // Simulate a generic outline on error
            const fallbackOutline: EssaySection[] = [
                { id: uuidv4(), title: 'Introducción', points: ['Presentar el tema y la tesis.'] },
                { id: uuidv4(), title: 'Desarrollo Principal', points: ['Argumento 1.', 'Argumento 2.'] },
                { id: uuidv4(), title: 'Conclusión', points: ['Resumir los puntos y reafirmar la tesis.'] }
            ];
            updateEssay({ outline: fallbackOutline, status: 'editing_outline' });
        }
    };
    
    const handleStartWriting = async () => {
        updateEssay({ status: 'writing' });
        abortControllerRef.current = new AbortController();
        
        // Fix: Replaced simulated writing with a real streaming Gemini API call.
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        for (const section of essay.outline) {
            if (abortControllerRef.current.signal.aborted) break;
            updateEssay({ currentSectionId: section.id });

            const prompt = `Essay Topic: "${essay.topic}"\nFull Outline: ${JSON.stringify(essay.outline)}\n\nCurrent Section to Write: "${section.title}"\nKey Points for this section: ${section.points.join(', ')}`;
            
            try {
                const resultStream = await ai.models.generateContentStream({
                    model: modelName,
                    contents: prompt,
                    config: { systemInstruction },
                });

                if (abortControllerRef.current.signal.aborted) break;

                let currentText = '';
                for await (const chunk of resultStream) {
                    if (abortControllerRef.current.signal.aborted) break;
                    const chunkText = chunk.text;
                    if (chunkText) {
                        currentText += chunkText;
                        setEssay(prev => ({
                            ...prev,
                            content: { ...prev.content, [section.id]: currentText }
                        }));
                    }
                }
            } catch (e) {
                console.error(`Error generating content for section ${section.title}:`, e);
                setEssay(prev => ({
                     ...prev,
                     content: { ...prev.content, [section.id]: "Error generating content for this section." }
                 }));
            }
        }
        if (!abortControllerRef.current?.signal.aborted) {
            updateEssay({ status: 'complete', currentSectionId: undefined });
        }
    };

    const handleRegenerateSection = (sectionId: string) => {
        console.log("Regenerating section:", sectionId);
        // Add logic to call Gemini API to regenerate content for a specific section
    };
    
    const handleUpdateContent = (sectionId: string, content: string) => {
        updateEssay({ content: { ...essay.content, [sectionId]: content } });
    };
    
    const handleClose = () => {
        abortControllerRef.current?.abort();
        onClose();
    };


    const renderCurrentStep = () => {
        switch (essay.status) {
            case 'briefing':
                return <BriefingStep essay={essay} onUpdate={updateEssay} onNext={handleGenerateOutline} />;
            case 'outlining':
                return <div className="p-8 text-center">Generando esquema... <SparklesIcon className="w-6 h-6 inline-block animate-pulse" /></div>;
            case 'editing_outline':
                return <OutlineStep essay={essay} onUpdate={updateEssay} onNext={handleStartWriting} />;
            case 'writing':
            case 'complete':
                return <WritingStep essay={essay} onRegenerate={handleRegenerateSection} onUpdateContent={handleUpdateContent} onSave={() => onSave(essay)} />;
            default:
                return <div>Hubo un error.</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-surface-primary rounded-2xl max-w-4xl w-full h-[90vh] shadow-2xl animate-fade-in-up border border-border-subtle flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-border-subtle flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-6 h-6 text-accent" />
                        <h3 className="text-xl font-semibold text-text-main">Compositor de Ensayos</h3>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-surface-secondary">
                        <XMarkIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </header>
                <main className="flex-1 overflow-hidden">
                    {renderCurrentStep()}
                </main>
            </div>
        </div>
    );
};

// Renaming the export to match the new component name
export default EssayModal;
