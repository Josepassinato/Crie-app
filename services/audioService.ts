import { GoogleGenAI } from "@google/genai";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const transcribeAndEnhancePrompt = async (
    audioBase64: string,
    audioMimeType: string,
    context: string
): Promise<string> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro';

    const promptText = `
    You are an AI assistant specialized in creating high-quality image generation prompts.
    You will be given an audio file containing a user's spoken idea for an image, and some text context.
    Your task is to perform two steps:
    1.  Transcribe the user's idea from the audio recording accurately.
    2.  Based on the transcription, create an enhanced, detailed, and visually rich prompt suitable for an AI image generator like Imagen or DALL-E.

    The text context provided is: "${context || 'No specific context provided.'}". Use this context to better understand the user's intent.

    The final enhanced prompt should be a single paragraph. It must be descriptive, elaborating on the user's core idea by adding imaginative details about the subject, environment, style, lighting, composition, colors, and overall mood to ensure a photorealistic and cinematic high-quality result.

    Your final output MUST be ONLY the enhanced text prompt, and nothing else. Do not include the transcription or any other explanatory text in your response.
    `;

    try {
        const audioPart = {
            inlineData: {
                data: audioBase64,
                mimeType: audioMimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [audioPart, { text: promptText }] },
        });

        return response.text.trim();

    } catch (error: any) {
        console.error("Error in transcribeAndEnhancePrompt:", error);
        throw new Error("audioProcessError");
    }
};