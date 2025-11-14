import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProductFormData, ContentFormData, MediaType, UploadedImage, CreativeSuggestions } from "../types.ts";

// Helper function to initialize GoogleGenAI
const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Tests if the current API key is valid by making a simple, low-cost API call.
 * @returns A promise that resolves to true if the key is valid, false otherwise.
 */
export const testApiKey = async (): Promise<boolean> => {
    try {
        console.log("Testing API key...");
        const ai = getGoogleAI();
        // Use the cheapest and fastest model for a simple test.
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
        });
        console.log("API key test successful.");
        return true;
    } catch (error: any) {
        console.error("API key test failed:", error);
        // Check for specific authentication-related error messages
        const errorMessage = (error.message || '').toLowerCase();
        if (errorMessage.includes('api key not valid') || errorMessage.includes('permission denied') || errorMessage.includes('authentication failed')) {
            return false;
        }
        // For other errors (e.g., network), we might not want to invalidate the key,
        // but for this simple test, any failure is treated as a validation failure.
        return false;
    }
};


/**
 * Sanitizes a user-provided prompt to make it safer for video generation models,
 * reducing the likelihood of triggering safety policy violations.
 * @param prompt The original user prompt.
 * @returns A promise that resolves to the sanitized prompt.
 */
export const sanitizePromptForVideo = async (prompt: string): Promise<string> => {
    if (!prompt) return '';
    try {
        const ai = getGoogleAI();
        const model = 'gemini-2.5-flash';

        const systemPrompt = `
        CRITICAL: Your entire output must be a single, raw string containing ONLY the rewritten prompt, in the same language as the original user prompt.

        You are a safety guardian for an AI video generation model. Your task is to review the user's video prompt and rewrite it to be completely safe, positive, and family-friendly, ensuring it avoids any content that could violate strict safety policies.

        Safety policies prohibit: Violence, gore, self-harm, hate speech, sexually explicit content, depiction of illegal acts or regulated goods (like weapons or drugs).

        Your rewrite should:
        1. Preserve the user's core creative intent.
        2. Rephrase aggressive, ambiguous, or potentially negative language into positive, descriptive terms. For example, instead of "a man attacks a monster," write "a hero bravely confronts a mythical beast." Instead of "a car crashes," write "a dramatic scene with a damaged car after an incident."
        3. Ensure the description is appropriate for a general audience.

        User's original prompt: "${prompt}"

        Rewrite it safely.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: systemPrompt,
        });

        const sanitized = response.text.trim();
        console.log(`Prompt sanitized. Original: "${prompt}", Sanitized: "${sanitized}"`);
        return sanitized;
    } catch (error) {
        console.error("Error sanitizing video prompt. Falling back to original prompt.", error);
        return prompt; // Fallback to the original prompt if sanitization fails
    }
};


export const generateNarrationScript = async (
    productName: string,
    productDescription: string,
    marketingVibe: string,
    videoDuration: '5s' | '8s',
    language: string,
    audioType: 'narration' | 'dialogue'
): Promise<string> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-flash';

    const scriptTypeInstruction = audioType === 'dialogue'
        ? 'Create a short, engaging dialogue script between two characters that showcases the product. Format it clearly, e.g., "Character 1: [line]", "Character 2: [line]".'
        : 'Create a concise and engaging narration script.';

    const prompt = `
    CRITICAL: Your entire output must be a single, raw string containing ONLY the generated script, and nothing else. The script must be in the following language: ${language}.
    
    You are a scriptwriter for promotional videos. ${scriptTypeInstruction}
    
    Product Name: ${productName}
    Product Description: ${productDescription}
    Marketing Vibe: ${marketingVibe}
    Video Duration: ${videoDuration}

    The script should be compelling, highlight key benefits, and fit within the given video duration. Aim for a professional, enthusiastic, and clear tone.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating narration script:", error);
        throw new Error("narrationScriptApiError");
    }
};

