import React, { useState, useEffect } from 'react';
import { Plus, Search, Moon, Sun, Lock, Unlock } from 'lucide-react';
import { Pictogram } from './types';
import PictogramCard from './components/PictogramCard';
import CreateModal from './components/CreateModal';
import { APP_TITLE } from './constants';
import { generatePictogramAudio } from './services/geminiService';
import { listPictograms, createPictogram, deletePictogram as apiDeletePictogram } from './services/apiService';




function App() {
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditMode, setIsEditMode] = useState(false); // Default to Read Only mode
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

  // Load pictograms from API on mount
  useEffect(() => {
    const loadPictograms = async () => {
      try {
        const data = await listPictograms();
        setPictograms(data);
      } catch (error) {
        console.error('Failed to load pictograms:', error);
        // Fallback to empty array on error
        setPictograms([]);
      }
    };
    loadPictograms();
  }, []);

  const handleAddPictogram = async (newPictogram: Pictogram) => {
    try {
      const created = await createPictogram(newPictogram);
      setPictograms(prev => [created, ...prev]);
    } catch (error) {
      console.error('Failed to create pictogram:', error);
      alert('Error al guardar el pictograma. Intenta de nuevo.');
    }
  };

  const handleDeletePictogram = async (id: string) => {
    try {
      await apiDeletePictogram(id);
      setPictograms(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete pictogram:', error);
      alert('Error al eliminar el pictograma. Intenta de nuevo.');
    }
  };

  const handleEditPictogram = async (id: string, newWord: string) => {
     try {
         // 1. Find the pictogram
         const picToUpdate = pictograms.find(p => p.id === id);
         if (!picToUpdate) return;

         // 2. Determine if we need to regenerate audio
         let newAudioBase64 = picToUpdate.audioBase64;
         
         if (picToUpdate.word !== newWord.toUpperCase()) {
             // If audio was custom recorded, we can't regenerate it for the new word accurately.
             // Logic: If custom, warn or default to AI?
             // Here we will default to standard AI generation to ensure audio matches text,
             // unless the user manually re-records (which isn't in this quick-edit UI).
             // Ideally, we use the saved voiceID if available.
             
             const voiceToUse = picToUpdate.voiceId || 'Zephyr'; // Default to Zephyr if not found or if it was custom before
             newAudioBase64 = await generatePictogramAudio(newWord, voiceToUse);
         }

         // 3. Update State
         setPictograms(prev => prev.map(p => {
             if (p.id === id) {
                 return {
                     ...p,
                     word: newWord.toUpperCase(),
                     audioBase64: newAudioBase64,
                     // If we regenerated audio, it's no longer custom if it was before
                     isCustomAudio: picToUpdate.word !== newWord.toUpperCase() ? false : p.isCustomAudio
                 };
             }
             return p;
         }));

     } catch (error) {
         console.error("Error updating pictogram:", error);
         alert("No se pudo actualizar el audio. Intenta de nuevo.");
         throw error; // Throw so the card knows it failed
     }
  };



  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleEditMode = () => setIsEditMode(!isEditMode);

  const filteredPictograms = pictograms.filter(p => 
    p.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f0f9ff] dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-blue-100 dark:border-gray-700 sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Leonel's Lion Logo */}
            <div className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform duration-300">
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Mane */}
                  <circle cx="50" cy="50" r="45" fill="#FBBC05" />
                  <circle cx="50" cy="50" r="45" stroke="#F59E0B" strokeWidth="3" />
                  {/* Ears */}
                  <circle cx="25" cy="30" r="12" fill="#FBBC05" />
                  <circle cx="75" cy="30" r="12" fill="#FBBC05" />
                  <circle cx="25" cy="30" r="7" fill="#FFF9C4" />
                  <circle cx="75" cy="30" r="7" fill="#FFF9C4" />
                  {/* Face */}
                  <circle cx="50" cy="55" r="32" fill="#FFF9C4" />
                  {/* Nose */}
                  <path d="M42 52C42 52 50 60 58 52" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="50" cy="48" r="5" fill="#3E2723" />
                  {/* Eyes */}
                  <circle cx="40" cy="40" r="4" fill="#3E2723" />
                  <circle cx="60" cy="40" r="4" fill="#3E2723" />
                  <circle cx="41.5" cy="38.5" r="1.5" fill="white" />
                  <circle cx="61.5" cy="38.5" r="1.5" fill="white" />
                  {/* Cheeks */}
                  <circle cx="35" cy="55" r="5" fill="#F48FB1" opacity="0.6"/>
                  <circle cx="65" cy="55" r="5" fill="#F48FB1" opacity="0.6"/>
               </svg>
            </div>
            <h1 className="text-3xl font-bold text-orange-500 dark:text-orange-400 tracking-tight transition-colors duration-300 font-fredoka hidden sm:block">{APP_TITLE}</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Edit Mode Toggle - Only visible if there are pictograms */}
            {pictograms.length > 0 && (
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
                onClick={() => setIsModalOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-bold shadow-lg shadow-green-200 dark:shadow-none flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
            >
                <Plus size={24} strokeWidth={3} />
                <span className="hidden md:inline">Generar Pictograma</span>
                <span className="md:hidden">Generar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <Search size={20} />
            </div>
            <input 
                type="text"
                placeholder="Buscar pictogramas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-blue-100 dark:border-gray-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all bg-white dark:bg-gray-800 dark:text-white shadow-sm"
            />
        </div>

        {/* Banner for Edit Mode */}
        {isEditMode && pictograms.length > 0 && (
            <div className="max-w-2xl mx-auto mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center animate-in slide-in-from-top-4">
                <p className="text-yellow-700 dark:text-yellow-300 text-sm font-semibold flex items-center justify-center gap-2">
                    <Unlock size={16} /> Modo Edición Activado: Puedes borrar o modificar pictogramas.
                </p>
            </div>
        )}

        {/* Grid */}
        {filteredPictograms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                <Search size={40} className="text-blue-300 dark:text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">No se encontraron pictogramas</h3>
            <p className="text-gray-400 dark:text-gray-600 mt-2">Agrega uno nuevo usando el botón "Generar Pictograma".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredPictograms.map(pictogram => (
              <PictogramCard 
                key={pictogram.id} 
                pictogram={pictogram} 
                onDelete={handleDeletePictogram}
                onEdit={handleEditPictogram}
                isEditMode={isEditMode}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddPictogram} 
      />
    </div>
  );
}

export default App;