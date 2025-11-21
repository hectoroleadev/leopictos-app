import { getUploadUrl } from "./apiService";

/**
 * Helper to convert Base64 to Blob for real S3 upload
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
    // Handle cases where base64 string might not have the prefix
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
};

/**
 * Uploads a Base64 image string to AWS S3 via a presigned URL obtained from the API.
 */
export const uploadImageToS3 = async (base64Image: string, filename: string): Promise<string> => {
  try {
    console.log(`[S3] Getting upload URL for ${filename}...`);
    
    // 1. Get Presigned URL
    const { uploadUrl, publicUrl } = await getUploadUrl(filename, 'image/png');

    // 2. Convert Base64 to Blob
    const imageBlob = base64ToBlob(base64Image, 'image/png');

    // 3. Upload to S3
    console.log(`[S3] Uploading binary data to ${uploadUrl}...`);
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'image/png'
        },
        body: imageBlob
    });

    if (!uploadResponse.ok) {
        throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`);
    }

    console.log(`[S3] Upload Complete. Public URL: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error("Error uploading to S3:", error);
    // Fallback: Return the base64 string so the UI still works even if upload fails
    // (The database save will technically have a huge string, or might fail depending on DB limits, 
    // but this keeps the UI responsive for the user in case of partial failure)
    return base64Image;
  }
};