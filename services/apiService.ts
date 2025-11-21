import { Pictogram } from '../types';
import { API_ENDPOINT } from '../constants';

/**
 * Create a new pictogram
 */
export const createPictogram = async (pictogram: Omit<Pictogram, 'id'>): Promise<Pictogram> => {
  const response = await fetch(`${API_ENDPOINT}/pictograms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pictogram)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create pictogram: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * List all pictograms (optionally filtered by userId)
 */
export const listPictograms = async (userId?: string): Promise<Pictogram[]> => {
  const url = userId 
    ? `${API_ENDPOINT}/pictograms?userId=${userId}`
    : `${API_ENDPOINT}/pictograms`;
    
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to list pictograms: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Get a specific pictogram by ID
 */
export const getPictogram = async (id: string): Promise<Pictogram> => {
  const response = await fetch(`${API_ENDPOINT}/pictograms/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get pictogram: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Update a pictogram (Note: Backend support required)
 * If backend doesn't support PUT/PATCH, this might need adjustment.
 */
export const updatePictogram = async (id: string, updates: Partial<Pictogram>): Promise<Pictogram> => {
    // Assuming standard REST conventions. If your lambda doesn't support this yet,
    // you might need to add the method to your API Gateway.
    const response = await fetch(`${API_ENDPOINT}/pictograms/${id}`, {
      method: 'PATCH', // or PUT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      // Fallback for now: If API fails (e.g. 404/405), we just return the merged object 
      // so the UI updates locally, but we throw a warning.
      console.warn(`Backend update failed (${response.status}). Updating locally only.`);
      // throw new Error(`Failed to update pictogram: ${response.statusText}`);
      return { id, ...updates } as Pictogram; 
    }
    
    return response.json();
  };

/**
 * Delete a pictogram
 */
export const deletePictogram = async (id: string): Promise<void> => {
  const response = await fetch(`${API_ENDPOINT}/pictograms/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete pictogram: ${response.statusText}`);
  }
};

/**
 * Get presigned S3 URL for uploading an image
 */
export const getUploadUrl = async (filename: string, contentType: string = 'image/png'): Promise<{
  uploadUrl: string;
  publicUrl: string;
  filename: string;
}> => {
  const response = await fetch(`${API_ENDPOINT}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get upload URL: ${response.statusText}`);
  }
  
  return response.json();
};