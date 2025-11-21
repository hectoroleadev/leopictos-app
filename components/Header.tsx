import React from 'react';
import { Plus, Moon, Sun, Lock, Unlock } from 'lucide-react';
import { APP_TITLE } from '../constants';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  onOpenModal: () => void;
  hasItems: boolean;
}

const Header: React.FC<HeaderProps> = ({
  darkMode,
  toggleDarkMode,
  isEditMode,
  toggleEditMode,
  onOpenModal,
  hasItems
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-blue-100 dark:border-gray-700 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Leonel's Lion Logo */}
          <div className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform duration-300">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="#FBBC05" />
              <circle cx="50" cy="50" r="45" stroke="#F59E0B" strokeWidth="3" />
              <circle cx="25" cy="30" r="12" fill="#FBBC05" />
              <circle cx="75" cy="30" r="12" fill="#FBBC05" />
              <circle cx="25" cy="30" r="7" fill="#FFF9C4" />
              <circle cx="75" cy="30" r="7" fill="#FFF9C4" />
              <circle cx="50" cy="55" r="32" fill="#FFF9C4" />
              <path d="M42 52C42 52 50 60 58 52" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="50" cy="48" r="5" fill="#3E2723" />
              <circle cx="40" cy="40" r="4" fill="#3E2723" />
              <circle cx="60" cy="40" r="4" fill="#3E2723" />
              <circle cx="41.5" cy="38.5" r="1.5" fill="white" />
              <circle cx="61.5" cy="38.5" r="1.5" fill="white" />
              <circle cx="35" cy="55" r="5" fill="#F48FB1" opacity="0.6" />
              <circle cx="65" cy="55" r="5" fill="#F48FB1" opacity="0.6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-orange-500 dark:text-orange-400 tracking-tight transition-colors duration-300 font-fredoka hidden sm:block">{APP_TITLE}</h1>
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
            onClick={onOpenModal}
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