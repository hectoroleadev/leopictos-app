import { Pictogram } from '../types';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

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
