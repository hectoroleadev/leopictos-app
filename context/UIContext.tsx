import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Pictogram } from '../types';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

interface UIContextType {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // Edit Mode
  isEditMode: boolean;
  toggleEditMode: () => void;
  
  // Modal
  isModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
  
  // Toast
  toast: ToastMessage | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  hideToast: () => void;

  // Sentence Strip
  sentence: Pictogram[];
  addToSentence: (pictogram: Pictogram) => void;
  removeFromSentence: (index: number) => void;
  clearSentence: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme Logic
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const toggleEditMode = () => setIsEditMode(prev => !prev);

  // Modal
  const [isModalOpen, setModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };
  const hideToast = () => setToast(null);

  // Sentence Strip
  const [sentence, setSentence] = useState<Pictogram[]>([]);
  const addToSentence = (pictogram: Pictogram) => setSentence(prev => [...prev, pictogram]);
  const removeFromSentence = (index: number) => setSentence(prev => prev.filter((_, i) => i !== index));
  const clearSentence = () => setSentence([]);

  return (
    <UIContext.Provider value={{
      darkMode, toggleDarkMode,
      isEditMode, toggleEditMode,
      isModalOpen, setModalOpen,
      toast, showToast, hideToast,
      sentence, addToSentence, removeFromSentence, clearSentence
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};