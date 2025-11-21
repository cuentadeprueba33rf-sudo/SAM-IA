
import React, { useState } from 'react';
import { sendGlobalAnnouncement } from '../services/firebase';
import { ShieldCheckIcon, MegaphoneIcon, XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckBadgeIcon } from './icons';

interface AdminBroadcastProps {
    onClose: () => void;
    userEmail: string;
}

const AdminBroadcast: React.FC<AdminBroadcastProps> = ({ onClose, userEmail }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'urgent' | 'success'>('info');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        setIsSending(true);
        try {
            await sendGlobalAnnouncement(title, message, type, userEmail);
            setStatus('success');
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1E1F20] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Panel de Transmisión</h2>
                            <p className="text-xs text-gray-400">Sistema de Alerta Global SAM IA</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSend} className="p-6 space-y-6">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Mensaje</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'info', label: 'Info', color: 'bg-blue-500', icon: InformationCircleIcon },
                                { id: 'success', label: 'Éxito', color: 'bg-green-500', icon: CheckBadgeIcon },
                                { id: 'warning', label: 'Aviso', color: 'bg-yellow-500', icon: ExclamationTriangleIcon },
                                { id: 'urgent', label: 'Urgente', color: 'bg-red-500', icon: ExclamationTriangleIcon }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id as any)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${type === t.id ? `border-${t.color.split('-')[1]}-500 bg-white/5` : 'border-transparent bg-white/5 hover:bg-white/10'}`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${t.color} mb-2 shadow-lg shadow-${t.color.split('-')[1]}-500/50`}></div>
                                    <span className={`text-xs font-semibold ${type === t.id ? 'text-white' : 'text-gray-500'}`}>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Título</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Mantenimiento Programado"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Mensaje</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Escribe el contenido del anuncio..."
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={isSending || status === 'success'}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                            status === 'success' 
                            ? 'bg-green-600' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25 hover:scale-[1.02]'
                        }`}
                    >
                        {isSending ? (
                            <span className="animate-pulse">Enviando...</span>
                        ) : status === 'success' ? (
                            <>
                                <CheckBadgeIcon className="w-5 h-5" />
                                ¡Enviado!
                            </>
                        ) : (
                            <>
                                <MegaphoneIcon className="w-5 h-5" />
                                Transmitir Globalmente
                            </>
                        )}
                    </button>

                </form>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default AdminBroadcast;
