import { useState, useCallback } from 'react';

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
}

export const useContextMenu = () => {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setMenuState({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleClose = useCallback(() => {
    if (menuState.isOpen) {
        setMenuState(prevState => ({ ...prevState, isOpen: false }));
    }
  }, [menuState.isOpen]);

  return { menuState, handleContextMenu, handleClose };
};
