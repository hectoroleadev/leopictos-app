import React, { useState } from 'react';
import { Pictogram } from '../../types';
import { Play, Trash2, Check, X, Loader2, Edit2, GripHorizontal } from 'lucide-react';
import { playAudio } from '../../services/geminiService';

interface PictogramCardProps {
  pictogram: Pictogram;
  onDelete: (id: string) => void;
  onEdit: (id: string, newWord: string) => Promise<void>;
  onSelect?: (pictogram: Pictogram) => void;
  isEditMode: boolean;
  // DnD Props
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const PictogramCard: React.FC<PictogramCardProps> = ({ 
  pictogram, 
  onDelete, 
  onEdit, 
  onSelect, 
  isEditMode,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  onDragEnd,
  isDragging,
  isDragOver
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedWord, setEditedWord] = useState(pictogram.word);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handlePlay = async () => {
    if (isPlaying || isDeleting || isEditing) return;
    
    // Trigger audio
    setIsPlaying(true);
    try {
      await playAudio(pictogram.audioBase64);
      // Add a small visual timeout to simulate "playing" state duration if audio is short
      setTimeout(() => setIsPlaying(false), 1000);
    } catch (e) {
      console.error("Failed to play audio", e);
      setIsPlaying(false);
    }

    // Notify parent (for sentence builder)
    if (onSelect && !isEditMode) {
        onSelect(pictogram);
    }
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(pictogram.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(false);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedWord(pictogram.word);
    setIsEditing(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedWord(pictogram.word);
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editedWord.trim() || editedWord === pictogram.word) {
      setIsEditing(false);
      return;
    }

    setIsSavingEdit(true);
    try {
      await onEdit(pictogram.id, editedWord);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save edit", error);
      // Optionally show error feedback
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      className={`
        relative group bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden border-4
        ${isDragging ? 'opacity-40 scale-95 grayscale' : 'opacity-100'}
        ${isDragOver ? 'border-dashed border-blue-500 dark:border-blue-400 scale-105 shadow-2xl z-10' : ''}
        ${isEditing ? 'border-yellow-400' : (isDragOver ? '' : 'border-blue-100 hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600')}
        ${!isEditing && !isDragging && !isDragOver ? 'hover:-translate-y-1 hover:shadow-xl' : ''}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      
      {/* Drag Handle Indicator (Optional visual cue) */}
      {draggable && !isEditMode && !isDeleting && (
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-gray-600">
           <GripHorizontal size={20} />
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {isDeleting && (
        <div className="absolute inset-0 z-20 bg-red-500/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <p className="text-white font-bold text-xl mb-6 text-center drop-shadow-md">
            ¿Borrar?
          </p>
          <div className="flex gap-6">
            <button 
              onClick={handleCancelDelete}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              aria-label="Cancelar"
            >
              <X size={28} strokeWidth={3} />
            </button>
            <button 
              onClick={handleDeleteConfirm}
              className="p-3 bg-white text-red-600 hover:bg-red-50 rounded-full shadow-lg transition-transform transform hover:scale-110"
              aria-label="Confirmar borrado"
            >
              <Check size={28} strokeWidth={4} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Loading Overlay */}
      {isSavingEdit && (
        <div className="absolute inset-0 z-20 bg-blue-500/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <Loader2 size={48} className="text-white animate-spin mb-2" />
          <p className="text-white font-bold text-center">Actualizando...</p>
        </div>
      )}

      {/* Card Main Click Area - Triggers Sound */}
      <button 
        onClick={handlePlay}
        disabled={isPlaying || isDeleting || isEditing || isSavingEdit}
        className={`w-full h-full flex flex-col items-center p-4 focus:outline-none focus:ring-4 focus:ring-blue-400 rounded-xl ${isPlaying ? 'cursor-wait' : ''} ${draggable ? '' : 'cursor-pointer'}`}
        aria-label={`Reproducir sonido para ${pictogram.word}`}
      >
        <div className={`relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 transition-all duration-300 ${isPlaying ? 'ring-4 ring-yellow-400 scale-95' : ''}`}>
           <img 
             src={pictogram.imageUrl} 
             alt={`Pictograma de ${pictogram.word}`} 
             className="w-full h-full object-contain p-2 pointer-events-none select-none" // pointer-events-none helps drag consistency
           />
           {/* Play/Loading Overlay Icon */}
           <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isPlaying ? 'bg-black/10 opacity-100' : 'bg-black/10 opacity-0 group-hover:opacity-100'}`}>
             {isPlaying ? (
                <Loader2 size={48} className="text-yellow-500 animate-spin drop-shadow-lg" />
             ) : (
                <Play size={48} className="text-white drop-shadow-lg fill-current" />
             )}
           </div>
        </div>
        
        {isEditing ? (
          <div className="w-full flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
             <input 
                type="text"
                value={editedWord}
                onChange={(e) => setEditedWord(e.target.value.toUpperCase())}
                className="w-full bg-white dark:bg-gray-700 border-2 border-blue-400 rounded-lg px-2 py-1 text-center font-bold text-xl uppercase text-gray-800 dark:text-white focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === ' ') e.stopPropagation(); // prevent accidental play on space
                }}
             />
          </div>
        ) : (
            <h3 className={`text-3xl font-bold uppercase tracking-wider text-center w-full break-words transition-colors duration-300 ${isPlaying ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-800 dark:text-gray-100'}`}>
              {pictogram.word}
            </h3>
        )}
      </button>

      {/* Action Buttons - Only Visible in Edit Mode */}
      {isEditMode && !isDeleting && !isPlaying && !isSavingEdit && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-full z-10">
           {isEditing ? (
              <>
                <button 
                    onClick={handleCancelEdit}
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    title="Cancelar edición"
                >
                    <X size={18} />
                </button>
                <button 
                    onClick={handleSaveEdit}
                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                    title="Guardar cambios"
                >
                    <Check size={18} />
                </button>
              </>
           ) : (
              <>
                <button 
                    onClick={handleStartEdit}
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 shadow-sm"
                    aria-label="Editar texto"
                >
                    <Edit2 size={18} />
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleting(true);
                    }}
                    className="p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200 shadow-sm"
                    aria-label="Borrar pictograma"
                >
                    <Trash2 size={18} />
                </button>
              </>
           )}
        </div>
      )}
    </div>
  );
};

export default PictogramCard;