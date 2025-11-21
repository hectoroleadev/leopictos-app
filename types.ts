export interface Pictogram {
  id: string;
  word: string; // The text label (e.g., "Manzana")
  imageUrl: string; // The URL (S3 or Base64) of the image
  audioBase64: string; // The generated TTS audio data
  createdAt: number;
  voiceId?: string; // The ID of the voice used (if AI)
  isCustomAudio?: boolean; // Whether the audio was recorded by the user
}

export enum ProcessingState {
  IDLE = 'IDLE',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  UPLOADING = 'UPLOADING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}