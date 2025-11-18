
import React, { Fragment, useState, useEffect, RefObject } from 'react';
import { PencilSquareIcon, WindowIcon, SparklesIcon, Cog6ToothIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, ViewColumnsIcon, MegaphoneIcon, UsersIcon, CheckBadgeIcon, BookOpenIcon, ChartBarIcon, CodeBracketSquareIcon } from './icons';
import VerificationPanel from './VerificationPanel';
import type { ViewID } from '../types';

type Chat = {
    id: string;
    title: string;
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    chats: Chat[];
    currentChatId: string | null;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onShowUpdates: () => void;
    onOpenSettings: () => void;
    onShowContextMenu: (chatId: string, coords: { x: number; y: number }) => void;
    creditsRef: RefObject<HTMLDivElement>;
    verificationPanelRef: RefObject<HTMLDivElement>;
    forceOpenVerificationPanel: boolean;
    activeView: ViewID;
    onSelectView: (view: ViewID) => void;
}

const creators = [
    { name: 'Samuel Casseres', color: '#FFD700' }, 
    { name: 'Equipo VERCE', color: '#FFD700' },
];

const collaborators = [
    { name: 'Junayfer Palmera', color: '#3B82F6' },
    { name: 'Danny Casseres', color: '#3B82F6' },
    { name: 'Danna Simancas', color: '#3B82F6' },
];


