import React, { useState, useMemo } from 'react';
import type { Artifact } from '../types';
import { XMarkIcon, DocumentDuplicateIcon, WindowIcon, DevicePhoneMobileIcon, DeviceTabletIcon, ComputerDesktopIcon, InformationCircleIcon, ViewColumnsIcon } from './icons';

const highlightCode = (code: string, language: string) => {
  if (language !== 'html') {
    return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Basic HTML syntax highlighting
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Comments
  highlighted = highlighted.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token comment">$1</span>');
  
  // Tags
  highlighted = highlighted.replace(/(&lt;\/?)([a-zA-Z0-9]+)/g, '$1<span class="token tag">$2</span>');

  // Attributes
  highlighted = highlighted.replace(/([a-zA-Z-]+)=(".*?"|'.*?')/g, '<span class="token attr-name">$1</span>=<span class="token attr-value">$2</span>');

  // Doctypes
  highlighted = highlighted.replace(/(&lt;!DOCTYPE html&gt;)/i, '<span class="token doctype">$1</span>');

  return highlighted;
};

const CodeView: React.FC<{ code: string; highlightedCode: string; }> = ({ code, highlightedCode }) => {
    const lineNumbers = useMemo(() => code.split('\n').map((_, i) => i + 1), [code]);
    return (
        <div className="h-full overflow-auto code-view bg-[#1e1e1e]">
            <div className="flex font-mono text-sm p-4 sticky top-0">
                <div className="text-right text-gray-500 select-none pr-4">
                    {lineNumbers.map(n => <div key={n}>{n}</div>)}
                </div>
                <pre className="flex-1 whitespace-pre-wrap break-words">
                    <code className="text-gray-300" dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                </pre>
            </div>
        </div>
    );
};

const PreviewView: React.FC<{ code: string, viewport: 'desktop' | 'tablet' | 'mobile' }> = ({ code, viewport }) => {
    const viewportSizes = {
        mobile: 'w-[375px] h-[667px]',
        tablet: 'w-[768px] h-[1024px]',
        desktop: 'w-full h-full',
    };
    return (
        <div className="h-full w-full flex items-center justify-center bg-dots p-4">
            <div className={`bg-white shadow-2xl rounded-lg transition-all duration-300 ease-in-out ${viewportSizes[viewport]}`}>
                 <iframe
                    srcDoc={code}
                    title="Artifact Preview"
                    className="w-full h-full border-0 rounded-lg"
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        </div>
    );
}

const CodeCanvas: React.FC<{ artifact: Artifact; onClose: () => void; }> = ({ artifact, onClose }) => {
  const [view, setView] = useState<'preview' | 'code' | 'info' | 'split'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  
  const highlightedCode = useMemo(() => highlightCode(artifact.code, artifact.language), [artifact.code, artifact.language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePopOut = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(artifact.code);
      newWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-main/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in-up">
        <div className="bg-surface-primary w-full h-full md:max-w-6xl md:h-full md:max-h-[90vh] rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border-subtle">
            {/* Header */}
            <header className="relative flex-shrink-0 flex items-center justify-between p-2 sm:p-3 border-b border-border-subtle bg-surface-primary z-10">
                <div className="flex items-center gap-2 flex-1">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-secondary transition-colors">
                        <XMarkIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                    <h2 className="font-semibold text-text-main truncate">{artifact.title}</h2>
                </div>
                
                {/* View Toggles */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-surface-secondary p-1 rounded-lg text-sm font-semibold">
                    <button onClick={() => setView('preview')} className={`px-3 py-1 rounded-md transition-colors ${view === 'preview' ? 'bg-accent text-white shadow' : 'text-text-secondary hover:text-text-main'}`}>Preview</button>
                    <button onClick={() => setView('code')} className={`px-3 py-1 rounded-md transition-colors ${view === 'code' ? 'bg-accent text-white shadow' : 'text-text-secondary hover:text-text-main'}`}>Code</button>
                    <button onClick={() => setView('split')} className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${view === 'split' ? 'bg-accent text-white shadow' : 'text-text-secondary hover:text-text-main'}`}><ViewColumnsIcon className="w-4 h-4" /> Split</button>
                    <button onClick={() => setView('info')} className={`px-3 py-1 rounded-md transition-colors ${view === 'info' ? 'bg-accent text-white shadow' : 'text-text-secondary hover:text-text-main'}`}>Info</button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end">
                    {view === 'preview' && (
                        <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-lg">
                            <button onClick={() => setViewport('mobile')} className={`p-1.5 rounded-md ${viewport === 'mobile' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-border-subtle'}`} title="Mobile"><DevicePhoneMobileIcon className="w-5 h-5" /></button>
                            <button onClick={() => setViewport('tablet')} className={`p-1.5 rounded-md ${viewport === 'tablet' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-border-subtle'}`} title="Tablet"><DeviceTabletIcon className="w-5 h-5" /></button>
                            <button onClick={() => setViewport('desktop')} className={`p-1.5 rounded-md ${viewport === 'desktop' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-border-subtle'}`} title="Desktop"><ComputerDesktopIcon className="w-5 h-5" /></button>
                        </div>
                    )}
                    <button onClick={handleCopy} className="p-2 rounded-full hover:bg-surface-secondary transition-colors" title="Copiar código">
                       <DocumentDuplicateIcon className={`w-5 h-5 ${copied ? 'text-green-500' : 'text-text-secondary'}`} />
                    </button>
                    <button onClick={handlePopOut} className="p-2 rounded-full hover:bg-surface-secondary transition-colors" title="Abrir en nueva ventana">
                        <WindowIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-1 overflow-hidden bg-bg-main relative">
                {view === 'code' && (
                    <CodeView code={artifact.code} highlightedCode={highlightedCode} />
                )}
                {view === 'preview' && (
                    <PreviewView code={artifact.code} viewport={viewport} />
                )}
                 {view === 'split' && (
                    <div className="h-full w-full hidden md:flex">
                        <div className="w-1/2 h-full border-r border-border-subtle">
                            <CodeView code={artifact.code} highlightedCode={highlightedCode} />
                        </div>
                        <div className="w-1/2 h-full">
                            <PreviewView code={artifact.code} viewport="desktop" />
                        </div>
                    </div>
                )}
                {view === 'info' && (
                    <div className="h-full w-full flex items-center justify-center p-8">
                        <div className="max-w-lg w-full bg-surface-primary p-8 rounded-lg border border-border-subtle">
                             <h3 className="text-2xl font-bold text-text-main flex items-center gap-3 mb-4">
                                <InformationCircleIcon className="w-8 h-8 text-accent"/>
                                <span>Detalles del Artefacto</span>
                             </h3>
                             <div className="space-y-3 text-text-secondary">
                                <p><strong>Título:</strong> <span className="font-mono bg-surface-secondary px-2 py-1 rounded">{artifact.title}</span></p>
                                <p><strong>Lenguaje:</strong> <span className="font-mono bg-surface-secondary px-2 py-1 rounded">{artifact.language}</span></p>
                                <p><strong>Líneas de código:</strong> <span className="font-mono bg-surface-secondary px-2 py-1 rounded">{artifact.code.split('\n').length}</span></p>
                             </div>
                             <p className="text-sm text-text-secondary mt-6">Este artefacto fue generado por SAM para ser visualizado e interactuado dentro de este entorno de desarrollo.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
        <style>{`
            :root {
                --code-bg: #1e1e1e;
                --code-text: #d4d4d4;
                --token-comment: #6a9955;
                --token-tag: #569cd6;
                --token-attr-name: #9cdcfe;
                --token-attr-value: #ce9178;
                --token-doctype: #4ec9b0;
            }
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.2s ease-out forwards;
            }
            .code-view {
                scrollbar-color: var(--color-text-secondary) transparent;
                scrollbar-width: thin;
            }
            .code-view::-webkit-scrollbar { width: 8px; }
            .code-view::-webkit-scrollbar-track { background: transparent; }
            .code-view::-webkit-scrollbar-thumb { background-color: var(--color-border-subtle); border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
            .code-view::-webkit-scrollbar-thumb:hover { background-color: var(--color-text-secondary); }
            .bg-dots {
                background-image: radial-gradient(var(--color-border-subtle) 1px, transparent 1px);
                background-size: 16px 16px;
            }
            /* Syntax Highlighting */
            .token.comment { color: var(--token-comment); }
            .token.tag { color: var(--token-tag); }
            .token.attr-name { color: var(--token-attr-name); }
            .token.attr-value { color: var(--token-attr-value); }
            .token.doctype { color: var(--token-doctype); }
        `}</style>
    </div>
  );
};

export default CodeCanvas;