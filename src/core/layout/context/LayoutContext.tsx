import { createContext, useContext } from 'react';

interface LayoutContextType {
    setTitle: (title: string) => void;
}

export const LayoutContext = createContext<LayoutContextType>({
    setTitle: () => { }
});

export const useLayout = () => useContext(LayoutContext);
