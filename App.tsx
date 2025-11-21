import React, { useState, useEffect } from 'react';
import { Plus, Search, Moon, Sun, Sparkles, Loader2, Lock, Unlock, CloudOff } from 'lucide-react';
import { Pictogram } from './types';
import PictogramCard from './components/PictogramCard';
import CreateModal from './components/CreateModal';
import { APP_TITLE } from './constants';
import { generatePictogramImage, generatePictogramAudio } from './services/geminiService';
import { uploadImageToS3 } from './services/storageService';
import { listPictograms, createPictogram, deletePictogram } from './services/apiService';

const EXAMPLE_WORDS = ['Perro', 'Casa', 'Feliz'];

function App() {
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false); // Default to Read Only mode
  const [fetchError, setFetchError] = useState<string | null>(null);
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

  // Load from API on mount
  const fetchPictograms = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const data = await listPictograms();
      // Sort by creation date desc
      const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
      setPictograms(sorted);
    } catch (error) {
      console.error("Failed to fetch pictograms:", error);
      setFetchError("No se pudo conectar con el servidor.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchPictograms();
  }, []);

  const handleAddPictogram = async (newPictogram: Pictogram) => {
    // The modal already handled S3 upload. Now we save the metadata to DB.
    try {
        // We exclude ID because the backend might assign it, 
        // OR if we are using UUID v4 generated on client, we keep it.
        // The apiService expects Omit<Pictogram, 'id'> but checking the API code provided,
        // it usually returns the created object. 
        // Let's try sending it without ID and let backend handle it, or with ID if your backend supports it.
        // For safety with the provided type definition:
        const { id, ...pictogramData } = newPictogram;
        
        const created = await createPictogram(pictogramData);
        
        // Update local state
        setPictograms(prev => [created, ...prev]);
    } catch (error) {
        console.error("Error creating pictogram in DB:", error);
        alert("Error guardando en la base de datos, aunque la imagen se subió.");
    }
  };

  const handleDeletePictogram = async (id: string) => {
    // Optimistic update
    const previous = [...pictograms];
    setPictograms(prev => prev.filter(p => p.id !== id));
    
    try {
        await deletePictogram(id);
    } catch (error) {
        console.error("Error deleting pictogram:", error);
        alert("No se pudo borrar el pictograma.");
        setPictograms(previous); // Revert
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
             const voiceToUse = picToUpdate.voiceId || 'Zephyr';
             newAudioBase64 = await generatePictogramAudio(newWord, voiceToUse);
         }

         // NOTE: The provided API Service does not include an UPDATE/PUT method.
         // For now, we will update Local State only so the user sees the change,
         // but strictly speaking, this change won't persist to the DB on reload
         // unless we implement an update endpoint.
         
         // Update State
         setPictograms(prev => prev.map(p => {
             if (p.id === id) {
                 return {
                     ...p,
                     word: newWord.toUpperCase(),
                     audioBase64: newAudioBase64,
                     isCustomAudio: picToUpdate.word !== newWord.toUpperCase() ? false : p.isCustomAudio
                 };
             }
             return p;
         }));

         // console.warn("Edit saved locally. Backend update not implemented in current API service.");

     } catch (error) {
         console.error("Error updating pictogram:", error);
         alert("No se pudo actualizar el audio. Intenta de nuevo.");
         throw error; // Throw so the card knows it failed
     }
  };

  const handleLoadExamples = async () => {
    if (isLoadingExamples) return;
    setIsLoadingExamples(true);
    setLoadedCount(0);
    
    try {
        // Create promises for each example to generate them in parallel
        const promises = EXAMPLE_WORDS.map(async (word) => {
            try {
                // Generate Image and Audio concurrently for this word
                const [image, audio] = await Promise.all([
                    generatePictogramImage(word),
                    generatePictogramAudio(word, 'Zephyr') // Default voice for examples
                ]);
                
                // Real S3 upload
                const imageUrl = await uploadImageToS3(image, `example-${word}-${Date.now()}.png`);
                
                const pictogramData = {
                    word: word.toUpperCase(),
                    imageUrl,
                    audioBase64: audio,
                    createdAt: Date.now(),
                    voiceId: 'Zephyr',
                    isCustomAudio: false
                };

                // Save to DB
                const created = await createPictogram(pictogramData);
                
                // Increment loaded count for visual feedback
                setLoadedCount(prev => prev + 1);
                
                return created;
            } catch (error) {
                console.error(`Error generating example for ${word}:`, error);
                return null;
            }
        });
        
        const results = await Promise.all(promises);
        const successfulPictograms = results.filter((p): p is Pictogram => p !== null);
        
        if (successfulPictograms.length > 0) {
            setPictograms(prev => [...successfulPictograms, ...prev]);
        } else {
            alert("No se pudieron generar los ejemplos.");
        }
        
    } catch (error) {
        console.error("Error loading examples:", error);
        alert("Ocurrió un error cargando los ejemplos.");
    } finally {
        setIsLoadingExamples(false);
        setLoadedCount(0);
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
                  <circle cx="50" cy="50" r="45" fill="#FBBC05" />
                  <circle cx="50" cy="50" r="45" stroke="#F59E0B" strokeWidth="3" />
                  <circle cx="25" cy="30" r="12" fill="#FBBC05" />
                  <circle cx="75" cy="30" r="12" fill="#FBBC05" />
                  <circle cx="25" cy="30" r="7" fill="#FFF9C4" />
                  <circle cx="75" cy="30" r="7" fill="#FFF9C4" />
                  <circle cx="50" cy="55" r="32" fill="#FFF9C4" />
                  <path d="M42 52C42 52 50 60 58 52" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="50" cy="48" r="5" fill="#3E2723" />
                  <circle cx="40" cy="40" r="4" fill="#3E2723" />
                  <circle cx="60" cy="40" r="4" fill="#3E2723" />
                  <circle cx="41.5" cy="38.5" r="1.5" fill="white" />
                  <circle cx="61.5" cy="38.5" r="1.5" fill="white" />
                  <circle cx="35" cy="55" r="5" fill="#F48FB1" opacity="0.6"/>
                  <circle cx="65" cy="55" r="5" fill="#F48FB1" opacity="0.6"/>
               </svg>
            </div>
            <h1 className="text-3xl font-bold text-orange-500 dark:text-orange-400 tracking-tight transition-colors duration-300 font-fredoka hidden sm:block">{APP_TITLE}</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Edit Mode Toggle */}
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

        {/* Error State */}
        {fetchError && !isFetching && (
            <div className="text-center py-10 text-red-500">
                <CloudOff size={48} className="mx-auto mb-4 opacity-50" />
                <p>{fetchError}</p>
                <button onClick={fetchPictograms} className="mt-4 text-blue-500 underline">Intentar de nuevo</button>
            </div>
        )}

        {/* Loading State */}
        {isFetching && (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-blue-500" />
            </div>
        )}

        {/* Grid */}
        {!isFetching && !fetchError && (
            <>
                {filteredPictograms.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                        <Search size={40} className="text-blue-300 dark:text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">No se encontraron pictogramas</h3>
                    <p className="text-gray-400 dark:text-gray-600 mt-2 mb-6">Agrega uno nuevo o carga ejemplos para Leonel.</p>
                    
                    <button 
                        onClick={handleLoadExamples}
                        disabled={isLoadingExamples}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                    >
                        {isLoadingExamples ? (
                            <>
                                <Loader2 size={20} className="animate-spin"/>
                                <span>Cargando ({loadedCount}/{EXAMPLE_WORDS.length})</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                <span>Cargar Ejemplos</span>
                            </>
                        )}
                    </button>
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
            </>
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