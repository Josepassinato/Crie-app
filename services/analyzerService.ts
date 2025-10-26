import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeSocialProfile = async (profileUrl: string): Promise<AnalysisResult> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-flash';

    // Fix: Updated prompt to explicitly request a valid JSON object as per the new config.
    const prompt = `
    As a specialist in digital marketing and branding, perform a complete analysis of the following social media profile: ${profileUrl}.
    Use Google Search to find public information, analyze engagement on recent posts, and understand the overall brand positioning.
    
    Provide a strategic report as a single, valid JSON object, and nothing else.
    The JSON object must have the following keys and value types:
    - "performanceSummary": A string summarizing what seems to be working well and what could be improved.
    - "audienceProfile": A string describing the likely target audience based on content and engagement.
    - "brandArchetype": A string identifying the primary brand archetype (e.g., Hero, Sage, Explorer).
    - "strategicRecommendations": An array of 3-5 strings with actionable recommendations.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                // Fix: Per Gemini API guidelines, responseMimeType and responseSchema are not allowed when using the googleSearch tool.
                tools: [{ googleSearch: {} }],
            }
        });
        
        // Fix: The response from a model with googleSearch is not guaranteed to be valid JSON.
        // This logic attempts to extract JSON from a markdown block if present.
        const responseText = response.text.trim();
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : responseText;
        
        const result = JSON.parse(jsonString);
        return result;

    } catch (error: any) {
        console.error("Error analyzing profile:", error);
        throw new Error("A IA não conseguiu analisar o perfil. Verifique se a URL está correta e é um perfil público.");
    }
};
