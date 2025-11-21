import { useState, useEffect, useCallback } from 'react';
import { Pictogram } from '../types';
import { 
  listPictograms, 
  createPictogram, 
  deletePictogram, 
  updatePictogram 
} from '../services/apiService';
import { generatePictogramImage, generatePictogramAudio } from '../services/geminiService';
import { uploadImageToS3 } from '../services/storageService';

const EXAMPLE_WORDS = ['Perro', 'Casa', 'Feliz'];

export const usePictograms = () => {
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingExamples, setLoadingExamples] = useState(false);

  // Fetch Pictograms
  const loadPictograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPictograms();
      // Sort by newest first
      const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
      setPictograms(sorted);
    } catch (err) {
      console.error("Error fetching pictograms:", err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadPictograms();
  }, [loadPictograms]);

  // Add Pictogram
  const addPictogram = async (newPictogram: Pictogram) => {
    try {
      const { id, ...pictogramData } = newPictogram;
      const created = await createPictogram(pictogramData);
      setPictograms(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error("Error adding pictogram:", err);
      throw err;
    }
  };

  // Remove Pictogram
  const removePictogram = async (id: string) => {
    // Optimistic update
    const previous = [...pictograms];
    setPictograms(prev => prev.filter(p => p.id !== id));
    
    try {
      await deletePictogram(id);
    } catch (err) {
      console.error("Error deleting pictogram:", err);
      // Rollback
      setPictograms(previous);
      throw err;
    }
  };

  // Update Pictogram (Handles logic for regenerating audio if text changes)
  const editPictogram = async (id: string, newWord: string) => {
    const picToUpdate = pictograms.find(p => p.id === id);
    if (!picToUpdate) return;

    try {
        let updates: Partial<Pictogram> = { word: newWord.toUpperCase() };

        // If word changed, regenerate audio
        if (picToUpdate.word !== newWord.toUpperCase()) {
            const voiceToUse = picToUpdate.voiceId || 'Zephyr';
            const newAudioBase64 = await generatePictogramAudio(newWord, voiceToUse);
            
            updates.audioBase64 = newAudioBase64;
            updates.isCustomAudio = false; // Reset custom audio flag since we auto-generated
        }

        // Optimistic update local state
        setPictograms(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, ...updates };
            }
            return p;
        }));

        // Call API to persist
        await updatePictogram(id, updates);

    } catch (err) {
        console.error("Error updating pictogram:", err);
        // Ideally reload from server here to ensure sync
        loadPictograms();
        throw err;
    }
  };

  // Generate Examples logic
  const generateExamples = async (): Promise<number> => {
    if (loadingExamples) return 0;
    setLoadingExamples(true);
    
    let successCount = 0;

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
            successCount = successfulPictograms.length;
        }
        
        return successCount;
    } catch (err) {
        console.error("Error in bulk generation:", err);
        throw err;
    } finally {
        setLoadingExamples(false);
    }
  };

  return {
    pictograms,
    loading,
    error,
    loadingExamples,
    loadPictograms,
    addPictogram,
    removePictogram,
    editPictogram,
    generateExamples
  };
};