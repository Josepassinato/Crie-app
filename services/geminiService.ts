// Fix: Implement Gemini API calls for product post generation.
import { GoogleGenAI, Modality } from "@google/genai";
import { ProductPostContent, UploadedImage, MediaType } from "../types";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
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
): Promise<ProductPostContent> => {
    
    const ai = getGoogleAI();

    // Step 1: Generate post text
    const postTextPrompt = `
    Create a short, catchy social media post for the following product.
    Product Name: ${productName}
    Description: ${productDescription}
    Campaign Vibe: ${marketingVibe}
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
    
    // Step 2: Generate media (image or video)
    if (outputType === 'image') {
        const imagePrompt = `Create a stunning marketing image for "${productName}". Use the provided product image as the main subject. The overall vibe should be "${marketingVibe}". ${templateInstruction} ${colorInstruction} The final image should be dynamic and high-quality, suitable for an ad campaign. Do not include any text in the image.`;
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
        const videoPrompt = `Create a short, 5-second, energetic video ad for "${productName}". The video should start with the provided image and bring it to life with a vibe that is "${marketingVibe}". ${templateInstruction} ${colorInstruction} Make it eye-catching and dynamic for social media.`;
        
        const videoModel = 'veo-3.1-fast-generate-preview';
        
        // Re-init client for Veo
        const videoAI = getGoogleAI();
        let operation = await videoAI.models.generateVideos({
            model: videoModel,
            prompt: videoPrompt,
            image: {
                imageBytes: productImage.base64,
                mimeType: productImage.mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '1:1'
            }
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
            if (videoResponse.status === 404 || videoResponse.status === 400) {
                 throw new Error("Requested entity was not found.");
            }
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        mediaUrl = URL.createObjectURL(videoBlob);
    }
    
    const textResponse = await textResponsePromise;
    const postText = textResponse.text.trim();

    return {
        productName,
        postText,
        mediaUrl,
        mediaType: outputType,
    };
};