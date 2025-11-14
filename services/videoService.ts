// services/videoService.ts
import { GoogleGenAI, Modality, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { UploadedImage } from "../types.ts";
import { sanitizePromptForVideo } from "./geminiService.ts";

const getGoogleAI = () => {
    // The API key is a master key managed in the application's environment variables.
    // A new instance is created for each call to ensure consistency.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

interface VideoConfig {
    aspectRatio: '16:9' | '9:16';
}

/**
 * Normalizes an image by redrawing it on a canvas and exporting it as a clean JPEG.
 * This removes problematic metadata and ensures a standard format for the video API.
 * Uses a robust method of manually decoding the base64 string to a blob.
 */
const normalizeImage = async (image: UploadedImage): Promise<UploadedImage> => {
    try {
        // Direct base64 decoding to avoid fetch issues with data URIs
        const binaryString = atob(image.base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: image.mimeType });

        const imageBitmap = await createImageBitmap(blob);

        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1920; // Cap dimensions for performance
        let { width, height } = imageBitmap;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
                height = Math.round((height * MAX_DIMENSION) / width);
                width = MAX_DIMENSION;
            } else {
                width = Math.round((width * MAX_DIMENSION) / height);
                height = MAX_DIMENSION;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        ctx.drawImage(imageBitmap, 0, 0, width, height);
        imageBitmap.close(); // Release memory

        const newJpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const newBase64 = newJpegDataUrl.split(',')[1];

        return {
            base64: newBase64,
            mimeType: 'image/jpeg',
            name: image.name ? image.name.replace(/\.\w+$/, '.jpg') : 'normalized-image.jpg',
        };
    } catch (err) {
        console.error(`Error processing image for normalization: ${image.name}`, err);
        throw new Error('videoGenerationImageError');
    }
};


/**
 * Generates a simple video by animating a single starting image.
 * Used for the "Standard Creation" flow.
 */
export const generateSimpleVideoFromImage = async (
    prompt: string,
    startImage: UploadedImage,
    config: VideoConfig
): Promise<string> => {
    try {
        console.log("Starting simple video generation...");
        const ai = getGoogleAI();
        const videoModel = 'veo-3.1-fast-generate-preview';
        
        const sanitizedPrompt = await sanitizePromptForVideo(prompt);
        const normalizedStartImage = await normalizeImage(startImage);

        let operation = await ai.models.generateVideos({
            model: videoModel,
            prompt: sanitizedPrompt,
            image: {
                imageBytes: normalizedStartImage.base64,
                mimeType: normalizedStartImage.mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: config.aspectRatio,
            }
        });

        console.log("Simple video generation operation started:", operation.name);

        while (!operation.done) {
            console.log("Polling for simple video result... Current status:", operation.metadata?.state);
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            if (operation.error) {
                console.error("Operation failed during polling:", operation.error);
                break;
            }
        }

        console.log("Simple video generation operation finished.", operation);
        
        const finalError = operation.error || operation.response?.error;
        if (finalError) {
            const errorMessage = (finalError.message || '').toLowerCase();
            console.error("Video generation operation failed with an error:", finalError);
            if (errorMessage.includes('safety') || errorMessage.includes('policy') || errorMessage.includes('blocked')) {
                throw new Error('videoGenerationError'); // Specific safety error
            }
             if (errorMessage.includes('unable to process input image')) {
                throw new Error('videoGenerationImageError');
            }
            if (errorMessage.includes('requested entity was not found') || errorMessage.includes('permission denied')) {
                throw new Error('videoGenerationAuthError');
            }
            throw new Error('videoGenerationFailedGeneric'); // Other API-reported error
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            console.error("Video URI not found in successful operation response.");
            throw new Error("videoGenerationFailedGeneric");
        }

        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to download video file: ${response.statusText}`, errorText);
            throw new Error("videoGenerationFailedGeneric");
        }
        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        console.log("Simple video generation successful. Video at:", videoUrl);
        return videoUrl;

    } catch (error: any) {
        console.error("Exception during simple video generation:", error);
        if (['videoGenerationError', 'videoGenerationFailedGeneric', 'videoGenerationImageError', 'videoGenerationAuthError'].includes(error.message)) {
            throw error;
        }
        throw new Error("videoGenerationFailedGeneric");
    }
};


/**
 * Generates a high-fidelity 16:9 "master" video using reference images
 * to ensure maximum character consistency. This video can then be cropped
 * to other aspect ratios on the client-side.
 */
export const generateCompositeVideo = async (
    prompt: string,
    backgroundImage: UploadedImage | null,
    assetImages: (UploadedImage | null)[]
): Promise<string> => {
    if (!prompt) {
        throw new Error("A prompt is required for special video generation.");
    }

    try {
        console.log("Starting high-fidelity composite video generation (16:9)...");
        const ai = getGoogleAI();
        const videoModel = 'veo-3.1-generate-preview';
        
        const sanitizedPrompt = await sanitizePromptForVideo(prompt);

        const allImages = [backgroundImage, ...assetImages].filter(img => img) as UploadedImage[];

        if (allImages.length === 0) {
            throw new Error("At least one image (background or asset) is required.");
        }
        
        const normalizedImages = await Promise.all(allImages.map(normalizeImage));

        const referenceImagesPayload: VideoGenerationReferenceImage[] = [];
        for (const img of normalizedImages) {
            referenceImagesPayload.push({
                image: {
                    imageBytes: img.base64,
                    mimeType: img.mimeType,
                },
                referenceType: VideoGenerationReferenceType.ASSET,
            });
        }

        let operation = await ai.models.generateVideos({
            model: videoModel,
            prompt: sanitizedPrompt,
            config: {
                numberOfVideos: 1,
                referenceImages: referenceImagesPayload,
                resolution: '720p',
                aspectRatio: '16:9' // Force 16:9 for high-fidelity mode
            }
        });

        console.log("High-fidelity video generation operation started:", operation.name);

        while (!operation.done) {
            console.log("Polling for high-fidelity video result... Current status:", operation.metadata?.state);
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            if (operation.error) {
                console.error("Operation failed during polling:", operation.error);
                break;
            }
        }
        
        console.log("High-fidelity video generation operation finished.", operation);
        
        const finalError = operation.error || operation.response?.error;
        if (finalError) {
            const errorMessage = (finalError.message || '').toLowerCase();
            console.error("High-fidelity video operation failed with an error:", finalError);
            if (errorMessage.includes('safety') || errorMessage.includes('policy') || errorMessage.includes('blocked')) {
                throw new Error('videoGenerationError');
            }
            if (errorMessage.includes('unable to process input image')) {
                throw new Error('videoGenerationImageError');
            }
            if (errorMessage.includes('requested entity was not found') || errorMessage.includes('permission denied')) {
                throw new Error('videoGenerationAuthError');
            }
            throw new Error('videoGenerationFailedGeneric');
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            console.error("Video URI not found in successful composite video response.");
            throw new Error("videoGenerationFailedGeneric");
        }


        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to download video file: ${response.statusText}`, errorText);
            throw new Error("videoGenerationFailedGeneric");
        }
        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        console.log("High-fidelity video generation successful. Video at:", videoUrl);
        return videoUrl;

    } catch (error: any) {
        console.error("Exception during high-fidelity video generation:", error);
         if (['videoGenerationError', 'videoGenerationFailedGeneric', 'videoGenerationImageError', 'videoGenerationAuthError'].includes(error.message)) {
            throw error;
        }
        throw new Error("videoGenerationFailedGeneric");
    }
};