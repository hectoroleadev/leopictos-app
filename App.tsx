import React from 'react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import { PictogramProvider } from './context/PictogramContext';
import { UIProvider } from './context/UIContext';

function App() {
  return (
    <PictogramProvider>
      <UIProvider>
        <MainLayout>
          <HomePage />
        </MainLayout>
      </UIProvider>
    </PictogramProvider>
  );
}

export default App;