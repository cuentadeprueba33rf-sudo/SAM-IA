import React, { useState } from 'react';
import { GiftIcon, XMarkIcon, CheckBadgeIcon } from './icons';

interface PreregistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PreregistrationModal: React.FC<PreregistrationModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const MOCK_CODE = "XMAS2024";

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.includes('@') || !email.includes('.')) {
            setError('Por favor, ingresa un correo válido.');
            return;
        }
        setIsLoading(true);
        // Simulate "sending" an email
        setTimeout(() => {
            localStorage.setItem('sam_ia_prereg_email', email);
            setIsLoading(false);
            setStep('code');
        }, 1000);
    };

    const handleCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (code.trim().toUpperCase() === MOCK_CODE) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setStep('success');
                onSuccess();
            }, 500);
        } else {
            setError('El código es incorrecto. Inténtalo de nuevo.');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-primary rounded-2xl max-w-sm w-full shadow-2xl border border-border-subtle text-center p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-secondary">
                    <XMarkIcon className="w-6 h-6 text-text-secondary" />
                </button>

                {step === 'email' && (
                    <div className="animate-fade-in">
                        <div className="mx-auto bg-red-500/10 p-3 rounded-full w-fit mb-4">
                            <GiftIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-text-main">¡Inscríbete para el Regalo Navideño!</h2>
                        <p className="text-text-secondary my-3">Recibe acceso exclusivo al modelo <span className="font-bold text-red-400">SM-l3.9</span> el 2 de Diciembre.</p>
                        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                             <input 
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu.correo@ejemplo.com"
                                className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main placeholder:text-text-secondary focus:ring-accent focus:border-accent outline-none"
                                required
                            />
                            {error && <p className="text-danger text-sm">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full bg-accent text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                                {isLoading ? 'Enviando...' : 'Obtener código de inscripción'}
                            </button>
                        </form>
                    </div>
                )}
                
                {step === 'code' && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-text-main">Aquí está tu código</h2>
                        <p className="text-text-secondary my-3">
                            Normalmente, recibirías esto por correo. Para esta demostración, puedes usar el siguiente código:
                        </p>
                        <div className="my-4 p-3 bg-surface-secondary border-2 border-dashed border-border-subtle rounded-lg">
                            <p className="text-2xl font-bold text-accent tracking-[0.2em] select-all">{MOCK_CODE}</p>
                        </div>
                        <form onSubmit={handleCodeSubmit} className="mt-6 space-y-4">
                             <input 
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                placeholder="Ingresa el código aquí"
                                className="w-full bg-surface-secondary border border-border-subtle rounded-lg px-3 py-2 text-text-main placeholder:text-text-secondary focus:ring-accent focus:border-accent outline-none text-center tracking-[0.2em]"
                                required
                                autoComplete="off"
                            />
                            {error && <p className="text-danger text-sm">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full bg-accent text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                                 {isLoading ? 'Verificando...' : 'Confirmar Inscripción'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'success' && (
                    <div className="animate-fade-in">
                        <div className="mx-auto bg-green-500/10 p-3 rounded-full w-fit mb-4">
                            <CheckBadgeIcon className="w-10 h-10 text-green-500" fill="currentColor"/>
                        </div>
                        <h2 className="text-2xl font-bold text-text-main">¡Estás en la lista!</h2>
                        <p className="text-text-secondary my-4">Has quedado pre-inscrito para recibir <span className="font-bold text-red-400">SM-l3.9</span>. Se desbloqueará automáticamente en tu cuenta el 2 de Diciembre.</p>
                        <button onClick={onClose} className="mt-4 w-full bg-accent text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90">
                            ¡Genial!
                        </button>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default PreregistrationModal;