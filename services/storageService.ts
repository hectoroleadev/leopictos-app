import { MOCK_S3_BUCKET_URL } from "../constants";

/**
 * Simulates uploading a Base64 image string to AWS S3.
 * 
 * INSTRUCTIONS FOR REAL S3 IMPLEMENTATION:
 * 1. Do not store AWS Credentials in the frontend.
 * 2. Use a backend endpoint (Lambda/Node/Python) to generate a "Presigned URL".
 * 3. Perform a PUT request to that Presigned URL with the Blob data.
 * 
 * Example Real Flow:
 * const presignedUrl = await fetch('/api/get-upload-url', { method: 'POST', body: JSON.stringify({ filename }) });
 * await fetch(presignedUrl, { method: 'PUT', body: imageBlob });
 * return `https://bucket.s3.region.amazonaws.com/${filename}`;
 */
export const uploadImageToS3 = async (base64Image: string, filename: string): Promise<string> => {
  return new Promise((resolve) => {
    console.log(`[Mock S3] Uploading ${filename} to S3...`);
    
    // Simulate network delay
    setTimeout(() => {
      // For this demo, we are just going to return the base64 string 
      // so the image displays immediately without a real bucket.
      // In a real app, this would return the 'https://s3...' URL.
      
      // NOTE: To persist data across reloads in this serverless demo, 
      // we are relying on LocalStorage in App.tsx, so we return the Data URI here.
      // If you implement real S3, return `MOCK_S3_BUCKET_URL + filename`.
      
      console.log(`[Mock S3] Upload Complete: ${filename}`);
      resolve(base64Image); 
    }, 1500);
  });
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