// Fix: Implement Gemini API calls for product post generation.
import { GoogleGenAI, Modality } from "@google/genai";
import { ProductPostContent, UploadedImage, MediaType, ProductFormData } from "../types";
import { styleTemplates } from '../lib/styleTemplates';

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateNarrationScript = async (
    productName: string,
    productDescription: string,
    marketingVibe: string,
    videoDuration: string,
    language: string
): Promise<string> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-flash';
    const prompt = `
    CRITICAL: Your entire output must be in the following language: ${language}.
    Create a short, punchy, and engaging narration script for a ${videoDuration.replace('s', '')}-second video ad.
    Product: ${productName}
    Description: ${productDescription}
    Vibe: ${marketingVibe}
    The script should be concise, powerful, and perfectly timed for the video's duration.
    Your output must be ONLY the narration text, without any labels like "Narration:" or quotation marks.
    `;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });
    // Fix: Per coding guidelines, access text directly.
    return response.text;
};

export const generateProductPost = async (
    productName: string,
    productDescription: string,
    marketingVibe: string,
    productImage: UploadedImage,
    outputType: MediaType,
    maskTemplate: string,
    colorPalette: string,
    logoImage: UploadedImage | null,
    userSelfie: UploadedImage | null,
    artisticStyle: string,
    videoDuration: ProductFormData['videoDuration'],
    animationStyle: ProductFormData['animationStyle'],
    aspectRatio: string,
    negativePrompt: string,
    narrationScript: string,
    backgroundMusic: string,
    musicDescription: string,
    postExample1: string,
    postExample2: string,
    postExample3: string,
    language: string
): Promise<ProductPostContent> => {
    
    const ai = getGoogleAI();

    // Step 1: Generate post text
    const writingStyleInstruction = [postExample1, postExample2, postExample3].some(p => p.trim() !== '')
        ? `
        To match the user's writing style, analyze these examples of their previous posts:
        ${postExample1 ? `Example 1: "${postExample1}"\n` : ''}
        ${postExample2 ? `Example 2: "${postExample2}"\n` : ''}
        ${postExample3 ? `Example 3: "${postExample3}"\n` : ''}
        The generated post text MUST adopt this tone, vocabulary, and structure.
        `
        : '';

    const postTextPrompt = `
    CRITICAL: Your entire output must be in the following language: ${language}.
    Create a short, catchy social media post for the following product.
    Product Name: ${productName}
    Description: ${productDescription}
    Campaign Vibe: ${marketingVibe}
    ${writingStyleInstruction}
    The post should be exciting and encourage people to check out the product. Include a few relevant hashtags. Don't use markdown formatting.
    `;
    const textModel = 'gemini-2.5-flash';
    const textResponsePromise = ai.models.generateContent({
        model: textModel,
        contents: postTextPrompt,
    });

    let mediaUrl: string;

    // --- Dynamic prompt construction for media ---
    let templateInstruction = '';
    switch (maskTemplate) {
        case "Moderno com Círculo":
            templateInstruction = 'The composition must prominently feature a geometric circular element or frame.';
            break;
        case "Grunge com Pinceladas":
            templateInstruction = 'The style must be artistic and textured, incorporating grunge-style brushstrokes.';
            break;
        case "Minimalista com Linhas":
            templateInstruction = 'The design should be clean and minimalist, using thin geometric lines.';
            break;
        case "minhaLogo":
            templateInstruction = logoImage 
                ? 'The composition must elegantly incorporate the provided user logo, placing it in a common branding location like a corner.' 
                : 'The composition should have a clean space suitable for a logo.';
            break;
    }

    const colorInstruction = colorPalette 
        ? `The image's color scheme must strictly adhere to this palette: ${colorPalette}.` 
        : '';
    
    const selfieInstruction = userSelfie
        ? "CRITICAL: A selfie has been provided. The main person in the final image MUST be the person from this selfie. Integrate their face and likeness realistically and seamlessly into the scene, matching the overall style."
        : "";

    const selectedStylePrompt = styleTemplates[artisticStyle]?.prompt || styleTemplates['Padrão'].prompt;

    const negativePromptInstruction = negativePrompt
        ? `CRITICAL: The final output must NOT contain any of the following elements: ${negativePrompt}.`
        : '';

    // Step 2: Generate media (image or video)
    if (outputType === 'image') {
        const aspectRatioInstruction = `The final image must have a ${aspectRatio} aspect ratio.`;
        const imagePrompt = `Create a stunning marketing image for "${productName}". Use the provided product image as a key element. The overall vibe should be "${marketingVibe}". ${templateInstruction} ${colorInstruction} ${selfieInstruction} ${negativePromptInstruction} ${aspectRatioInstruction} The final image should be dynamic and high-quality, suitable for an ad campaign. Do not include any text in the image. Final style must be: ${selectedStylePrompt}`;
        const imageModel = 'gemini-2.5-flash-image';
        
        const imageParts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [
            { inlineData: { data: productImage.base64, mimeType: productImage.mimeType } },
            { text: imagePrompt }
        ];

        if (logoImage && maskTemplate === "minhaLogo") {
            imageParts.push({ 
                inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } 
            });
        }
        if (userSelfie) {
            imageParts.push({
                inlineData: { data: userSelfie.base64, mimeType: userSelfie.mimeType }
            });
        }
        
        const imageResponse = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: imageParts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = imageResponse.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    mediaUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
        if (!mediaUrl) {
            throw new Error("Product image generation failed.");
        }
    } else { // outputType === 'video'
        let animationStyleInstruction = '';
        switch(animationStyle) {
            case 'dynamic':
                animationStyleInstruction = 'energetic, with fast-paced cuts and eye-catching motion graphics';
                break;
            case 'elegant':
                animationStyleInstruction = 'elegant, with smooth, slow-motion transitions and a sophisticated feel';
                break;
            case 'minimalist':
                animationStyleInstruction = 'minimalist, with subtle movements and a focus on the product against a clean background';
                break;
            case 'cinematic':
                animationStyleInstruction = 'cinematic, with dramatic lighting, epic camera movements, and a short-film feel';
                break;
            default:
                animationStyleInstruction = 'energetic and dynamic';
        }
        
        const videoModel = 'veo-3.1-fast-generate-preview';
        const videoAI = getGoogleAI(); // Re-init client for Veo
        let startFrameImage = {
            base64: productImage.base64,
            mimeType: productImage.mimeType
        };

        // If a selfie is provided, generate a composite start frame first.
        if (userSelfie) {
            const startFramePrompt = `Create a stunning, photorealistic marketing scene for a product named "${productName}". The vibe is "${marketingVibe}". The scene must feature the person from the provided user selfie, seamlessly and realistically integrated. Also incorporate the provided product image into the scene. ${templateInstruction} ${colorInstruction} ${negativePromptInstruction} The final image should be dynamic and high-quality, suitable for a video's first frame. Do not include any text in the image. Final style must be: ${selectedStylePrompt}`;
            
            const imageModel = 'gemini-2.5-flash-image';
            const imageParts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [
                { inlineData: { data: productImage.base64, mimeType: productImage.mimeType } },
                { inlineData: { data: userSelfie.base64, mimeType: userSelfie.mimeType } },
                { text: startFramePrompt }
            ];

            if (logoImage && maskTemplate === "minhaLogo") {
                imageParts.push({ 
                    inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } 
                });
            }
            
            const startFrameResponse = await ai.models.generateContent({
                model: imageModel,
                contents: { parts: imageParts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const candidate = startFrameResponse.candidates?.[0];
            let foundImage = false;
            if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        startFrameImage = {
                            base64: part.inlineData.data,
                            mimeType: part.inlineData.mimeType
                        };
                        foundImage = true;
                        break;
                    }
                }
            }
            if (!foundImage) {
                throw new Error("Failed to generate the initial video frame with the user's selfie.");
            }
        }

        const videoPrompt = `Bring this scene to life. Create a short, ${animationStyleInstruction} video ad for "${productName}". The video should animate the provided starting image with a vibe that is "${marketingVibe}". The final style should be ${selectedStylePrompt}. Make it eye-catching for social media.`;
        
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
            const musicPrompt = musicDescription || `A high-quality, original, instrumental track that perfectly matches the video's content, mood, and the campaign vibe of "${marketingVibe}".`;
            videoConfig.music = { prompt: musicPrompt };
        } else if (backgroundMusic && backgroundMusic !== 'none') {
            const backgroundMusicMap: Record<string, string> = {
                epic: 'Epic Orchestral',
                upbeat: 'Upbeat Pop',
                lofi: 'Chill Lo-fi',
            };
            videoConfig.music = { prompt: backgroundMusicMap[backgroundMusic] };
        }

        let operation = await videoAI.models.generateVideos({
            model: videoModel,
            prompt: videoPrompt,
            image: {
                imageBytes: startFrameImage.base64,
                mimeType: startFrameImage.mimeType,
            },
            config: videoConfig
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await videoAI.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation failed or did not return a video URI.");
        }
        
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            // Fix: Add specific error handling for 400/404 errors which may indicate an API key issue.
            if (videoResponse.status === 404 || videoResponse.status === 400) {
                 throw new Error("Requested entity was not found.");
            }
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        mediaUrl = URL.createObjectURL(videoBlob);
    }
    
    const textResponse = await textResponsePromise;
    const postText = textResponse.text;

    return {
        productName,
        postText,
        mediaUrl,
        mediaType: outputType,
    };
};