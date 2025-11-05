// Fix: Implement Gemini API calls for content marketing post generation.
// Fix: Updated import to use the correct '@google/genai' package.
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ContentMarketingPost, UploadedImage, MediaType } from "../types";
import { styleTemplates } from '../lib/styleTemplates';

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateContentNarrationScript = async (
    profession: string,
    targetAudience: string,
    professionalContext: string,
    videoDuration: string,
    language: string
): Promise<string> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-flash';
    const prompt = `
    CRITICAL: Your entire output must be in the following language: ${language}.
    Create a short, punchy, and engaging narration script for a ${videoDuration.replace('s', '')}-second video post for a content creator.
    Profession: ${profession}
    Target Audience: ${targetAudience}
    Context: ${professionalContext}
    The script should be concise, powerful, and perfectly timed for the video's duration, designed to capture attention on social media.
    Your output must be ONLY the narration text, without any labels like "Narration:" or quotation marks.
    `;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });
    // Fix: Per coding guidelines, access text directly.
    return response.text;
};


export const generateContentMarketingPost = async (
    profession: string,
    targetAudience: string,
    professionalContext: string,
    outputType: MediaType,
    postFormat: 'single' | 'carousel',
    carouselSlides: number,
    maskTemplate: string,
    colorPalette: string,
    logoImage: UploadedImage | null,
    userSelfie: UploadedImage | null,
    postExample1: string,
    postExample2: string,
    postExample3: string,
    artisticStyle: string,
    aspectRatio: string,
    negativePrompt: string,
    videoDuration: string,
    animationStyle: string,
    narrationScript: string,
    backgroundMusic: string,
    musicDescription: string,
    language: string
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
    
    const selfieInstruction = userSelfie
        ? "CRITICAL: The user has provided a personal selfie. For EACH image prompt you generate, you MUST include the following instruction: 'The main person featured in this image must be the person from the provided user selfie, seamlessly and realistically integrated into the described scene.'"
        : "";

    const selectedStylePrompt = styleTemplates[artisticStyle]?.prompt || styleTemplates['Padrão'].prompt;
    const styleInstruction = `The final visual style for ALL images must adhere to this directive: "${selectedStylePrompt}". Ensure that EACH generated image prompt strongly reflects this artistic style.`;

    const aspectRatioInstruction = `For EACH image prompt you generate, you MUST add the following instruction: 'The final image must have a ${aspectRatio} aspect ratio.'`;
    const negativePromptInstruction = negativePrompt
        ? `For EACH image prompt you generate, you MUST add the following critical instruction: 'The image must NOT contain any of the following elements: ${negativePrompt}.'`
        : '';

    // Step 1: Generate platform-specific texts and, if needed, image prompts.
    const isCarousel = postFormat === 'carousel' && outputType === 'image';
    const textGenerationPrompt = `
    CRITICAL: All generated text content (like post texts for social media) MUST be in the following language: ${language}. The prompts for the AI image generator should remain in English for best results, but should be based on the user's input.

    Based on the following professional profile, generate a content marketing pack for a ${outputType === 'video' ? 'video post' : (isCarousel ? `carousel post with ${carouselSlides} slides` : 'single image post')}.
    Profession/Specialty: ${profession}
    Target Audience: ${targetAudience || 'General public'}
    Additional Context: ${professionalContext || 'N/A'}

    ${writingStyleInstruction}

    The pack must contain:
    1. ${isCarousel 
        ? `An array of ${carouselSlides} detailed, visually rich prompts for an AI image generator. Each prompt should describe a connected scene for each slide of the carousel.` 
        : `A single, detailed, visually rich prompt for an AI image generator to create a professional image. This image will be the base for the final media.`
    }
       - These image prompts should be in English.
       - ${templateInstruction ? `Incorporate this design constraint into EACH prompt: ${templateInstruction}` : ''}
       - ${colorInstruction ? `Incorporate this color constraint into EACH prompt: ${colorInstruction}` : ''}
       - ${selfieInstruction}
       - ${styleInstruction}
       - ${aspectRatioInstruction}
       - ${negativePromptInstruction}
    2. Customized post texts for Instagram, Facebook, LinkedIn, and TikTok, written in ${language}.
        - The texts MUST be adapted for a ${outputType} format. If it's a carousel, encourage swiping. If it's a video, encourage watching.
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

    const textResponsePromise = ai.models.generateContent({
        model: textModel,
        contents: textGenerationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    let mediaUrls: string[] = [];
    
    if (outputType === 'image') {
        const textResponse = await textResponsePromise;
        const textResult = JSON.parse(textResponse.text);
        const { imagePrompt, imagePrompts } = textResult;
        const promptsToGenerate = isCarousel ? imagePrompts : [imagePrompt];

        const imageModel = 'gemini-2.5-flash-image';

        for (const prompt of promptsToGenerate) {
            const imageParts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [{ text: prompt }];
            if (logoImage && maskTemplate === "minhaLogo") {
                imageParts.push({ inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } });
            }
            if (userSelfie) {
                imageParts.push({ inlineData: { data: userSelfie.base64, mimeType: userSelfie.mimeType } });
            }

            const imageResponse = await ai.models.generateContent({
                model: imageModel,
                contents: { parts: imageParts },
                config: { responseModalities: [Modality.IMAGE] }
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
            if (!imageUrl) throw new Error(`Image generation failed for prompt: "${prompt}"`);
            mediaUrls.push(imageUrl);
        }
    } else { // outputType === 'video'
        const textResponse = await textResponsePromise;
        const textResult = JSON.parse(textResponse.text);
        const { imagePrompt } = textResult;
        
        // Generate start frame image
        const imageModel = 'gemini-2.5-flash-image';
        const imageParts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [{ text: imagePrompt }];
        if (logoImage && maskTemplate === "minhaLogo") {
            imageParts.push({ inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } });
        }
        if (userSelfie) {
            imageParts.push({ inlineData: { data: userSelfie.base64, mimeType: userSelfie.mimeType } });
        }
        
        const startFrameResponse = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: imageParts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        let startFrameImage: { base64: string; mimeType: string; } | null = null;
        const candidate = startFrameResponse.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    startFrameImage = { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
                    break;
                }
            }
        }
        if (!startFrameImage) throw new Error("Failed to generate the initial video frame.");

        // Generate video
        let animationStyleInstruction = '';
        switch(animationStyle) {
            case 'dynamic': animationStyleInstruction = 'energetic, with fast-paced cuts and motion graphics'; break;
            case 'elegant': animationStyleInstruction = 'elegant, with smooth, slow-motion transitions'; break;
            case 'minimalist': animationStyleInstruction = 'minimalist, with subtle movements'; break;
            case 'cinematic': animationStyleInstruction = 'cinematic, with dramatic lighting and camera movements'; break;
            default: animationStyleInstruction = 'energetic and dynamic';
        }
        
        let audioInstructions = '';
        if (narrationScript && backgroundMusic && backgroundMusic !== 'none') {
            audioInstructions = "The final video MUST include BOTH the provided narration text AND background music that fits the requested vibe.";
        } else if (narrationScript) {
            audioInstructions = "The final video MUST include the provided narration text.";
        } else if (backgroundMusic && backgroundMusic !== 'none') {
            audioInstructions = "The final video MUST include background music that fits the requested vibe.";
        }
        
        const videoPrompt = `Animate this scene. Create a short, ${animationStyleInstruction} video post for a content creator who is a ${profession}. Final style must be ${selectedStylePrompt}. ${audioInstructions}`;
        
        const videoConfig: any = {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16') ? aspectRatio : '9:16',
            durationInSeconds: parseInt(videoDuration.replace('s', ''), 10),
        };

        if (narrationScript) {
            videoConfig.narration = { text: narrationScript };
        }

        if (backgroundMusic === 'ai_generated') {
             const musicPrompt = musicDescription || 'an inspiring and professional tone';
             videoConfig.music = { prompt: musicPrompt };
        } else if (backgroundMusic && backgroundMusic !== 'none') {
            const backgroundMusicMap: Record<string, string> = { epic: 'Epic Orchestral', upbeat: 'Upbeat Pop', lofi: 'Chill Lo-fi' };
            videoConfig.music = { prompt: backgroundMusicMap[backgroundMusic] };
        }
        
        const videoModel = 'veo-3.1-fast-generate-preview';
        const videoAI = getGoogleAI(); // Re-init client for Veo
        let operation = await videoAI.models.generateVideos({
            model: videoModel,
            prompt: videoPrompt,
            image: { imageBytes: startFrameImage.base64, mimeType: startFrameImage.mimeType },
            config: videoConfig
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await videoAI.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed.");
        
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        // Fix: Add specific error handling for 400/404 errors which may indicate an API key issue.
        if (!videoResponse.ok) {
            if (videoResponse.status === 404 || videoResponse.status === 400) {
                 throw new Error("Requested entity was not found.");
            }
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        mediaUrls.push(videoUrl);
    }
    
    if (mediaUrls.length === 0) {
        throw new Error("Media generation failed to produce any output.");
    }
    
    const final_text_result = JSON.parse((await textResponsePromise).text);

    return {
        mediaUrls,
        mediaType: outputType,
        platformTexts: final_text_result.platformTexts,
    };
};