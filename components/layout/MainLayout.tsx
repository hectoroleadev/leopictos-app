import React from 'react';
import Header from './Header';
import SentenceStrip from './SentenceStrip';
import Toast from '../feedback/Toast';
import { useUIContext } from '../../context/UIContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { sentence, toast, hideToast } = useUIContext();

  return (
    <div className={`min-h-screen bg-[#f0f9ff] dark:bg-gray-900 transition-colors duration-300 flex flex-col ${sentence.length > 0 ? 'pb-32' : ''}`}>
      <Header />
      
      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <SentenceStrip />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </div>
  );
};

export default MainLayout;