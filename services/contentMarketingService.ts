import { GoogleGenAI, Type } from "@google/genai";
import { ProductFormData, ContentFormData, MediaType, ProductPostContent, ContentMarketingPost } from "../types";
import { generateSimpleVideoFromImage } from './videoService.ts';

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

// Mock function for image generation (kept for image-only tasks)
const generateMockImages = (prompt: string, count = 1): string[] => {
    console.log(`Simulating IMAGE generation with prompt: ${prompt}`);
    const urls = [];
    for (let i = 0; i < count; i++) {
        // Using a placeholder image service
        urls.push(`https://picsum.photos/seed/${Math.random()}/1080/1080`);
    }
    return urls;
};

export const generateProductPost = async (
    formData: ProductFormData,
    outputType: MediaType,
    language: string
): Promise<ProductPostContent> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro';

    const prompt = `
    CRITICAL: Your entire output must be a single, raw string of text for a social media post, and nothing else. The text must be in the following language: ${language}.
    
    You are a creative marketing assistant. Generate a compelling social media post text for the following product.

    - Product Name: ${formData.productName}
    - Description: ${formData.productDescription}
    - Marketing Vibe: ${formData.marketingVibe}
    - Tone/Style Examples: 
        1. "${formData.postExample1}"
        2. "${formData.postExample2}"
        3. "${formData.postExample3}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        const postText = response.text.trim();
        let mediaUrl: string;

        if (outputType === 'video') {
             if (!formData.productImage) {
                 throw new Error("A product image is required to generate a simple video animation.");
             }
             mediaUrl = await generateSimpleVideoFromImage(
                formData.narrationScript || `A promotional video for ${formData.productName}`,
                formData.productImage,
                { aspectRatio: formData.aspectRatio as '16:9' | '9:16' }
            );
        } else {
            mediaUrl = generateMockImages(`A promotional image for ${formData.productName}`)[0];
        }

        return {
            productName: formData.productName,
            postText,
            mediaUrl,
            mediaType: outputType,
            script: outputType === 'video' ? formData.narrationScript : undefined,
        };
    } catch (error) {
        console.error("Error generating product post:", error);
        throw new Error("productGenerationError");
    }
};

export const generateContentMarketingPost = async (
    formData: ContentFormData,
    outputType: MediaType,
    language: string
): Promise<ContentMarketingPost> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro';

    const prompt = `
    CRITICAL: Your entire output must be a single, raw, valid JSON object, and nothing else. All text content must be in the following language: ${language}.
    
    You are a content marketing expert. Generate tailored social media post texts for Instagram, Facebook, LinkedIn, and TikTok based on the provided details.

    - Profession/Niche: ${formData.profession}
    - Target Audience: ${formData.targetAudience}
    - Professional Context/Theme: ${formData.professionalContext}
    - Tone/Style Examples:
        1. "${formData.postExample1}"
        2. "${formData.postExample2}"
        3. "${formData.postExample3}"
    
    Return a JSON object with this structure: { "instagram": "...", "facebook": "...", "linkedin": "...", "tiktok": "..." }
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        instagram: { type: Type.STRING },
                        facebook: { type: Type.STRING },
                        linkedin: { type: Type.STRING },
                        tiktok: { type: Type.STRING },
                    },
                    required: ["instagram", "facebook", "linkedin", "tiktok"],
                }
            }
        });

        const platformTexts = JSON.parse(response.text.trim());
        let mediaUrls: string[];

        if (outputType === 'video') {
            if (!formData.userSelfie) {
                throw new Error("A selfie is required to generate a simple video animation for content posts.");
            }
            const videoUrl = await generateSimpleVideoFromImage(
                formData.narrationScript || formData.professionalContext,
                formData.userSelfie,
                { aspectRatio: formData.aspectRatio as '16:9' | '9:16' }
            );
            mediaUrls = [videoUrl];
        } else {
             mediaUrls = generateMockImages(
                `A content marketing image for a ${formData.profession}`,
                formData.postFormat === 'carousel' ? formData.carouselSlides : 1
            );
        }


        return {
            mediaUrls,
            mediaType: outputType,
            platformTexts,
            script: outputType === 'video' ? formData.narrationScript : undefined,
        };
    } catch (error) {
        console.error("Error generating content marketing post:", error);
        throw new Error("contentGenerationError");
    }
};

export const generateContentNarrationScript = async (
    profession: string,
    targetAudience: string,
    professionalContext: string,
    videoDuration: '5s' | '8s',
    language: string,
    audioType: 'narration' | 'dialogue'
): Promise<string> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-flash';

    const scriptTypeInstruction = audioType === 'dialogue'
        ? 'Create a short, engaging dialogue script between two characters related to the professional context. Format it clearly, e.g., "Character 1: [line]", "Character 2: [line]".'
        : 'Create a concise and engaging narration script.';

    const prompt = `
    CRITICAL: Your entire output must be a single, raw string containing ONLY the generated script, and nothing else. The script must be in the following language: ${language}.
    
    You are a scriptwriter for professional content videos. ${scriptTypeInstruction}
    
    - Profession: ${profession}
    - Target Audience: ${targetAudience}
    - Professional Context/Theme: ${professionalContext}
    - Video Duration: ${videoDuration}

    The script should be compelling, insightful, and fit within the given video duration. Aim for a professional, clear, and engaging tone.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating content narration script:", error);
        throw new Error("narrationScriptApiError");
    }
};