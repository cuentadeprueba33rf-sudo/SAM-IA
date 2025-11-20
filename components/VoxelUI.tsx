
import React, { useState, useEffect, useRef } from 'react';
import { AppState, SavedModel } from '../typesVoxel';
import { Box, Bird, Cat, Rabbit, Users, Code2, Wand2, Hammer, FolderOpen, ChevronUp, FileJson, History, Play, Pause, Info, Wrench, Loader2, X, Upload, Copy, Check, Sparkles, ChevronLeft } from 'lucide-react';

// --- WELCOME SCREEN ---

interface WelcomeScreenProps {
  visible: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible }) => {
  return (
    <div className={`
        absolute top-24 left-0 w-full pointer-events-none flex justify-center z-10 select-none
        transition-all duration-500 ease-out transform font-sans
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}
    `}>
      <div className="text-center flex flex-col items-center gap-4 bg-slate-50/80 backdrop-blur-md p-8 rounded-3xl border border-slate-200 shadow-lg">
        <div>
            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-widest mb-2">
                Voxel Toy Box
            </h1>
            <div className="text-sm font-extrabold text-indigo-600 uppercase tracking-[0.3em]">
                Powered by AI
            </div>
        </div>
        
        <div className="space-y-3 mt-2">
            <p className="text-lg font-bold text-slate-700">Build amazing voxel models</p>
            <p className="text-lg font-bold text-slate-700">Break them down and rebuild them</p>
            <p className="text-lg font-bold text-slate-700">Share your creations with friends</p>
        </div>
      </div>
    </div>
  );
};

// --- PROMPT MODAL ---

