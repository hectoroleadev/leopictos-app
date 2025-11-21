import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, Lock, Unlock, CloudOff } from 'lucide-react';
import { Pictogram } from './types';
import PictogramCard from './components/PictogramCard';
import CreateModal from './components/CreateModal';
import Header from './components/Header';
import SentenceStrip from './components/SentenceStrip';
import { generatePictogramImage, generatePictogramAudio } from './services/geminiService';
import { uploadImageToS3 } from './services/storageService';
import { listPictograms, createPictogram, deletePictogram } from './services/apiService';

const EXAMPLE_WORDS = ['Perro', 'Casa', 'Feliz'];

// Simple Toast Component for better notifications
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-24 right-4 z-50 px-6 py-3 rounded-xl shadow-xl text-white font-bold animate-in slide-in-from-right fade-in ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      {message}
    </div>
  );
};

function App() {
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sentence, setSentence] = useState<Pictogram[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleAddPictogram = async (newPictogram: Pictogram) => {
    try {
        const { id, ...pictogramData } = newPictogram;
        const created = await createPictogram(pictogramData);
        setPictograms(prev => [created, ...prev]);
        showToast('Pictograma creado con éxito', 'success');
    } catch (error) {
        console.error("Error creating pictogram in DB:", error);
        showToast('Error guardando en la base de datos', 'error');
    }
  };

  const handleDeletePictogram = async (id: string) => {
    const previous = [...pictograms];
    setPictograms(prev => prev.filter(p => p.id !== id));
    
    try {
        await deletePictogram(id);
        showToast('Pictograma eliminado', 'success');
    } catch (error) {
        console.error("Error deleting pictogram:", error);
        showToast('No se pudo borrar el pictograma', 'error');
        setPictograms(previous);
    }
  };

  const handleEditPictogram = async (id: string, newWord: string) => {
     try {
         const picToUpdate = pictograms.find(p => p.id === id);
         if (!picToUpdate) return;

         let newAudioBase64 = picToUpdate.audioBase64;
         
         if (picToUpdate.word !== newWord.toUpperCase()) {
             const voiceToUse = picToUpdate.voiceId || 'Zephyr';
             newAudioBase64 = await generatePictogramAudio(newWord, voiceToUse);
         }

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
         
         showToast('Pictograma actualizado', 'success');
     } catch (error) {
         console.error("Error updating pictogram:", error);
         showToast('Error actualizando audio', 'error');
         throw error;
     }
  };

  const handleLoadExamples = async () => {
    if (isLoadingExamples) return;
    setIsLoadingExamples(true);
    setLoadedCount(0);
    
    try {
        const promises = EXAMPLE_WORDS.map(async (word) => {
            try {
                const [image, audio] = await Promise.all([
                    generatePictogramImage(word),
                    generatePictogramAudio(word, 'Zephyr')
                ]);
                
                const imageUrl = await uploadImageToS3(image, `example-${word}-${Date.now()}.png`);
                
                const pictogramData = {
                    word: word.toUpperCase(),
                    imageUrl,
                    audioBase64: audio,
                    createdAt: Date.now(),
                    voiceId: 'Zephyr',
                    isCustomAudio: false
                };

                const created = await createPictogram(pictogramData);
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
            showToast(`${successfulPictograms.length} ejemplos cargados`, 'success');
        } else {
            showToast("No se pudieron generar los ejemplos", 'error');
        }
        
    } catch (error) {
        console.error("Error loading examples:", error);
        showToast("Error general cargando ejemplos", 'error');
    } finally {
        setIsLoadingExamples(false);
        setLoadedCount(0);
    }
  };

  // Sentence Strip Logic
  const addToSentence = (pictogram: Pictogram) => {
    setSentence(prev => [...prev, pictogram]);
  };

  const removeFromSentence = (index: number) => {
    setSentence(prev => prev.filter((_, i) => i !== index));
  };

  const clearSentence = () => {
    setSentence([]);
  };

  const filteredPictograms = pictograms.filter(p => 
    p.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-[#f0f9ff] dark:bg-gray-900 transition-colors duration-300 ${sentence.length > 0 ? 'pb-32' : ''}`}>
      
      <Header 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        isEditMode={isEditMode}
        toggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenModal={() => setIsModalOpen(true)}
        hasItems={pictograms.length > 0}
      />

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
                        onSelect={addToSentence}
                        isEditMode={isEditMode}
                      />
                    ))}
                  </div>
                )}
            </>
        )}
      </main>

      {/* Sentence Builder Strip (AAC) */}
      <SentenceStrip 
        sentence={sentence}
        onRemove={removeFromSentence}
        onClear={clearSentence}
      />

      <CreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddPictogram} 
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default App;