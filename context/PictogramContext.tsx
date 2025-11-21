import React, { createContext, useContext, ReactNode } from 'react';
import { usePictograms } from '../hooks/usePictograms';
import { Pictogram } from '../types';

interface PictogramContextType {
  pictograms: Pictogram[];
  loading: boolean;
  error: string | null;
  loadingExamples: boolean;
  loadPictograms: () => Promise<void>;
  addPictogram: (pictogram: Pictogram) => Promise<Pictogram>;
  removePictogram: (id: string) => Promise<void>;
  editPictogram: (id: string, newWord: string) => Promise<void>;
  reorderPictograms: (newOrder: Pictogram[]) => void;
  generateExamples: () => Promise<number>;
}

const PictogramContext = createContext<PictogramContextType | undefined>(undefined);

export const PictogramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pictogramData = usePictograms();

  return (
    <PictogramContext.Provider value={pictogramData}>
      {children}
    </PictogramContext.Provider>
  );
};

export const usePictogramContext = () => {
  const context = useContext(PictogramContext);
  if (!context) {
    throw new Error('usePictogramContext must be used within a PictogramProvider');
  }
  return context;
};