export const generateCreativeSuggestions = async (
    context: {
        productName?: string;
        productDescription?: string;
        marketingVibe?: string;
        profession?: string;
        professionalContext?: string;
        profileUrl?: string;
        benchmarkProfileUrl?: string;
    },
    outputType: MediaType,
    language: string,
): Promise<CreativeSuggestions> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro'; // Pro for better reasoning with diverse context
    
    let description = '';
    if (context.productName) {
        description += `Product Name: ${context.productName}\n`;
    }
    if (context.productDescription) {
        description += `Product Description: ${context.productDescription}\n`;
    }
    if (context.marketingVibe) {
        description += `Marketing Vibe: ${context.marketingVibe}\n`;
    }
    if (context.profession) {
        description += `Profession: ${context.profession}\n`;
    }
    if (context.professionalContext) {
        description += `Professional Context: ${context.professionalContext}\n`;
    }
    if (context.profileUrl) {
        description += `Client Social Profile URL: ${context.profileUrl}\n`;
    }
    if (context.benchmarkProfileUrl) {
        description += `Benchmark Social Profile URL: ${context.benchmarkProfileUrl}\n`;
    }

    const prompt = `
    CRITICAL: Your entire JSON output must be a single, raw, valid JSON object, and nothing else. All text values within the JSON must be in the following language: ${language}.
    
    You are an AI specialized in generating creative suggestions for digital marketing content. Based on the provided client context and desired output type, suggest values for various creative fields. Only suggest fields that are highly relevant to the context and output type, and only if a clear, actionable suggestion can be made. Do not include fields in the JSON if you have no relevant suggestion.

    Client Context:
    ${description}

    Output Type: ${outputType}

    Your task is to provide creative suggestions as a JSON object with the following potential fields:
    - targetAudience (string): Suggested target audience, e.g., "Young urban professionals interested in sustainability."
    - postFormat ('single' | 'carousel'): Suggested post format for image content, e.g., "carousel".
    - carouselSlides (number): Number of slides for a carousel, e.g., 4.
    - artisticStyle (string): Suggested artistic style, e.g., "minimalist art".
    - aspectRatio (string): Suggested aspect ratio, e.g., "1:1".
    - negativePrompt (string): Suggested negative prompt elements, e.g., "blurry, low quality, cartoonish".
    - maskTemplate (string): Suggested mask template, e.g., "Moderno com Círculo".
    - colorPalette (string): Suggested color palette, e.g., "earthy tones with pops of vibrant orange".
    - videoDuration ('5s' | '8s'): Suggested video duration.
    - audioType ('narration' | 'dialogue'): Suggested audio type for video.
    - animationStyle ('dynamic' | 'elegant' | 'minimalist' | 'cinematic'): Suggested animation style for video.
    - backgroundMusic ('none' | 'epic' | 'upbeat' | 'lofi' | 'ai_generated'): Suggested background music type.
    - musicDescription (string): A description for AI-generated music.

    Example JSON output (only including relevant suggestions):
    {
      "targetAudience": "Eco-conscious millennials",
      "artisticStyle": "Aquarela",
      "colorPalette": "Greens and blues with gold accents"
    }

    Consider using Google Search to gather additional insights on the profile URLs provided to inform your suggestions.
    `;

    try {
        const parts: any[] = [{ text: prompt }];

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        // Manually parse JSON from response text
        let jsonString = response.text;
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonString = match[1];
        }

        const result: CreativeSuggestions = JSON.parse(jsonString.trim());
        return result;

    } catch (error) {
        console.error("Error generating creative suggestions:", error);
        throw new Error("creativeSuggestionsApiError");
    }
};

export const enhanceVideoPrompt = async (
    userPrompt: string,
    backgroundImage: UploadedImage | null,
    assetImages: (UploadedImage | null)[],
    language: string
): Promise<string> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro';

    const prompt = `
    CRITICAL: Your entire output must be a single, raw string containing ONLY the enhanced video prompt, and nothing else. The prompt must be in the following language: ${language}.

    You are an expert video director and prompt engineer for an advanced AI video generation model.
    Your task is to take a user's basic idea and a set of images (a background and character/object assets) and write a highly detailed, cinematic, and effective prompt.

    User's basic idea: "${userPrompt}"

    Images provided:
    - 1 background image.
    - ${assetImages.filter(img => img).length} character/object image(s).

    Instructions for your generated prompt:
    1.  **Character Fidelity First:** If any of the provided asset images appear to contain a person, the VERY FIRST part of your generated prompt must be an explicit command to maintain facial fidelity. Use a phrase like: "CRITICAL: The person in the video must have the exact face, hair, and appearance of the person in the reference image."
    2.  **Incorporate All Images:** Your prompt MUST describe how to use all the provided images. Refer to them descriptively (e.g., "Use the city street image as the background," "Place the man in the trench coat on the left sidewalk").
    3.  **Describe the Scene Composition:** Detail where the characters/objects from the asset images should be placed within the background scene.
    4.  **Describe the Action:** What are the characters doing? How are they interacting? Be specific (e.g., "He is looking at his watch with a concerned expression," "They are chatting and laughing").
    5.  **Describe the Atmosphere and Mood:** What is the feeling of the scene? (e.g., "The mood is mysterious and tense," "The atmosphere is warm and joyful").
    6.  **Describe Camera Work:** Include details about camera movement, angle, and shot type (e.g., "A slow dolly zoom towards the characters," "A wide-angle shot showing the entire scene," "Close-up on the character's face").
    7.  **Describe Lighting:** Be specific about the lighting (e.g., "The scene is lit by the soft glow of streetlights," "Golden hour sunlight streams through the window").

    Combine all of this into a single, cohesive paragraph, starting with the fidelity instruction if applicable.
    `;
    
    try {
        const parts: any[] = [{ text: prompt }];

        if (backgroundImage) {
            parts.push({
                inlineData: { data: backgroundImage.base64, mimeType: backgroundImage.mimeType }
            });
        }
        assetImages.forEach(image => {
            if (image) {
                parts.push({
                    inlineData: { data: image.base64, mimeType: image.mimeType }
                });
            }
        });

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing video prompt:", error);
        throw new Error("creativeSuggestionsApiError"); // Reusing an existing error key
    }
};

export const generateImageFromPrompt = async (
    prompt: string
): Promise<string> => {
    try {
        const ai = getGoogleAI();
        const model = 'gemini-2.5-flash-image';

        console.log(`Generating image with prompt: "${prompt}"`);

        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType.startsWith('image/'));

        if (imagePart?.inlineData?.data) {
            console.log("Image generation successful.");
            return imagePart.inlineData.data;
        } else {
            console.error("Image data not found in API response:", response);
            throw new Error("Image data was not found in the API response.");
        }
    } catch (error) {
        console.error("Error generating image from prompt:", error);
        // Let the caller handle the error message key
        throw error;
    }
};