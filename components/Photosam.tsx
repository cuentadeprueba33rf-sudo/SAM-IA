
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
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <SparklesIcon className="w-12 h-12 md:w-16 md:h-16 text-accent animate-pulse mb-4" />
                    <p className="text-lg font-semibold text-text-main">Pensando...</p>
                    <p className="text-sm text-text-secondary transition-opacity duration-300 mt-1">{thinkingMessage}</p>
                </div>
            );
        }
        if (error) {
            return <div className="flex items-center justify-center h-full text-center text-danger p-6 text-sm font-medium">{error}</div>;
        }
        if (resultImage) {
            return <img src={resultImage.data} alt="Generated result" className="w-full h-full object-contain bg-black/5" />;
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-6">
                <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mb-4 border border-border-subtle">
                     <PhotoIcon className="w-10 h-10 opacity-50"/>
                </div>
                <p className="text-sm font-medium">Tu creación aparecerá aquí.</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-bg-main overflow-hidden">
            {/* Header */}
            <header className="flex items-center p-3 md:p-4 border-b border-border-subtle flex-shrink-0 bg-surface-primary z-20">
                <button onClick={onNavigateBack} className="p-2 rounded-full hover:bg-surface-secondary transition-colors">
                    <ChevronLeftIcon className="w-6 h-6 text-text-secondary" />
                </button>
                <h1 className="text-lg md:text-xl font-semibold ml-3 text-text-main">Photosam</h1>
                 {resultImage && (
                    <div className="ml-auto flex items-center gap-2">
                        <button onClick={handleDownload} className="flex items-center gap-2 text-xs md:text-sm font-medium bg-surface-secondary px-3 py-2 rounded-lg hover:bg-border-subtle transition-colors">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Descargar</span>
                        </button>
                        <button onClick={handleShare} className="flex items-center gap-2 text-xs md:text-sm font-semibold bg-accent text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-accent/20">
                            <ShareIcon className="w-4 h-4" />
                            <span>Compartir</span>
                        </button>
                    </div>
                 )}
            </header>

            <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Control Panel (Sidebar on Desktop, Bottom Sheet on Mobile) */}
                <div className="w-full md:w-80 lg:w-96 flex-1 md:flex-none border-t md:border-t-0 md:border-r border-border-subtle p-4 md:p-6 overflow-y-auto flex flex-col gap-6 order-2 md:order-1 bg-surface-primary/95 md:bg-surface-primary backdrop-blur-sm z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
                    
                    {/* Main Image */}
                     <div className="space-y-3">
                        <label className="font-semibold text-sm text-text-main flex items-center gap-2">
                            Imagen Principal
                            <span className="text-xs font-normal text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-full">Opcional</span>
                        </label>
                        <ImageUploader onUpload={setMainImage} className="w-full group">
                            <div className="w-full h-32 md:h-40 bg-surface-secondary/50 rounded-xl border-2 border-dashed border-border-subtle flex items-center justify-center text-text-secondary cursor-pointer group-hover:border-accent group-hover:bg-accent/5 transition-all duration-200 relative overflow-hidden">
                                {mainImage ? (
                                    <>
                                        <img src={mainImage.data} alt="Main upload" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-xs font-medium">Cambiar imagen</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <PlusIcon className="w-8 h-8 opacity-50 group-hover:scale-110 transition-transform"/>
                                        <span className="text-xs font-medium">Subir foto</span>
                                    </div>
                                )}
                            </div>
                        </ImageUploader>
                    </div>

                    {/* Ingredients Toggle */}
                    <div className="flex items-center justify-between py-2">
                        <label className="font-semibold text-sm text-text-main">Mezclar Ingredientes</label>
                        <button 
                            onClick={() => setAddIngredients(!addIngredients)} 
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${addIngredients ? 'bg-accent' : 'bg-border-subtle'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${addIngredients ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Ingredients Grid */}
                    {addIngredients && (
                        <div className="grid grid-cols-4 gap-3 animate-fade-in">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="relative group aspect-square">
                                    <ImageUploader onUpload={(att) => handleIngredientUpload(att, i)} className="w-full h-full">
                                        <div className="w-full h-full bg-surface-secondary/50 rounded-xl border-2 border-dashed border-border-subtle flex items-center justify-center text-text-secondary cursor-pointer hover:border-accent hover:bg-accent/5 transition-all relative overflow-hidden">
                                            {ing ? <img src={ing.data} alt={`Ingredient ${i}`} className="w-full h-full object-cover" /> : <PlusIcon className="w-5 h-5 opacity-50"/>}
                                        </div>
                                    </ImageUploader>
                                    {ing && (
                                        <button 
                                            onClick={() => removeIngredient(i)} 
                                            className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform z-10"
                                        >
                                            <XMarkIcon className="w-3 h-3"/>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="h-px bg-border-subtle w-full"></div>

                     {/* Prompt Input */}
                    <div className="flex-1 flex flex-col min-h-[100px]">
                        <label className="font-semibold text-sm mb-2 text-text-main">Prompt Mágico</label>
                        <textarea 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)} 
                            placeholder="¿Qué quieres crear hoy? Describe tu visión con detalle..." 
                            className="w-full flex-1 bg-surface-secondary border border-border-subtle rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-accent focus:bg-surface-primary transition-all placeholder:text-text-secondary/50" 
                        />
                    </div>

                    {/* Style Selector */}
                    <div>
                        <label className="font-semibold text-sm mb-3 block text-text-main">Estilo Artístico</label>
                        <div className="grid grid-cols-2 gap-3">
                            {styles.map(style => (
                                <button 
                                    key={style} 
                                    onClick={() => setActiveStyle(style)} 
                                    className={`px-3 py-2.5 text-sm rounded-xl border-2 transition-all duration-200 font-medium ${activeStyle === style ? 'bg-accent/10 border-accent text-accent shadow-sm' : 'bg-surface-secondary border-transparent text-text-secondary hover:bg-surface-secondary/80 hover:border-border-subtle'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading} 
                        className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-auto shadow-lg shadow-accent/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <SparklesIcon className="w-5 h-5 animate-spin"/>
                                Generando...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5"/>
                                Generar Imagen
                            </>
                        )}
                    </button>
                </div>

                {/* Display Area (Top on Mobile, Right on Desktop) */}
                <div className="w-full md:flex-1 h-[40vh] md:h-full bg-dots flex items-center justify-center p-4 md:p-8 order-1 md:order-2 flex-shrink-0 relative bg-surface-secondary/30">
                    <div className="w-full h-full max-w-3xl max-h-full bg-surface-primary rounded-2xl shadow-xl border border-border-subtle overflow-hidden flex items-center justify-center relative">
                        {renderDisplay()}
                    </div>
                </div>

            </main>
             <style>{`
                .bg-dots {
                    background-image: radial-gradient(var(--color-border-subtle) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default Photosam;
