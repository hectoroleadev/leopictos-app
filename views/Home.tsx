import React, { useState, useRef } from 'react';
import { Search, Sparkles, Loader2, CloudOff, Unlock, Move } from 'lucide-react';
import { Pictogram } from '../types';
import PictogramCard from '../components/cards/PictogramCard';
import CreateModal from '../components/modals/CreateModal';
import { usePictogramContext } from '../context/PictogramContext';
import { useUIContext } from '../context/UIContext';

const Home: React.FC = () => {
  const { 
    pictograms, loading, error, loadingExamples, 
    addPictogram, removePictogram, editPictogram, 
    loadPictograms, generateExamples, reorderPictograms
  } = usePictogramContext();

  const { 
    isEditMode, addToSentence, showToast, 
    isModalOpen, setModalOpen 
  } = useUIContext();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Drag and Drop State
  const [dragItemIndex, setDragItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);

  const filteredPictograms = pictograms.filter(p => 
    p.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Disable Drag n Drop if searching, as indices won't match source array
  const isDragEnabled = searchTerm === '';

  // --- Wrappers interfacing Context Logic with UI Feedback ---

  const handleAdd = async (newPictogram: Pictogram) => {
    try {
        await addPictogram(newPictogram);
        showToast('Pictograma creado con éxito', 'success');
    } catch (error) {
        showToast('Error guardando en la base de datos', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
        await removePictogram(id);
        showToast('Pictograma eliminado', 'success');
    } catch (error) {
        showToast('No se pudo borrar el pictograma', 'error');
    }
  };

  const handleEdit = async (id: string, newWord: string) => {
     try {
         await editPictogram(id, newWord);
         showToast('Pictograma actualizado', 'success');
     } catch (error) {
         showToast('Error actualizando audio', 'error');
     }
  };

  const handleLoadExamples = async () => {
    try {
        const count = await generateExamples();
        if (count > 0) {
            showToast(`${count} ejemplos cargados`, 'success');
        } else {
            showToast("No se pudieron generar los ejemplos", 'error');
        }
    } catch (error) {
        showToast("Error general cargando ejemplos", 'error');
    }
  };

  // --- DnD Handlers ---
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragItemIndex(index);
    // Required for Firefox and other browsers to recognize the drag operation
    e.dataTransfer.effectAllowed = "move"; 
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragEnter = (index: number) => (e: React.DragEvent) => {
     setDragOverItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (dragItemIndex === null || dragOverItemIndex === null) return;
    if (dragItemIndex === dragOverItemIndex) {
        setDragItemIndex(null);
        setDragOverItemIndex(null);
        return;
    }

    // Reorder logic
    const _pictograms = [...pictograms];
    const draggedItemContent = _pictograms[dragItemIndex];
    
    _pictograms.splice(dragItemIndex, 1);
    _pictograms.splice(dragOverItemIndex, 0, draggedItemContent);

    setDragItemIndex(null);
    setDragOverItemIndex(null);

    reorderPictograms(_pictograms);
  };
  
  const handleDragEnd = () => {
     setDragItemIndex(null);
     setDragOverItemIndex(null);
  };

  return (
    <>
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
        
        {/* Drag Tip */}
        {isDragEnabled && pictograms.length > 1 && !loading && !error && (
             <div className="text-center mb-4 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                <Move size={12} /> Arrastra las tarjetas para reordenarlas
             </div>
        )}

        {/* Error State */}
        {error && !loading && (
            <div className="text-center py-10 text-red-500">
                <CloudOff size={48} className="mx-auto mb-4 opacity-50" />
                <p>{error}</p>
                <button onClick={loadPictograms} className="mt-4 text-blue-500 underline">Intentar de nuevo</button>
            </div>
        )}

        {/* Loading State */}
        {loading && (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-blue-500" />
            </div>
        )}

        {/* Grid */}
        {!loading && !error && (
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
                        disabled={loadingExamples}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                    >
                        {loadingExamples ? (
                            <>
                                <Loader2 size={20} className="animate-spin"/>
                                <span>Cargando...</span>
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
                    {filteredPictograms.map((pictogram, index) => (
                      <PictogramCard 
                        key={pictogram.id} 
                        pictogram={pictogram} 
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onSelect={addToSentence}
                        isEditMode={isEditMode}
                        // DnD Props
                        draggable={isDragEnabled}
                        onDragStart={handleDragStart(index)}
                        onDragEnter={handleDragEnter(index)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        isDragging={index === dragItemIndex}
                        isDragOver={index === dragOverItemIndex}
                      />
                    ))}
                  </div>
                )}
            </>
        )}

        <CreateModal 
            isOpen={isModalOpen} 
            onClose={() => setModalOpen(false)} 
            onSave={handleAdd} 
        />
    </>
  );
};

export default Home;