
export const APP_TITLE = "PictoLeo AI";
export const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
export const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";

// A system prompt to ensure the image style is consistent and suitable for autistic children (PECS style)
export const IMAGE_PROMPT_SUFFIX = "Estilo pictograma plano, minimalista, educativo, líneas gruesas negras, colores sólidos y vivos, fondo blanco puro, sin texto, estilo PECS (Picture Exchange Communication System).";

// API Gateway Endpoint
export const API_ENDPOINT = "https://rmxx2fv016.execute-api.us-east-1.amazonaws.com/dev";

// Mock S3 Bucket URL fallback (used if upload fails or for testing)
export const MOCK_S3_BUCKET_URL = "https://s3.amazonaws.com/my-pictogram-bucket/";
