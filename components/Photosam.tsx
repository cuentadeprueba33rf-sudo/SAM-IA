import React, { useState, useRef } from 'react';
import type { Attachment } from '../types';
import { ChevronLeftIcon, ShareIcon, ArrowDownTrayIcon, PlusIcon, SparklesIcon, XMarkIcon, PhotoIcon } from './icons';
import { generatePhotosamImage } from '../services/geminiService';

interface PhotosamProps {
    onNavigateBack: () => void;
    onShareToChat: (prompt: string, image: Attachment) => void;
}

const ImageUploader: React.FC<{ onUpload: (attachment: Attachment) => void; children: React.ReactNode; className?: string }> = ({ onUpload, children, className = '' }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                onUpload({ name: file.name, type: file.type, data: event.target.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={className} onClick={() => inputRef.current?.click()}>
            <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} className="hidden" />
            {children}
        </div>
    );
};

const Photosam: React.FC<PhotosamProps> = ({ onNavigateBack, onShareToChat }) => {
    const [mainImage, setMainImage] = useState<Attachment | null>(null);
    const [ingredients, setIngredients] = useState<(Attachment | null)[]>(Array(4).fill(null));
    const [addIngredients, setAddIngredients] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [activeStyle, setActiveStyle] = useState('Realista');
    const [isLoading, setIsLoading] = useState(false);
    const [thinkingMessage, setThinkingMessage] = useState('');
    const [resultImage, setResultImage] = useState<Attachment | null>(null);
    const [error, setError] = useState('');

    const styles = ['Realista', 'Animado', 'Comics', 'Pixelado'];

    const handleIngredientUpload = (attachment: Attachment, index: number) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = attachment;
        setIngredients(newIngredients);
    };
    
    const removeIngredient = (index: number) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = null;
        setIngredients(newIngredients);
    }

    const handleGenerate = async () => {
        if (!prompt && !mainImage) {
            setError('Por favor, añade un prompt o una imagen para empezar.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResultImage(null);

        const thinkingMessages = [
            "Consultando al modelo SM-l3...",
            "Mezclando píxeles y prompts...",
            "Dando forma a la creatividad...",
            "Casi listo...",
        ];
        let i = 0;
        const interval = setInterval(() => {
            setThinkingMessage(thinkingMessages[i % thinkingMessages.length]);
            i++;
        }, 1500);

        try {
            const result = await generatePhotosamImage({
                prompt,
                style: activeStyle,
                mainImage,
                ingredients: addIngredients ? ingredients : [],
            });
            setResultImage(result);
        } catch (e: any) {
            setError(e.message || 'Ocurrió un error al generar la imagen.');
        } finally {
            setIsLoading(false);
            clearInterval(interval);
            setThinkingMessage('');
        }
    };

    const handleShare = () => {
        if (resultImage) {
            const sharePrompt = `${prompt}${mainImage ? ' (editado)' : ''} [${activeStyle}]`;
            onShareToChat(sharePrompt, resultImage);
            onNavigateBack();
        }
    };
    
    const handleDownload = () => {
        if(!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage.data;
        link.download = resultImage.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderDisplay = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <SparklesIcon className="w-16 h-16 text-accent animate-pulse mb-4" />
                    <p className="text-lg font-semibold text-text-main">Pensando...</p>
                    <p className="text-text-secondary transition-opacity duration-300">{thinkingMessage}</p>
                </div>
            );
        }
        if (error) {
            return <div className="flex items-center justify-center h-full text-center text-danger p-4">{error}</div>;
        }
        if (resultImage) {
            return <img src={resultImage.data} alt="Generated result" className="w-full h-full object-contain" />;
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-4">
                <PhotoIcon className="w-24 h-24 mb-4"/>
                <p>Tu próxima creación aparecerá aquí.</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-bg-main">
            <header className="flex items-center p-4 border-b border-border-subtle flex-shrink-0">
                <button onClick={onNavigateBack} className="p-2 rounded-full hover:bg-surface-secondary">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold ml-4">Photosam</h1>
                 {resultImage && (
                    <div className="ml-auto flex items-center gap-2">
                        <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-medium bg-surface-secondary px-3 py-1.5 rounded-lg hover:bg-border-subtle"><ArrowDownTrayIcon className="w-4 h-4" />Descargar</button>
                        <button onClick={handleShare} className="flex items-center gap-2 text-sm font-semibold bg-accent text-white px-4 py-1.5 rounded-lg hover:opacity-90"><ShareIcon className="w-4 h-4" />Compartir</button>
                    </div>
                 )}
            </header>
            <main className="flex-1 flex overflow-hidden">
                {/* Control Panel */}
                <div className="w-full md:w-1/3 h-full border-r border-border-subtle p-4 overflow-y-auto flex flex-col gap-4">
                    {/* Main Image */}
                     <div className="space-y-2">
                        <label className="font-semibold text-sm">Imagen Principal</label>
                        <ImageUploader onUpload={setMainImage} className="w-full">
                            <div className="w-full h-40 bg-surface-secondary rounded-lg border-2 border-dashed border-border-subtle flex items-center justify-center text-text-secondary cursor-pointer hover:border-accent hover:text-accent transition-colors">
                                {mainImage ? <img src={mainImage.data} alt="Main upload" className="w-full h-full object-cover rounded-md" /> : <PlusIcon className="w-8 h-8"/>}
                            </div>
                        </ImageUploader>
                    </div>
                    {/* Ingredients */}
                    <div className="flex items-center justify-between">
                        <label className="font-semibold text-sm">Añadir ingredientes</label>
                        <button onClick={() => setAddIngredients(!addIngredients)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${addIngredients ? 'bg-accent' : 'bg-border-subtle'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addIngredients ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {addIngredients && (
                        <div className="grid grid-cols-4 gap-2">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="relative">
                                    <ImageUploader onUpload={(att) => handleIngredientUpload(att, i)} className="w-full">
                                        <div className="aspect-square bg-surface-secondary rounded-md border-2 border-dashed border-border-subtle flex items-center justify-center text-text-secondary cursor-pointer hover:border-accent hover:text-accent">
                                            {ing ? <img src={ing.data} alt={`Ingredient ${i}`} className="w-full h-full object-cover rounded-sm" /> : <PlusIcon className="w-5 h-5"/>}
                                        </div>
                                    </ImageUploader>
                                    {ing && <button onClick={() => removeIngredient(i)} className="absolute -top-1 -right-1 bg-danger text-white rounded-full p-0.5"><XMarkIcon className="w-3 h-3"/></button>}
                                </div>
                            ))}
                        </div>
                    )}
                     {/* Prompt */}
                    <div className="flex-1 flex flex-col">
                        <label className="font-semibold text-sm mb-2">Prompt</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe tu visión..." className="w-full flex-1 bg-surface-secondary border border-border-subtle rounded-lg p-2 text-sm resize-none outline-none focus:ring-1 focus:ring-accent" />
                    </div>
                    {/* Styles */}
                    <div>
                        <label className="font-semibold text-sm mb-2 block">Estilo</label>
                        <div className="grid grid-cols-2 gap-2">
                            {styles.map(style => (
                                <button key={style} onClick={() => setActiveStyle(style)} className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${activeStyle === style ? 'bg-accent/10 border-accent text-accent font-semibold' : 'bg-surface-secondary border-transparent text-text-secondary hover:bg-border-subtle'}`}>{style}</button>
                            ))}
                        </div>
                    </div>
                    {/* Generate Button */}
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 mt-auto">
                        {isLoading ? 'Generando...' : 'Generar'}
                    </button>
                </div>
                {/* Display */}
                <div className="flex-1 h-full bg-dots flex items-center justify-center p-4">
                    <div className="w-full h-full max-w-2xl max-h-2xl bg-surface-primary rounded-lg shadow-lg border border-border-subtle">
                        {renderDisplay()}
                    </div>
                </div>
            </main>
             <style>{`
                .bg-dots {
                    background-image: radial-gradient(var(--color-border-subtle) 1px, transparent 1px);
                    background-size: 16px 16px;
                }
            `}</style>
        </div>
    );
};

export default Photosam;
