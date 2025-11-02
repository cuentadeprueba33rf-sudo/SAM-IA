import React, { useEffect, useRef } from 'react';
import { PencilSquareIcon, TrashIcon } from './icons';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onRename, onDelete }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;

        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = menu;
        
        if (x + offsetWidth > innerWidth) {
            menu.style.left = `${x - offsetWidth}px`;
        } else {
            menu.style.left = `${x}px`;
        }
        
        if (y + offsetHeight > innerHeight) {
            menu.style.top = `${y - offsetHeight}px`;
        } else {
            menu.style.top = `${y}px`;
        }

    }, [x, y]);

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="fixed bg-surface-secondary w-48 rounded-lg shadow-2xl border border-border-subtle z-50 p-1 animate-fade-in-up-sm"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()}
        >
            <ul>
                <li>
                    <button 
                        onClick={() => handleAction(onRename)} 
                        className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-md text-sm hover:bg-border-subtle text-text-main"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span>Cambiar nombre</span>
                    </button>
                </li>
                <li>
                    <button 
                        onClick={() => handleAction(onDelete)} 
                        className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-md text-sm hover:bg-danger/20 text-danger"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>Eliminar</span>
                    </button>
                </li>
            </ul>
             <style>{`
                @keyframes fade-in-up-sm {
                    from { opacity: 0; transform: translateY(5px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up-sm {
                    animation: fade-in-up-sm 0.1s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ContextMenu;
