import React, { useState } from 'react';
import { Pictogram } from '../types';
import { Play, Trash2, Delete, XCircle } from 'lucide-react';
import { playAudio } from '../services/geminiService';

interface SentenceStripProps {
  sentence: Pictogram[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

const SentenceStrip: React.FC<SentenceStripProps> = ({ sentence, onRemove, onClear }) => {
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handlePlaySequence = async () => {
    if (isPlayingSequence || sentence.length === 0) return;
    
    setIsPlayingSequence(true);
    
    try {
      for (let i = 0; i < sentence.length; i++) {
        setActiveIndex(i);
        // Wait for the audio to finish before playing the next one
        // We can approximate duration or wrap playAudio in a promise that resolves on end
        // For now, playAudio is fire-and-forget in the service, so we need to estimate or update service.
        // Assuming playAudio returns a promise that resolves when *started*.
        // We add a delay proportional to typical word length or fixed delay.
        await playAudio(sentence[i].audioBase64);
        
        // Simple delay between words
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    } catch (e) {
      console.error("Sequence playback error", e);
    } finally {
      setActiveIndex(null);
      setIsPlayingSequence(false);
    }
  };

  if (sentence.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t-4 border-blue-400 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transition-all duration-300 animate-in slide-in-from-bottom-full">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        
        {/* Play Button */}
        <button
          onClick={handlePlaySequence}
          disabled={isPlayingSequence}
          className={`shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${isPlayingSequence ? 'bg-yellow-400 cursor-wait' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          <Play size={32} fill="currentColor" className={isPlayingSequence ? "text-white animate-pulse" : ""} />
        </button>

        {/* The Strip */}
        <div className="flex-1 overflow-x-auto flex items-center gap-3 py-2 px-2 scrollbar-hide">
          {sentence.map((pic, index) => (
            <div 
              key={`${pic.id}-${index}`}
              className={`relative group shrink-0 w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all duration-300 ${activeIndex === index ? 'border-yellow-400 scale-110 shadow-lg ring-2 ring-yellow-200' : 'border-gray-200 dark:border-gray-600'}`}
            >
              <img src={pic.imageUrl} alt={pic.word} className="w-14 h-14 object-contain mb-1" />
              <span className="text-[10px] font-bold uppercase truncate max-w-full text-gray-700 dark:text-gray-200">{pic.word}</span>
              
              <button 
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XCircle size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="shrink-0 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex flex-col items-center text-xs font-bold gap-1"
        >
          <Trash2 size={24} />
          Borrar
        </button>
      </div>
    </div>
  );
};

export default SentenceStrip;