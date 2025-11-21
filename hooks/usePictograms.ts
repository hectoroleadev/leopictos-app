import { useEffect, useCallback, useReducer } from 'react';
import { Pictogram } from '../types';
import { 
  listPictograms, 
  createPictogram, 
  deletePictogram, 
  updatePictogram 
} from '../services/apiService';
import { generatePictogramImage, generatePictogramAudio } from '../services/geminiService';
import { uploadImageToS3 } from '../services/storageService';
import { pictogramReducer, initialState } from '../reducers/pictogramReducer';
import { 
  fetchStart, fetchSuccess, fetchError, 
  addSuccess, 
  deletePictogramAction, deleteFailure, 
  updatePictogramAction, 
  reorderPictogramsAction,
  generateExamplesStart, generateExamplesSuccess, generateExamplesError 
} from '../reducers/pictogramActions';

const EXAMPLE_WORDS = ['Perro', 'Casa', 'Feliz'];

export const usePictograms = () => {
  const [state, dispatch] = useReducer(pictogramReducer, initialState);

  // Fetch Pictograms
  const loadPictograms = useCallback(async () => {
    dispatch(fetchStart());
    try {
      const data = await listPictograms();
      // Sort by newest first by default, unless we have a stored order field. 
      // For now, we respect the order returned or default sort.
      const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
      dispatch(fetchSuccess(sorted));
    } catch (err) {
      console.error("Error fetching pictograms:", err);
      dispatch(fetchError("No se pudo conectar con el servidor."));
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
      dispatch(addSuccess(created));
      return created;
    } catch (err) {
      console.error("Error adding pictogram:", err);
      throw err;
    }
  };

  // Remove Pictogram
  const removePictogram = async (id: string) => {
    const previousPictograms = state.pictograms;
    
    // Optimistic update
    dispatch(deletePictogramAction(id));
    
    try {
      await deletePictogram(id);
    } catch (err) {
      console.error("Error deleting pictogram:", err);
      // Rollback
      dispatch(deleteFailure(previousPictograms));
      throw err;
    }
  };

  // Update Pictogram
  const editPictogram = async (id: string, newWord: string) => {
    const picToUpdate = state.pictograms.find(p => p.id === id);
    if (!picToUpdate) return;

    try {
        let updates: Partial<Pictogram> = { word: newWord.toUpperCase() };

        // Optimistic update
        dispatch(updatePictogramAction(id, updates));

        // If word changed, regenerate audio
        if (picToUpdate.word !== newWord.toUpperCase()) {
            const voiceToUse = picToUpdate.voiceId || 'Zephyr';
            const newAudioBase64 = await generatePictogramAudio(newWord, voiceToUse);
            
            updates.audioBase64 = newAudioBase64;
            updates.isCustomAudio = false;
            
            // Update again with audio
            dispatch(updatePictogramAction(id, { audioBase64: newAudioBase64, isCustomAudio: false }));
        }

        // Call API to persist
        await updatePictogram(id, updates);

    } catch (err) {
        console.error("Error updating pictogram:", err);
        loadPictograms(); // Revert to server state on error
        throw err;
    }
  };

  // Reorder Pictograms (Local only for now, persist if backend supports it)
  const reorderPictograms = (newOrder: Pictogram[]) => {
    dispatch(reorderPictogramsAction(newOrder));
  };

  // Generate Examples logic
  const generateExamples = async (): Promise<number> => {
    if (state.loadingExamples) return 0;
    dispatch(generateExamplesStart());
    
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
            dispatch(generateExamplesSuccess(successfulPictograms));
            return successfulPictograms.length;
        }
        
        dispatch(generateExamplesSuccess([])); // Stop loading state
        return 0;
    } catch (err) {
        console.error("Error in bulk generation:", err);
        dispatch(generateExamplesError("Error generando ejemplos."));
        throw err;
    }
  };

  return {
    pictograms: state.pictograms,
    loading: state.loading,
    error: state.error,
    loadingExamples: state.loadingExamples,
    loadPictograms,
    addPictogram,
    removePictogram,
    editPictogram,
    reorderPictograms,
    generateExamples
  };
};