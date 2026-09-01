export interface CamelAiGeneratedImage {
  dataUrl: string;
  index: number;
}

export interface CamelAiGenerateImageResult {
  text: string | null;
  imageDataUrl: string | null;
  images: CamelAiGeneratedImage[];
}

export interface CamelAiBinding {
  generateImage(input: string | { prompt: string; referenceImageUrl?: string }): Promise<CamelAiGenerateImageResult>;
  transcribeAudio(input: string | { path?: string; audio?: string; base64?: string; data?: string }): Promise<{ text: string }>;
}
