import React, { useState } from 'react';
import { X, Wand2, Save, Loader2, Volume2, Image as ImageIcon } from 'lucide-react';
import { generatePictogramImage, generatePictogramAudio, playAudio, VOICE_OPTIONS } from '../services/geminiService';
import { uploadImageToS3 } from '../services/storageService';
import { ProcessingState, Pictogram } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pictogram: Pictogram) => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [word, setWord] = useState('');
  const [state, setState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Voice Settings
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  
  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setWord('');
      setState(ProcessingState.IDLE);
      setGeneratedImage(null);
      setGeneratedAudio(null);
      setError(null);
      setSelectedVoice(VOICE_OPTIONS[0].id);
    }
  }, [isOpen]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setError(null);
    setState(ProcessingState.GENERATING_IMAGE);

    try {
      // 1. Generate Image
      let imageBase64: string;
      try {
        imageBase64 = await generatePictogramImage(word);
        setGeneratedImage(imageBase64);
      } catch (imgError) {
        console.error("Image generation error:", imgError);
        throw new Error("No se pudo generar la imagen. Intenta reformular la palabra.");
      }
      
      // 2. Generate Audio
      setState(ProcessingState.GENERATING_AUDIO);
      let audioBase64: string;
      try {
        audioBase64 = await generatePictogramAudio(word, selectedVoice);
        setGeneratedAudio(audioBase64);
      } catch (audioError) {
         console.error("Audio generation error:", audioError);
         throw new Error("La imagen se creó, pero falló el audio. Intenta de nuevo.");
      }
      
      // Auto play
      setTimeout(() => playAudio(audioBase64), 500);

      setState(ProcessingState.COMPLETE);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Hubo un error inesperado generando el pictograma.");
      setState(ProcessingState.ERROR);
    }
  };

  const handleSave = async () => {
    if (!generatedImage || !generatedAudio || !word) {
        setError("Falta la imagen o el audio.");
        return;
    }

    setState(ProcessingState.UPLOADING);
    try {
        const imageUrl = await uploadImageToS3(generatedImage, `pictogram-${Date.now()}.png`);
        
        const newPictogram: Pictogram = {
            id: uuidv4(),
            word: word.toUpperCase(),
            imageUrl: imageUrl,
            audioBase64: generatedAudio,
            createdAt: Date.now(),
            voiceId: selectedVoice,
            isCustomAudio: false
        };

        onSave(newPictogram);
        onClose();
    } catch (err) {
        console.error(err);
        setError("Error guardando el pictograma. Intenta de nuevo.");
        setState(ProcessingState.ERROR);
    }
  };

  if (!isOpen) return null;

  const isGenerating = state === ProcessingState.GENERATING_IMAGE || state === ProcessingState.GENERATING_AUDIO;
  const isUploading = state === ProcessingState.UPLOADING;
  const isProcessing = isGenerating || isUploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up transition-colors duration-300 my-8">
        
        {/* Header */}
        <div className="bg-blue-500 dark:bg-blue-600 p-6 flex justify-between items-center transition-colors duration-300">
          <h2 className="text-2xl font-bold text-white">Generar Pictograma</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={32} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Input Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Palabra o Acción</label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="ej. Manzana, Dormir, Jugar"
                className="w-full text-lg p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                disabled={isProcessing}
              />
            </div>

            {/* Voice Options */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Voz</label>
                <div className="flex flex-wrap gap-2">
                    {VOICE_OPTIONS.map(voice => (
                        <button
                            key={voice.id}
                            type="button"
                            onClick={() => setSelectedVoice(voice.id)}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all flex-1 ${selectedVoice === voice.id 
                                ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200 font-bold shadow-sm' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            {voice.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <button 
                type="submit"
                disabled={!word.trim() || isProcessing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-lg shadow-lg shadow-blue-200 dark:shadow-none mt-4"
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={24} className="animate-spin" />
                        {state === ProcessingState.GENERATING_IMAGE ? "Dibujando..." : "Creando voz..."}
                    </>
                ) : (
                    <>
                        <Wand2 size={24} />
                        Generar Pictograma
                    </>
                )}
            </button>
          </form>

          {/* Status & Preview */}
          <div className="min-h-[250px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 relative transition-colors duration-300">
            
            {state === ProcessingState.IDLE && !generatedImage && (
                <div className="text-center text-gray-400 dark:text-gray-500">
                    <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                    <p>Ingresa una palabra para comenzar</p>
                </div>
            )}

            {isGenerating && (
                <div className="text-center text-blue-600 dark:text-blue-400">
                    <Loader2 size={64} className="mx-auto mb-4 animate-spin" />
                    <p className="font-semibold animate-pulse">
                        {state === ProcessingState.GENERATING_IMAGE ? "Dibujando..." : "Creando voz..."}
                    </p>
                </div>
            )}

            {state === ProcessingState.UPLOADING && (
                 <div className="text-center text-green-600 dark:text-green-400">
                    <Loader2 size={64} className="mx-auto mb-4 animate-spin" />
                    <p className="font-semibold animate-pulse">Guardando...</p>
                </div>
            )}

            {generatedImage && !isGenerating && !isUploading && (
                <div className="w-full flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                    <div className="relative w-48 h-48 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-2">
                        <img src={generatedImage} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    
                    {generatedAudio && (
                        <button 
                            onClick={() => playAudio(generatedAudio)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors font-semibold"
                        >
                            <Volume2 size={20} /> {VOICE_OPTIONS.find(v=>v.id===selectedVoice)?.label}
                        </button>
                    )}
                </div>
            )}

            {error && (
                <div className="text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
                    <p>{error}</p>
                </div>
            )}
          </div>

        </div>

        {/* Footer / Save Actions */}
        {(generatedImage && generatedAudio && !isProcessing) && (
             <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-4 transition-colors duration-300">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center gap-2 transition-all"
                >
                    <Save size={24} />
                    Guardar
                </button>
             </div>
        )}
      </div>
    </div>
  );
};

export default CreateModal;