import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, UploadedImage } from "../types";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeSocialProfile = async (
    profileUrl: string,
    feedImages: UploadedImage[],
    analyticsImage: UploadedImage | null,
    language: string
): Promise<AnalysisResult> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro'; // Upgraded to Pro for better multimodal reasoning

    const prompt = `
    CRITICAL: Your entire output (the final JSON object) must be in the following language: ${language}.
    As a specialist in digital marketing and branding, perform a complete analysis of the following social media profile using ALL the provided data.

    **Data Sources:**
    1.  **Profile URL (for public data and context via Google Search):** ${profileUrl}
    2.  **Feed Screenshots (for visual identity, content style, and tone):** I have provided ${feedImages.length} image(s) of the user's feed.
    3.  **Analytics Screenshot (for performance and audience data):** I have provided ${analyticsImage ? 1 : 0} screenshot(s) of the user's analytics dashboard (e.g., Meta Business Suite).

    **Analysis Task:**
    Synthesize information from ALL THREE sources to create a deeply insightful and accurate strategic report.
    - Use Google Search on the URL to understand public positioning and recent posts.
    - Analyze the Feed Screenshots to understand the visual aesthetic, color palette, post formats, and the "vibe" of the content.
    - Analyze the Analytics Screenshot to extract key metrics, audience demographics, and performance data. This is crucial for data-driven recommendations.
    - Connect the findings. For example, if the analytics show high engagement from women aged 25-34, but the feed visuals seem to target teenagers, point out this mismatch.

    Provide the final report as a single, valid JSON object inside a markdown block, and nothing else.
    The JSON object must have the following keys and value types:
    - "performanceSummary": A string summarizing what's working and what could be improved, using data from the analytics screenshot and public engagement.
    - "audienceProfile": A string describing the target audience, combining data from the analytics screenshot with observations from the content.
    - "brandArchetype": A string identifying the primary brand archetype (e.g., Hero, Sage, Explorer) based on the visual and textual content.
    - "strategicRecommendations": An array of 3-5 strings with actionable recommendations that integrate all findings.
    `;

    try {
        const parts: any[] = [{ text: prompt }];

        feedImages.forEach(image => {
            parts.push({
                inlineData: { data: image.base64, mimeType: image.mimeType }
            });
        });

        if (analyticsImage) {
            // Fix: Corrected typo `base6` to `base64`.
            parts.push({
                inlineData: { data: analyticsImage.base64, mimeType: analyticsImage.mimeType }
            });
        }
        
        // Fix: Completed the function by adding the API call and result processing.
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                // Use Google Search for the URL as requested in the prompt
                tools: [{ googleSearch: {} }],
            },
        });

        // The model is instructed to return a JSON object inside a markdown block.
        // We need to robustly extract it.
        let jsonString = response.text;
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonString = match[1];
        }

        const result: AnalysisResult = JSON.parse(jsonString.trim());
        return result;

    } catch (error: any) {
        console.error("Error analyzing social profile:", error);
        // Throw a generic error key that can be translated by the UI
        throw new Error("analyzerApiError");
    }
};
