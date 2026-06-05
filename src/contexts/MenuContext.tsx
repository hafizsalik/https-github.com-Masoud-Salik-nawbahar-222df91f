import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface MenuContextValue {
  isOpen: boolean;
  isClosing: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsClosing(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        setIsClosing(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsClosing(false);
        }, 200);
        return prev;
      }
      setIsClosing(false);
      return true;
    });
  }, []);

  return (
    <MenuContext.Provider value={{ isOpen, isClosing, open, close, toggle }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    // Safe fallback when used outside provider (avoids crashes during HMR)
    return { isOpen: false, isClosing: false, open: () => {}, close: () => {}, toggle: () => {} };
  }
  return ctx;
}
