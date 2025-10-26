// Fix: Implement Gemini API calls for content marketing post generation.
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ContentMarketingPost } from "../types";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateContentMarketingPost = async (
    profession: string,
    targetAudience: string,
    professionalContext: string
): Promise<ContentMarketingPost> => {
    const ai = getGoogleAI();

    // Step 1: Generate a detailed image prompt and platform-specific texts.
    const textGenerationPrompt = `
    Based on the following professional profile, generate a content marketing pack.
    Profession/Specialty: ${profession}
    Target Audience: ${targetAudience || 'General public'}
    Additional Context: ${professionalContext || 'N/A'}

    The pack must contain:
    1. A detailed, visually rich prompt for an AI image generator to create a professional and captivating image representing the profession. The prompt should describe a scene, style, and mood. For example: "A vibrant, high-resolution photograph of a modern, minimalist living room designed by an interior designer. Sunlight streams through large windows, highlighting a sleek, comfortable sofa and a unique piece of art on the wall. The style is clean, inspiring, and sophisticated. photorealistic."
    2. Customized post texts for Instagram, LinkedIn, and TikTok.
        - Instagram: Visually focused, use relevant hashtags, friendly tone.
        - LinkedIn: Professional, focused on value and expertise.
        - TikTok: Short, punchy, suggesting a trend or quick tip.
    `;
    
    const textModel = 'gemini-2.5-flash';
    const textResponse = await ai.models.generateContent({
        model: textModel,
        contents: textGenerationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    imagePrompt: { type: Type.STRING, description: "A prompt for an AI image generator." },
                    platformTexts: {
                        type: Type.OBJECT,
                        properties: {
                            instagram: { type: Type.STRING, description: "Text for Instagram." },
                            linkedin: { type: Type.STRING, description: "Text for LinkedIn." },
                            tiktok: { type: Type.STRING, description: "Text for TikTok." },
                        },
                        required: ["instagram", "linkedin", "tiktok"]
                    }
                },
                required: ["imagePrompt", "platformTexts"]
            }
        }
    });
    
    const textResult = JSON.parse(textResponse.text);
    const { imagePrompt, platformTexts } = textResult;

    // Step 2: Generate the image using the created prompt.
    const imageModel = 'gemini-2.5-flash-image';
    const imageResponse = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [{ text: imagePrompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });
    
    let imageUrl = '';
    const candidate = imageResponse.candidates?.[0];
    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            break; 
          }
        }
    }

    if (!imageUrl) {
        throw new Error("Image generation failed or did not return an image.");
    }

    return {
        imageUrl,
        platformTexts,
    };
};
