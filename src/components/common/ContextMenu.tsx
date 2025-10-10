import React, { useEffect, useRef } from 'react';

export type MenuItem =
  | {
      isSeparator: true;
    }
  | {
      isSeparator?: false;
      label: string;
      icon: string;
      action: () => void;
      disabled?: boolean;
    };


interface ContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onClose: () => void;
    items: MenuItem[];
}

const ContextMenu = ({ isOpen, position, onClose, items }: ContextMenuProps) => {
    const menuRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('click', onClose, true);
            document.addEventListener('contextmenu', onClose, true);
        }
        return () => {
            document.removeEventListener('click', onClose, true);
            document.removeEventListener('contextmenu', onClose, true);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <ul
            ref={menuRef}
            style={{ top: position.y, left: position.x }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[10001] bg-cnk-panel-light border border-cnk-border-light rounded-md shadow-lg py-1 min-w-[180px] animate-fadeIn"
        >
            {items.map((item, index) => {
                if ('isSeparator' in item && item.isSeparator) {
                    return <li key={`sep-${index}`} className="h-px bg-cnk-border-light my-1"></li>;
                } else if ('label' in item) {
                    return (
                        <li
                            key={item.label + index}
                            onClick={() => {
                                if (!item.disabled) {
                                    item.action();
                                    onClose();
                                }
                            }}
                            className={`flex items-center gap-3 px-3 py-1.5 text-sm text-cnk-txt-secondary-light ${
                                item.disabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-cnk-bg-light hover:text-cnk-accent-primary cursor-pointer'
                            }`}
                        >
                            <i className={`fas ${item.icon} w-5 text-center`}></i>
                            <span>{item.label}</span>
                        </li>
                    );
                }
                return null;
            })}
        </ul>
    );
};

export default ContextMenu;
