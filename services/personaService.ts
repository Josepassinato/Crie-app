// services/personaService.ts
import { GoogleGenAI, Modality } from "@google/genai";
import { PersonaCreatorFormData, PersonaPostContent } from "../types.ts";
import { PersonaTemplate } from "../lib/personaTemplates.ts";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

const generateImage = async (
    ai: GoogleGenAI,
    persona: PersonaTemplate,
    formData: PersonaCreatorFormData,
    language: string
): Promise<string> => {
    if (!formData.productImage) {
        throw new Error("Product image is required for persona generation.");
    }
    if (!formData.scenarioDescription) {
        throw new Error("Scenario description is required for persona generation.");
    }

    const model = 'gemini-2.5-flash-image';

    const scenarioInstruction = formData.scenarioImage
        ? "Use the provided Background Image as the setting for the scene."
        : `The setting is: "${formData.scenarioDescription}".`;

    const prompt = `
    CRITICAL: Generate a single, photorealistic image. The image must be in a 1:1 aspect ratio.
    LANGUAGE: ${language}

    TASK:
    Create a high-quality, professional advertisement photo by compositing multiple images and instructions.

    IMAGE ROLES:
    1.  **Persona Image (First Image):** This is the reference for the character. You MUST use the face and appearance of the person in this image for the final character.
    2.  **Product Image (Second Image):** This is the product to be featured in the scene.
    3.  **Background Image (Third Image, if provided):** This is the background for the scene.

    INSTRUCTIONS:
    1.  **Character:** Create a character that looks exactly like the person in the **Persona Image**.
    2.  **Scenario:** ${scenarioInstruction}
    3.  **Product Integration:** Make the character interact naturally and positively with the **Product Image**. The product should be clearly visible and integrated seamlessly into the scene. For example, the persona could be holding, using, or presenting the product.
    4.  **Consistency:** The lighting on the character and the product must match the scenario's lighting.

    OVERALL VIBE:
    The final image should look like a professional social media advertisement. It must be clean, appealing, and high-resolution. Avoid any text, logos, or watermarks.
    `;

    try {
        const parts: any[] = [];

        // 1. Persona Image
        const personaImageData = persona.imageUrl.split(',')[1];
        parts.push({
            inlineData: {
                data: personaImageData,
                mimeType: 'image/jpeg', // The images in personaImages.ts are JPEGs
            },
        });

        // 2. Product Image
        parts.push({
            inlineData: {
                data: formData.productImage.base64,
                mimeType: formData.productImage.mimeType,
            },
        });

        // 3. Scenario Image (optional)
        if (formData.scenarioImage) {
            parts.push({
                inlineData: {
                    data: formData.scenarioImage.base64,
                    mimeType: formData.scenarioImage.mimeType,
                },
            });
        }

        // 4. The text prompt
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imageGenPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType.startsWith('image/'));
        if (imageGenPart?.inlineData?.data) {
            return imageGenPart.inlineData.data;
        } else {
            throw new Error("Image data was not found in the API response.");
        }
    } catch (error) {
        console.error("Error generating persona image:", error);
        throw error;
    }
};

const generateText = async (
    ai: GoogleGenAI,
    persona: PersonaTemplate,
    formData: PersonaCreatorFormData,
    language: string
): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const prompt = `
    CRITICAL: Your entire output must be a single, raw string of text for a social media post, and nothing else. The text must be in the following language: ${language}.
    
    You are a creative marketing assistant writing in the voice of a specific persona.
    
    PERSONA: ${persona.prompt}. The persona's name is ${persona.nameKey}.

    SCENARIO: The persona is in this setting: "${formData.scenarioDescription}".

    PRODUCT: The persona is promoting a product (the user has uploaded an image of it, but you only need to know its context).

    TASK:
    Write a short, engaging, and authentic social media post (like for Instagram) from the perspective of the persona. The post should sound natural to the persona's style and mention the positive experience they're having with the product in the described scenario. Include 3-5 relevant hashtags.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating persona post text:", error);
        throw error;
    }
};

export const generatePersonaPost = async (
    persona: PersonaTemplate,
    formData: PersonaCreatorFormData,
    language: string
): Promise<PersonaPostContent> => {
    try {
        const ai = getGoogleAI();
        const [imageBase64, postText] = await Promise.all([
            generateImage(ai, persona, formData, language),
            generateText(ai, persona, formData, language),
        ]);

        return {
            personaName: persona.nameKey,
            scenario: formData.scenarioDescription,
            mediaUrl: `data:image/jpeg;base64,${imageBase64}`,
            mediaType: 'image',
            postText,
        };
    } catch (error) {
        console.error("Error in generatePersonaPost:", error);
        throw new Error("personaGenerationError");
    }
};
