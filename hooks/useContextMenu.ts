
import { useState, useCallback, MouseEvent } from 'react';

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
}

export const useContextMenu = () => {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  // FIX: Use `MouseEvent` imported from `react` instead of the global `MouseEvent`.
  const handleContextMenu = useCallback((event: MouseEvent) => {
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