interface PromptModalProps {
  isOpen: boolean;
  mode: 'create' | 'morph';
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, mode, onClose, onSubmit }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onSubmit(prompt);
      setPrompt('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('The magic failed! Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isCreate = mode === 'create';
  const themeBg = isCreate ? 'bg-sky-500' : 'bg-amber-500';
  const themeHover = isCreate ? 'hover:bg-sky-600' : 'hover:bg-amber-600';
  const themeLight = isCreate ? 'bg-sky-100' : 'bg-amber-100';
  const themeText = isCreate ? 'text-sky-600' : 'text-amber-600';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans pointer-events-auto">
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col border-4 ${isCreate ? 'border-sky-100' : 'border-amber-100'} animate-in fade-in zoom-in duration-200 scale-95 sm:scale-100 overflow-hidden`}>
        
        <div className={`flex items-center justify-between p-6 border-b ${isCreate ? 'border-sky-50 bg-gradient-to-r from-sky-50 to-blue-50' : 'border-amber-50 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${themeLight} ${themeText}`}>
                {isCreate ? <Wand2 size={24} strokeWidth={2.5} /> : <Hammer size={24} strokeWidth={2.5} />}
            </div>
            <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                    {isCreate ? 'New Build' : 'Rebuild blocks'}
                </h2>
                <p className={`text-xs font-bold uppercase tracking-wide ${isCreate ? 'text-sky-400' : 'text-amber-400'}`}>
                    POWERED BY SAM AI
                </p>
            </div>
          </div>
          <button 
            onClick={!isLoading ? onClose : undefined}
            className="p-2 rounded-xl bg-white/50 text-slate-400 hover:bg-white hover:text-slate-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 bg-white">
          <p className="text-slate-600 font-semibold mb-4">
            {isCreate 
                ? "What new creation should we build?" 
                : "How should we rebuild the current voxels?"}
          </p>
          
          <form onSubmit={handleSubmit}>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isCreate 
                ? "e.g., A medieval castle, a giant robot, a fruit basket..." 
                : "e.g., Turn it into a car, make a pyramid, build a smiley face..."}
              disabled={isLoading}
              className={`w-full h-32 resize-none bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-medium text-slate-700 focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400 mb-4 ${isCreate ? 'focus:border-sky-400 focus:ring-sky-100' : 'focus:border-amber-400 focus:ring-amber-100'}`}
              autoFocus
            />

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold flex items-center gap-2">
                <X size={16} /> {error}
              </div>
            )}

            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all
                  ${isLoading 
                    ? 'bg-slate-200 text-slate-400 cursor-wait' 
                    : `${themeBg} ${themeHover} shadow-lg active:scale-95`}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} fill="currentColor" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- JSON MODAL ---

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: string;
  isImport?: boolean;
  onImport?: (json: string) => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({ isOpen, onClose, data = '', isImport = false, onImport }) => {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
      if (isOpen) {
          setImportText('');
          setError('');
          setIsCopied(false);
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImportClick = () => {
      if (!importText.trim()) {
          setError('Please paste JSON data first.');
          return;
      }
      try {
          JSON.parse(importText); 
          if (onImport) {
              onImport(importText);
              onClose();
          }
      } catch (e) {
          setError('Invalid JSON format. Please check your input.');
      }
  };

  const handleCopy = async () => {
      if (!data) return;
      try {
          await navigator.clipboard.writeText(data);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
          console.error('Failed to copy:', err);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-4 font-sans pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col h-[70vh] border-4 border-slate-100 animate-in fade-in zoom-in duration-200 scale-95 sm:scale-100">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isImport ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                {isImport ? <Upload size={24} strokeWidth={2.5} /> : <FileJson size={24} strokeWidth={2.5} />}
            </div>
            <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                    {isImport ? 'Import Blueprint' : 'Copy and share your model'}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">JSON Format</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden bg-slate-50/50 flex flex-col relative">
          <textarea 
            readOnly={!isImport}
            value={isImport ? importText : data}
            onChange={isImport ? (e) => setImportText(e.target.value) : undefined}
            placeholder={isImport ? "Paste your voxel JSON data here..." : ""}
            className={`w-full h-full resize-none bg-white border-2 rounded-xl p-4 font-mono text-xs text-slate-600 focus:outline-none transition-all ${isImport ? 'border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100' : 'border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'}`}
          />
          
          {isImport && error && (
              <div className="absolute bottom-8 left-8 right-8 bg-rose-100 text-rose-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-rose-200 animate-in slide-in-from-bottom-2">
                  {error}
              </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end bg-white rounded-b-3xl gap-3">
          {isImport ? (
              <>
                <button 
                    onClick={onClose}
                    className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleImportClick}
                    className="px-6 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 border-b-[4px] border-emerald-700 active:border-b-0 active:translate-y-[4px]"
                >
                    Import Build
                </button>
              </>
          ) : (
              <>
                <button
                    onClick={handleCopy}
                    className={`
                        flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all border-b-[4px] active:border-b-0 active:translate-y-[4px]
                        ${isCopied 
                            ? 'bg-emerald-500 text-white border-emerald-700 shadow-lg shadow-emerald-500/30' 
                            : 'bg-blue-500 text-white border-blue-700 shadow-lg shadow-blue-500/30 hover:bg-blue-600'}
                    `}
                >
                    {isCopied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
                    {isCopied ? 'Copied!' : 'Copy All'}
                </button>
                <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-900/20"
                >
                    Close
                </button>
              </>
          )}
        </div>

      </div>
    </div>
  );
};

// --- UI OVERLAY ---

interface UIOverlayProps {
  voxelCount: number;
  appState: AppState;
  currentBaseModel: string;
  customBuilds: SavedModel[];
  customRebuilds: SavedModel[];
  isAutoRotate: boolean;
  isInfoVisible: boolean;
  isGenerating: boolean;
  onDismantle: () => void;
  onRebuild: (type: 'Eagle' | 'Cat' | 'Rabbit' | 'Twins') => void;
  onNewScene: (type: 'Eagle') => void;
  onSelectCustomBuild: (model: SavedModel) => void;
  onSelectCustomRebuild: (model: SavedModel) => void;
  onPromptCreate: () => void;
  onPromptMorph: () => void;
  onShowJson: () => void;
  onImportJson: () => void;
  onToggleRotation: () => void;
  onToggleInfo: () => void;
  onNavigateBack: () => void;
}

const LOADING_MESSAGES = [
    "Crafting voxels...",
    "Designing structure...",
    "Calculating physics...",
    "Mixing colors...",
    "Assembling geometry...",
    "Applying polish..."
];

export const UIOverlay: React.FC<UIOverlayProps> = ({
  voxelCount,
  appState,
  currentBaseModel,
  customBuilds,
  customRebuilds,
  isAutoRotate,
  isInfoVisible,
  isGenerating,
  onDismantle,
  onRebuild,
  onNewScene,
  onSelectCustomBuild,
  onSelectCustomRebuild,
  onPromptCreate,
  onPromptMorph,
  onShowJson,
  onImportJson,
  onToggleRotation,
  onToggleInfo,
  onNavigateBack
}) => {
  const isStable = appState === AppState.STABLE;
  const isDismantling = appState === AppState.DISMANTLING;
  
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    if (isGenerating) {
        const interval = setInterval(() => {
            setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    } else {
        setLoadingMsgIndex(0);
    }
  }, [isGenerating]);
  
  const isEagle = currentBaseModel === 'Eagle';

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none font-sans text-slate-800">
      
      {/* --- Top Bar (Stats & Tools) --- */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
        
        {/* Left: Back & Menu */}
        <div className="pointer-events-auto flex flex-col gap-2">
            <div className="flex gap-2">
                <TactileButton
                    onClick={onNavigateBack}
                    color="slate"
                    icon={<ChevronLeft size={20} strokeWidth={2.5} />}
                    label="Back"
                    compact
                />
                <DropdownMenu 
                    icon={<FolderOpen size={20} />}
                    label="Builds"
                    color="indigo"
                >
                    <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">NEW BUILDS</div>
                    <DropdownItem onClick={() => onNewScene('Eagle')} icon={<Bird size={16}/>} label="Eagle" />
                    <DropdownItem onClick={onPromptCreate} icon={<Wand2 size={16}/>} label="New build" highlight />
                    <div className="h-px bg-slate-100 my-1" />
                    
                    {customBuilds.length > 0 && (
                        <>
                            <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">YOUR CREATIONS</div>
                            {customBuilds.map((model, idx) => (
                                <DropdownItem 
                                    key={`build-${idx}`} 
                                    onClick={() => onSelectCustomBuild(model)} 
                                    icon={<History size={16}/>} 
                                    label={model.name} 
                                    truncate
                                />
                            ))}
                            <div className="h-px bg-slate-100 my-1" />
                        </>
                    )}

                    <DropdownItem onClick={onImportJson} icon={<FileJson size={16}/>} label="Import JSON" />
                </DropdownMenu>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl border border-slate-200 text-slate-500 font-bold w-fit mt-2">
                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <Box size={16} strokeWidth={3} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] uppercase tracking-wider opacity-60">Voxels</span>
                    <span className="text-lg text-slate-800 font-extrabold font-mono">{voxelCount}</span>
                </div>
            </div>
        </div>

        {/* Right: Utilities */}
        <div className="pointer-events-auto flex gap-2">
            <TactileButton
                onClick={onToggleInfo}
                color={isInfoVisible ? 'indigo' : 'slate'}
                icon={<Info size={18} strokeWidth={2.5} />}
                label="Info"
                compact
            />
            <TactileButton
                onClick={onToggleRotation}
                color={isAutoRotate ? 'sky' : 'slate'}
                icon={isAutoRotate ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                label={isAutoRotate ? "Pause Cam" : "Play Cam"}
                compact
            />
            <TactileButton
                onClick={onShowJson}
                color="slate"
                icon={<Code2 size={18} strokeWidth={2.5} />}
                label="Share"
            />
        </div>
      </div>

      {/* --- Loading Indicator --- */}
      {isGenerating && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
              <div className="bg-white/90 backdrop-blur-md border-2 border-indigo-100 px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 min-w-[280px]">
                  <div className="relative">
                      <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-20"></div>
                      <Loader2 size={48} className="text-indigo-500 animate-spin" />
                  </div>
                  <div className="text-center">
                      <h3 className="text-lg font-extrabold text-slate-800">SAM is Building...</h3>
                      <p className="text-slate-500 font-bold text-sm transition-all duration-300">
                          {LOADING_MESSAGES[loadingMsgIndex]}
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* --- Bottom Control Center --- */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center items-end pointer-events-none z-40">
        
        <div className="pointer-events-auto transition-all duration-500 ease-in-out transform">
            
            {isStable && (
                 <div className="animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <BigActionButton 
                        onClick={onDismantle} 
                        icon={<Hammer size={32} strokeWidth={2.5} />} 
                        label="BREAK" 
                        color="rose" 
                     />
                 </div>
            )}

            {isDismantling && !isGenerating && (
                <div className="flex items-end gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <DropdownMenu 
                        icon={<Wrench size={24} />}
                        label="Rebuild"
                        color="emerald"
                        direction="up"
                        big
                     >
                        <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">REBUILD</div>
                        
                        {isEagle && (
                            <>
                                <DropdownItem onClick={() => onRebuild('Cat')} icon={<Cat size={18}/>} label="Cat" />
                                <DropdownItem onClick={() => onRebuild('Rabbit')} icon={<Rabbit size={18}/>} label="Rabbit" />
                                <DropdownItem onClick={() => onRebuild('Twins')} icon={<Users size={18}/>} label="Eagles x2" />
                                <div className="h-px bg-slate-100 my-1" />
                            </>
                        )}

                        {customRebuilds.length > 0 && (
                            <>
                                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">CUSTOM REBUILDS</div>
                                {customRebuilds.map((model, idx) => (
                                    <DropdownItem 
                                        key={`rebuild-${idx}`} 
                                        onClick={() => onSelectCustomRebuild(model)} 
                                        icon={<History size={18}/>} 
                                        label={model.name}
                                        truncate 
                                    />
                                ))}
                                <div className="h-px bg-slate-100 my-1" />
                            </>
                        )}

                        <DropdownItem onClick={onPromptMorph} icon={<Wand2 size={18}/>} label="New rebuild" highlight />
                     </DropdownMenu>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

// --- Components ---

interface TactileButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  color: 'slate' | 'rose' | 'sky' | 'emerald' | 'amber' | 'indigo';
  compact?: boolean;
}

const TactileButton: React.FC<TactileButtonProps> = ({ onClick, disabled, icon, label, color, compact }) => {
  const colorStyles = {
    slate:   'bg-slate-200 text-slate-600 shadow-slate-300 hover:bg-slate-300',
    rose:    'bg-rose-500 text-white shadow-rose-700 hover:bg-rose-600',
    sky:     'bg-sky-500 text-white shadow-sky-700 hover:bg-sky-600',
    emerald: 'bg-emerald-500 text-white shadow-emerald-700 hover:bg-emerald-600',
    amber:   'bg-amber-400 text-amber-900 shadow-amber-600 hover:bg-amber-500',
    indigo:  'bg-indigo-500 text-white shadow-indigo-700 hover:bg-indigo-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-100
        border-b-[4px] active:border-b-0 active:translate-y-[4px]
        ${compact ? 'p-2.5' : 'px-4 py-3'}
        ${disabled 
          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none' 
          : `${colorStyles[color]} border-black/20 shadow-lg`}
      `}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </button>
  );
};

const BigActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string, color: 'rose'}> = ({ onClick, icon, label, color }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-900/30 border-b-[8px] border-rose-800 active:border-b-0 active:translate-y-[8px] transition-all duration-150"
        >
            <div className="mb-2">{icon}</div>
            <div className="text-sm font-black tracking-wider">{label}</div>
        </button>
    )
}

interface DropdownProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    color: 'indigo' | 'emerald';
    direction?: 'up' | 'down';
    big?: boolean;
}

const DropdownMenu: React.FC<DropdownProps> = ({ icon, label, children, color, direction = 'down', big }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const bgClass = color === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600 border-indigo-800' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-800';

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 font-bold text-white shadow-lg rounded-2xl transition-all active:scale-95
                    ${bgClass}
                    ${big ? 'px-8 py-4 text-lg border-b-[6px] active:border-b-0 active:translate-y-[6px]' : 'px-4 py-3 text-sm border-b-[4px] active:border-b-0 active:translate-y-[4px]'}
                `}
            >
                {icon}
                {label}
                <ChevronUp size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${direction === 'down' ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`
                    absolute left-0 ${direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'} 
                    w-56 max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border-2 border-slate-100 p-2 flex flex-col gap-1 animate-in fade-in zoom-in duration-200 z-50
                `}>
                    {children}
                </div>
            )}
        </div>
    )
}

const DropdownItem: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, highlight?: boolean, truncate?: boolean }> = ({ onClick, icon, label, highlight, truncate }) => {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors text-left
                ${highlight 
                    ? 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-600 hover:from-sky-100 hover:to-blue-100' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
            `}
        >
            <div className="shrink-0">{icon}</div>
            <span className={truncate ? "truncate w-full" : ""}>{label}</span>
        </button>
    )
}
