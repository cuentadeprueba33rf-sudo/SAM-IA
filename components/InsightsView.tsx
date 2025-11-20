
import React from 'react';
import { AcademicCapIcon, ChatBubbleLeftRightIcon, UsersIcon, MegaphoneIcon } from './icons';
import type { Insight } from '../types';

const DUMMY_INSIGHTS: Insight[] = [
    {
        id: '1',
        icon: AcademicCapIcon,
        title: "Compositor Académico",
        description: "Crea ensayos estructurados con citas y esquemas automáticos.",
        actions: [{ label: "Empezar Ensayo", type: 'new_chat_with_prompt', data: { title: "Nuevo Ensayo", prompt: "Ayúdame a crear un ensayo." } }]
    },
    {
        id: '2',
        icon: ChatBubbleLeftRightIcon,
        title: "Simulador de Entrevistas",
        description: "Practica para tu próximo trabajo. SAM actuará como el reclutador.",
        actions: [{ label: "Iniciar Simulación", type: 'new_chat_with_prompt', data: { title: "Simulación de Entrevista", prompt: "Actúa como un entrevistador para un puesto de desarrollador de software y hazme preguntas." } }]
    },
    {
        id: '3',
        icon: UsersIcon,
        title: "Sala de Debate",
        description: "Explora múltiples perspectivas. SAM defenderá puntos de vista opuestos.",
        actions: [{ label: "Debatir", type: 'new_chat_with_prompt', data: { title: "Debate sobre IA", prompt: "Vamos a debatir sobre los pros y los contras de la inteligencia artificial en la sociedad. Toma la postura a favor." } }]
    }
];

interface InsightsViewProps {
    onAction: (action: Insight['actions'][0]) => void;
}

const InsightsView: React.FC<InsightsViewProps> = ({ onAction }) => {
    return (
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-bg-main">
            <div className="max-w-5xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest mb-4">
                        <MegaphoneIcon className="w-4 h-4" /> Discovery Hub
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-text-main mb-4">
                        Explora el Potencial de <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">SAM</span>
                    </h1>
                    <p className="text-text-secondary text-lg max-w-2xl">
                        Descubre nuevas formas de trabajar, aprender y crear. Selecciona una tarjeta para iniciar una experiencia guiada.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {DUMMY_INSIGHTS.map((insight, index) => (
                        <div 
                            key={insight.id} 
                            className="group relative bg-surface-primary rounded-3xl border border-border-subtle overflow-hidden hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                        >
                            {/* Decorative Background Blob */}
                            <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${index === 0 ? 'from-blue-500/20' : index === 1 ? 'from-purple-500/20' : 'from-green-500/20'} to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none`}></div>
                            
                            <div className="p-8 flex-1 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-green-500'}`}>
                                    <insight.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-text-main mb-3 group-hover:text-accent transition-colors">
                                    {insight.title}
                                </h3>
                                <p className="text-text-secondary leading-relaxed">
                                    {insight.description}
                                </p>
                            </div>
                            
                            <div className="p-6 pt-0 relative z-10 mt-auto">
                                {insight.actions.map((action, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => onAction(action)} 
                                        className="w-full py-3 px-4 rounded-xl bg-surface-secondary text-text-main font-semibold text-sm hover:bg-text-main hover:text-bg-main transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-md"
                                    >
                                        {action.label}
                                        <span className="text-lg leading-none">→</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {/* Coming Soon Card */}
                    <div className="relative bg-surface-secondary/30 rounded-3xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                        <div className="text-4xl mb-4 opacity-50">✨</div>
                        <h3 className="text-lg font-bold text-text-secondary">Más Insights pronto</h3>
                        <p className="text-sm text-text-secondary/70 mt-2">
                            Estamos diseñando nuevas experiencias para ti.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsightsView;
