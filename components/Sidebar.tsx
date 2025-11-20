import React, { Fragment, useState, useEffect, RefObject } from 'react';
import { 
    PencilSquareIcon, 
    ClockIcon,
    Squares2x2Icon,
    SunIcon,
    SparklesIcon,
    BookOpenIcon,
    MegaphoneIcon,
    ViewColumnsIcon,
} from './icons';
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
    activeView,
    onSelectView,
}) => {
    const [userName, setUserName] = useState('');
    
    useEffect(() => {
      const name = localStorage.getItem('sam_ia_guest_name');
      if (name) {
          setUserName(name);
      }
    }, []);

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
    
    const navItems = [
        { id: 'chat', label: 'Actividad', icon: ClockIcon, action: () => onSelectView('chat') },
        { id: 'sam_studios', label: 'Aplicaciones', icon: Squares2x2Icon, action: () => onSelectView('sam_studios') },
        { id: 'insights', label: 'Insights', icon: MegaphoneIcon, action: () => onSelectView('insights') },
        { id: 'canvas', label: 'Canvas', icon: ViewColumnsIcon, action: () => onSelectView('canvas') },
        { id: 'updates', label: 'Actualizaciones', icon: SparklesIcon, action: onShowUpdates },
        { id: 'settings', label: 'Ajustes', icon: SunIcon, action: onOpenSettings },
        { id: 'documentation', label: 'Ayuda', icon: BookOpenIcon, action: () => onSelectView('documentation') },
    ];

    return (
        <Fragment>
            <div 
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <aside className={`absolute top-0 left-0 h-full w-72 bg-surface-primary text-text-main flex flex-col transition-transform duration-300 ease-in-out z-40 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Header */}
                 <div className="p-4 flex-shrink-0 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-surface-secondary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-text-secondary"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                        </button>
                        <h1 className="text-xl font-semibold text-text-main">SAM IA</h1>
                     </div>
                     <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg">{userName.charAt(0)}</div>
                         <button onClick={onNewChat} className="p-2 rounded-full hover:bg-surface-secondary transition-colors" title="Nuevo chat">
                            <PencilSquareIcon className="w-6 h-6 text-text-main" />
                        </button>
                     </div>
                </div>

                <nav className="p-2 flex-shrink-0">
                    <ul className="space-y-1">
                        {navItems.map(item => (
                            <li key={item.id}>
                                <button 
                                    id={item.id === 'settings' ? 'btn-settings' : item.id === 'updates' ? 'btn-updates' : `btn-nav-${item.id}`}
                                    onClick={item.action}
                                    className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                                        // The first item 'chat' is special, it's active for any chat view.
                                        (item.id === 'chat' && activeView === 'chat') || (item.id !== 'chat' && activeView === item.id)
                                        ? 'bg-surface-secondary text-text-main' 
                                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-main'
                                    }`}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="px-4 my-2">
                    <div className="border-t border-border-subtle"></div>
                </div>

                <div id="sidebar-content" className="flex-1 flex flex-col overflow-y-auto px-2 pb-4">
                    <h3 className="px-3 text-sm font-semibold text-text-secondary mb-2">Recientes</h3>
                    {chats.length > 0 ? (
                         <ul className="space-y-1">
                           {chats.map(chat => (
                               <li key={chat.id}>
                                   <a 
                                      href="#"
                                      onClick={(e) => { e.preventDefault(); handleSelectChat(chat.id); }}
                                      onMouseDown={(e) => handlePressStart(e, chat.id)}
                                      onMouseUp={handlePressEnd}
                                      onTouchStart={(e) => handlePressStart(e, chat.id)}
                                      onTouchEnd={handlePressEnd}
                                      className={`block w-full text-left truncate px-3 py-2 rounded-md text-sm transition-colors ${currentChatId === chat.id ? 'bg-accent/10 text-accent font-semibold' : 'text-text-secondary hover:bg-surface-secondary hover:text-text-main'}`}
                                  >
                                      {chat.title}
                                  </a>
                               </li>
                           ))}
                       </ul>
                    ) : (
                        <div className="text-center text-xs text-text-secondary p-4">No hay chats recientes</div>
                    )}
                </div>
            </aside>
        </Fragment>
    );
};

export default Sidebar;
