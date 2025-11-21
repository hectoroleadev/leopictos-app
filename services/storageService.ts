import { getUploadUrl } from "./apiService";

/**
 * Uploads a Base64 image string to AWS S3 using presigned URLs.
 */
export const uploadImageToS3 = async (base64Image: string, filename: string): Promise<string> => {
  try {
    // Get presigned URL from backend
    const { uploadUrl, publicUrl } = await getUploadUrl(filename, 'image/png');
    
    // Convert base64 to blob
    const blob = base64ToBlob(base64Image, 'image/png');
    
    // Upload to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/png'
      }
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
    }
    
    console.log(`[S3] Upload complete: ${filename}`);
    return publicUrl;
    
  } catch (error) {
    console.error('[S3] Upload error:', error);
    throw error;
  }
};

/**
 * Helper to convert Base64 to Blob if needed for real S3 upload
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
};