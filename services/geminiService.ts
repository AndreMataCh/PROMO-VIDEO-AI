
import { GoogleGenAI } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:image/jpeg;base64,..."
      // we need to remove the prefix "data:[mime-type];base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

interface GenerateVideoParams {
    prompt: string;
    imageFile: File | null;
    onProgress: (message: string) => void;
}

export const generateVideo = async ({ prompt, imageFile, onProgress }: GenerateVideoParams): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let imagePayload;
    if (imageFile) {
        onProgress("Encoding image...");
        const base64Data = await fileToBase64(imageFile);
        imagePayload = {
            imageBytes: base64Data,
            mimeType: imageFile.type,
        };
    }

    onProgress("Sending request to AI...");
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: imagePayload,
        config: {
            numberOfVideos: 1
        }
    });

    onProgress("AI is warming up... This may take a few minutes.");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        onProgress("Checking video generation status...");
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
        throw new Error("Video generation failed or returned no URI.");
    }
    
    const downloadLink = operation.response.generatedVideos[0].video.uri;

    onProgress("Downloading generated video...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    onProgress("Finalizing video...");
    
    return URL.createObjectURL(videoBlob);
};
