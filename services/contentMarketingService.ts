// Fix: Implement Gemini API calls for content marketing post generation.
// Fix: Updated import to use the correct '@google/genai' package.
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ContentMarketingPost, UploadedImage } from "../types";

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
    professionalContext: string,
    postFormat: 'single' | 'carousel',
    carouselSlides: number,
    maskTemplate: string,
    colorPalette: string,
    logoImage: UploadedImage | null,
    postExample1: string,
    postExample2: string,
    postExample3: string
): Promise<ContentMarketingPost> => {
    const ai = getGoogleAI();

    // Create template and color instructions for the prompt
    let templateInstruction = '';
    switch (maskTemplate) {
        case "Moderno com Círculo":
            templateInstruction = 'The composition must prominently feature a geometric circular element or frame, creating a modern and focused aesthetic.';
            break;
        case "Grunge com Pinceladas":
            templateInstruction = 'The style must be artistic and textured, incorporating grunge-style brushstrokes or paint splatters, either as a background or an overlay.';
            break;
        case "Minimalista com Linhas":
            templateInstruction = 'The design should be clean and minimalist, using thin geometric lines to structure the composition and add a sense of elegance.';
            break;
        case "minhaLogo":
            templateInstruction = logoImage 
                ? 'The composition must be designed to elegantly incorporate the provided user logo. Position the logo in a common branding location like the top-left, bottom-right, or a designated header area. The overall design should complement the logo.' 
                : 'The composition should be designed with a clean, designated space (e.g., a corner, a header area) suitable for a logo to be placed.';
            break;
    }

    const colorInstruction = colorPalette 
        ? `Crucially, the image's color scheme must be strictly limited to this palette: ${colorPalette}. Do not introduce other colors.` 
        : '';
        
    const writingStyleInstruction = [postExample1, postExample2, postExample3].some(p => p.trim() !== '')
        ? `
        To match the user's writing style, analyze these examples of their previous posts:
        ${postExample1 ? `Example 1: "${postExample1}"\n` : ''}
        ${postExample2 ? `Example 2: "${postExample2}"\n` : ''}
        ${postExample3 ? `Example 3: "${postExample3}"\n` : ''}
        The generated post texts for Instagram, Facebook, LinkedIn, and TikTok MUST adopt this tone, vocabulary, and structure.
        `
        : '';

    // Step 1: Generate a detailed image prompt and platform-specific texts.
    const isCarousel = postFormat === 'carousel';
    const textGenerationPrompt = `
    Based on the following professional profile, generate a content marketing pack for a ${isCarousel ? `carousel post with ${carouselSlides} slides` : 'single image post'}.
    Profession/Specialty: ${profession}
    Target Audience: ${targetAudience || 'General public'}
    Additional Context: ${professionalContext || 'N/A'}

    ${writingStyleInstruction}

    The pack must contain:
    1. ${isCarousel 
        ? `An array of ${carouselSlides} detailed, visually rich prompts for an AI image generator. Each prompt should describe a connected scene, style, and mood for each slide of the carousel, telling a cohesive story or presenting a sequence of ideas.` 
        : `A single, detailed, visually rich prompt for an AI image generator to create a professional and captivating image representing the profession.`
    }
       - ${templateInstruction ? `Incorporate this specific design constraint into EACH prompt: ${templateInstruction}` : ''}
       - ${colorInstruction ? `Incorporate this specific color constraint into EACH prompt: ${colorInstruction}` : ''}
    2. Customized post texts for Instagram, Facebook, LinkedIn, and TikTok.
        - The texts MUST be adapted for a carousel format, encouraging users to swipe (e.g., "Swipe to see more ->", "Part 1 of ${carouselSlides}:...").
        - Instagram: Visually focused, use relevant hashtags, friendly tone.
        - Facebook: Conversational, can include a link, slightly more detailed than Instagram.
        - LinkedIn: Professional, focused on value and expertise.
        - TikTok: Short, punchy, suggesting a trend or quick tip related to the carousel.
    `;
    
    const textModel = 'gemini-2.5-flash';
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            ...(isCarousel 
                ? { imagePrompts: { type: Type.ARRAY, items: { type: Type.STRING }, description: `An array of exactly ${carouselSlides} prompts for an AI image generator.` } }
                : { imagePrompt: { type: Type.STRING, description: "A single prompt for an AI image generator." } }
            ),
            platformTexts: {
                type: Type.OBJECT,
                properties: {
                    instagram: { type: Type.STRING },
                    facebook: { type: Type.STRING },
                    linkedin: { type: Type.STRING },
                    tiktok: { type: Type.STRING },
                },
                required: ["instagram", "facebook", "linkedin", "tiktok"]
            }
        },
        required: [isCarousel ? "imagePrompts" : "imagePrompt", "platformTexts"]
    };

    const textResponse = await ai.models.generateContent({
        model: textModel,
        contents: textGenerationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });
    
    const textResult = JSON.parse(textResponse.text);
    const { imagePrompt, imagePrompts, platformTexts } = textResult;
    const promptsToGenerate = isCarousel ? imagePrompts : [imagePrompt];

    // Step 2: Generate the image(s) using the created prompt(s).
    const imageUrls: string[] = [];
    const imageModel = 'gemini-2.5-flash-image';

    for (const prompt of promptsToGenerate) {
        const imageParts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [{ text: prompt }];
        if (logoImage && maskTemplate === "minhaLogo") {
            imageParts.push({ 
                inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } 
            });
        }

        const imageResponse = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: imageParts },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });
        
        let imageUrl = '';
        const candidate = imageResponse.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break; 
              }
            }
        }

        if (!imageUrl) {
            throw new Error(`Image generation failed for prompt: "${prompt}"`);
        }
        imageUrls.push(imageUrl);
    }

    if (imageUrls.length === 0) {
        throw new Error("Image generation failed to produce any images.");
    }

    return {
        imageUrls,
        platformTexts,
    };
};
