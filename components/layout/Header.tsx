
import React from 'react';
import { Plus, Moon, Sun, Lock, Unlock } from 'lucide-react';
import { APP_TITLE } from '../../constants';
import { useUIContext } from '../../context/UIContext';
import { usePictogramContext } from '../../context/PictogramContext';

const Header: React.FC = () => {
  const { 
    darkMode, toggleDarkMode, 
    isEditMode, toggleEditMode, 
    setModalOpen 
  } = useUIContext();
  
  const { pictograms } = usePictogramContext();
  const hasItems = pictograms.length > 0;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-blue-100 dark:border-gray-700 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          {/* PictoLeo Logo: Lion inside a Speech Bubble with AI Sparkle */}
          <div className="w-12 h-12 relative hover:scale-110 transition-transform duration-300">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Speech Bubble Body (Blue) */}
              <path d="M10 50 Q10 10 50 10 T90 50 Q90 85 60 88 L50 98 L40 88 Q10 85 10 50 Z" fill="#3B82F6" className="dark:fill-blue-600" />
              
              {/* Lion Face Circle */}
              <circle cx="50" cy="48" r="28" fill="#FBBC05" />
              <circle cx="50" cy="48" r="28" stroke="#F59E0B" strokeWidth="2" />
              
              {/* Lion Ears */}
              <circle cx="28" cy="32" r="7" fill="#FBBC05" />
              <circle cx="72" cy="32" r="7" fill="#FBBC05" />
              <circle cx="28" cy="32" r="4" fill="#FFF9C4" />
              <circle cx="72" cy="32" r="4" fill="#FFF9C4" />
              
              {/* Lion Muzzle */}
              <circle cx="50" cy="53" r="12" fill="#FFF9C4" />
              
              {/* Eyes */}
              <circle cx="42" cy="42" r="3" fill="#3E2723" />
              <circle cx="58" cy="42" r="3" fill="#3E2723" />
              
              {/* Nose & Mouth */}
              <path d="M46 52 Q50 56 54 52" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" fill="none" />
              <circle cx="50" cy="49" r="3" fill="#3E2723" />
              
              {/* AI Sparkle (Top Right) */}
              <path d="M85 15 L87 20 L92 22 L87 24 L85 29 L83 24 L78 22 L83 20 Z" fill="#FBBF24" className="animate-pulse" />
            </svg>
          </div>
          
          <div className="flex flex-col">
             <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight leading-none transition-colors duration-300 font-fredoka hidden sm:block">
               Picto<span className="text-orange-500">Leo</span>
             </h1>
             <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 tracking-widest uppercase hidden sm:block pl-0.5">AI Powered</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Edit Mode Toggle */}
          {hasItems && (
            <button
              onClick={toggleEditMode}
              className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isEditMode ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}
              title={isEditMode ? "Bloquear Edición" : "Habilitar Edición"}
            >
              {isEditMode ? <Unlock size={24} /> : <Lock size={24} />}
            </button>
          )}

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-yellow-400 hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-gray-500"
            aria-label="Cambiar modo oscuro"
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-bold shadow-lg shadow-green-200 dark:shadow-none flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
          >
            <Plus size={24} strokeWidth={3} />
            <span className="hidden md:inline">Generar Pictograma</span>
            <span className="md:hidden">Generar</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