const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, 
    onClose, 
    chats, 
    currentChatId, 
    onNewChat, 
    onSelectChat, 
    onShowUpdates,
    onOpenSettings,
    onShowContextMenu,
    creditsRef,
    verificationPanelRef, // This ref might be obsolete or need rethinking
    forceOpenVerificationPanel,
    activeView,
    onSelectView,
}) => {
    const [userName, setUserName] = useState('');
    const [isCreatorsOpen, setIsCreatorsOpen] = useState(forceOpenVerificationPanel);
    const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(forceOpenVerificationPanel);
    
    useEffect(() => {
      const name = localStorage.getItem('sam_ia_guest_name');
      if (name) {
          setUserName(name);
      }
    }, []);

    useEffect(() => {
        setIsCreatorsOpen(forceOpenVerificationPanel);
        setIsCollaboratorsOpen(forceOpenVerificationPanel);
    }, [forceOpenVerificationPanel]);


    let pressTimer: ReturnType<typeof setTimeout> | null = null;

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent, chatId: string) => {
        pressTimer = setTimeout(() => {
            const coords = 'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
            onShowContextMenu(chatId, coords);
      }, 500);
    };
    
    const handlePressEnd = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    const handleSelectChat = (id: string) => {
        onSelectView('chat');
        onSelectChat(id);
    };

    return (
        <Fragment>
            <div 
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <aside className={`absolute top-0 left-0 h-full w-80 bg-surface-primary text-text-main flex flex-col transition-transform duration-300 ease-in-out z-40 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Fixed Header */}
                <div className="p-4 space-y-4 flex-shrink-0">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary st-sidebar-icon" />
                        <input type="text" placeholder="Buscar chats" className="w-full bg-surface-secondary border border-border-subtle rounded-full pl-10 pr-4 py-2 focus:ring-accent focus:border-accent outline-none" />
                    </div>
                    <div className="flex items-center justify-between">
                         <button onClick={onNewChat} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary text-left w-full">
                            <PencilSquareIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                            <span>Nuevo chat</span>
                        </button>
                        <button id="btn-close-sidebar" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-secondary md:hidden">
                            <WindowIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Main Area */}
                <div id="sidebar-content" className="flex-1 overflow-y-auto px-4">
                    <div className="space-y-1">
                        <button id="btn-nav-canvas" onClick={() => onSelectView('canvas')} className={`flex items-center gap-3 p-2 rounded-lg text-left w-full transition-colors ${activeView === 'canvas' ? 'bg-accent/10 text-accent' : 'hover:bg-surface-secondary'}`}>
                            <ViewColumnsIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                            <span>Canvas</span>
                        </button>
                         <button id="btn-nav-insights" onClick={() => onSelectView('insights')} className={`flex items-center gap-3 p-2 rounded-lg text-left w-full transition-colors ${activeView === 'insights' ? 'bg-accent/10 text-accent' : 'hover:bg-surface-secondary'}`}>
                            <MegaphoneIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                            <span>Insights</span>
                        </button>
                        <button id="btn-nav-documentation" onClick={() => onSelectView('documentation')} className={`flex items-center gap-3 p-2 rounded-lg text-left w-full transition-colors ${activeView === 'documentation' ? 'bg-accent/10 text-accent' : 'hover:bg-surface-secondary'}`}>
                            <BookOpenIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                            <span>Documentación</span>
                        </button>
                        <button id="btn-nav-usage" onClick={() => onSelectView('usage')} className={`flex items-center gap-3 p-2 rounded-lg text-left w-full transition-colors ${activeView === 'usage' ? 'bg-accent/10 text-accent' : 'hover:bg-surface-secondary'}`}>
                            <ChartBarIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                            <span>Usage</span>
                        </button>
                    </div>
                    
                    <div className="py-2"><div className="border-t border-border-subtle"></div></div>

                    <div>
                        <h3 className="text-text-secondary font-semibold text-sm mb-2 px-2">SAM IA Studios</h3>
                         <button id="btn-nav-canvas_dev_pro" onClick={() => onSelectView('canvas_dev_pro')} className={`flex items-center gap-3 p-2 rounded-lg text-left w-full transition-colors ${activeView === 'canvas_dev_pro' ? 'bg-accent/10 text-accent' : 'hover:bg-surface-secondary'}`}>
                            <CodeBracketSquareIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                            <span>Canvas Dev Pro</span>
                        </button>
                    </div>
                    
                    <div className="mt-4">
                        <h3 className="text-text-secondary font-semibold text-sm mb-2">Recientes</h3>
                        <ul className="space-y-1">
                            {chats.map(chat => (
                                <li key={chat.id} className="group relative">
                                    <a 
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); handleSelectChat(chat.id); }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            onShowContextMenu(chat.id, { x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseDown={(e) => handlePressStart(e, chat.id)}
                                        onMouseUp={handlePressEnd}
                                        onMouseLeave={handlePressEnd}
                                        onTouchStart={(e) => handlePressStart(e, chat.id)}
                                        onTouchEnd={handlePressEnd}
                                        className={`block w-full text-left truncate pr-8 px-3 py-2 rounded-lg transition-colors ${activeView === 'chat' && currentChatId === chat.id ? 'bg-accent text-white' : 'hover:bg-surface-secondary'}`}
                                    >
                                        {chat.title}
                                    </a>
                                    <button
                                        onClick={(e) => onShowContextMenu(chat.id, { x: e.clientX, y: e.clientY })}
                                        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-secondary hover:bg-surface-primary ${activeView === 'chat' && currentChatId === chat.id ? 'text-white' : 'group-hover:opacity-100 opacity-0'}`}
                                    >
                                        <EllipsisVerticalIcon className="w-5 h-5 st-sidebar-icon" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div ref={creditsRef} className="p-4 border-t border-border-subtle flex-shrink-0 relative">
                    <div className="px-2 space-y-2 mb-2">
                        <VerificationPanel
                            id="btn-creators"
                            title="Creadores Principales"
                            icon={SparklesIcon}
                            collaborators={creators}
                            isOpen={isCreatorsOpen}
                            onToggle={() => setIsCreatorsOpen(!isCreatorsOpen)}
                        />
                        <VerificationPanel
                            id="btn-collaborators"
                            title="Colaboradores Clave"
                            icon={UsersIcon}
                            collaborators={collaborators}
                            isOpen={isCollaboratorsOpen}
                            onToggle={() => setIsCollaboratorsOpen(!isCollaboratorsOpen)}
                        />
                    </div>
                     <div className="flex items-center gap-3 p-2 mb-2">
                         <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-white">
                           {userName.charAt(0).toUpperCase()}
                         </div>
                         <span className="font-semibold text-text-main">{userName}</span>
                     </div>
                     <button id="btn-settings" onClick={onOpenSettings} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary text-left w-full">
                        <Cog6ToothIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                        <span>Configuración</span>
                    </button>
                     <button id="btn-updates" onClick={onShowUpdates} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary text-left w-full">
                        <SparklesIcon className="w-6 h-6 text-text-secondary st-sidebar-icon" />
                        <span>Actualizaciones</span>
                    </button>
                     <div className="px-2 pt-2 text-center text-xs text-text-secondary">
                        <p>by: Samuel Casseres, Junayfer Palmera, Danny Casseres, Danna Simancas & el equipo de VERCE</p>
                    </div>
                </div>
            </aside>
        </Fragment>
    );
};

export default Sidebar;
