import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, UploadedImage } from "../types.ts";

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
    CRITICAL: Your entire output must be a single, raw, valid JSON object, and nothing else. The text content within the JSON must be in the following language: ${language}.
    
    You are an elite digital marketing strategist. Your task is to perform a deep, holistic analysis of a social media profile by synthesizing information from three distinct data sources. Your analysis must be data-driven and lead to actionable insights.

    **Provided Data Sources:**
    1.  **Profile URL:** ${profileUrl} (Use Google Search to analyze public content, bio, and recent activity).
    2.  **Feed Screenshots:** ${feedImages.length} image(s) are provided (Analyze for visual identity, branding, content themes, and aesthetic quality).
    3.  **Analytics Screenshot:** ${analyticsImage ? '1 image is' : 'No image is'} provided (If available, extract metrics like engagement, reach, and audience demographics to ground your analysis in real data).

    **Your Analysis Process:**
    1.  **Synthesize, Don't Just List:** Your primary goal is to connect the dots. For example, if the analytics show high engagement from women 25-34, but the feed visuals look like they target teenagers, you MUST point out this strategic mismatch in your recommendations.
    2.  **Data-Driven Insights:** Base your 'performanceSummary' and 'audienceProfile' directly on the provided analytics image if available. If not, infer from the public data found via the URL and feed images, but state that you are making an inference.
    3.  **Actionable Recommendations:** Each recommendation must be concrete and directly linked to a specific weakness or opportunity you identified.

    **JSON Output Specification:**
    Return a single, valid JSON object with the following structure:
    {
      "performanceSummary": "A data-driven summary of what's working (e.g., 'High engagement on Reels, indicating video content is effective') and what's not (e.g., 'Low reach on static posts, possibly due to poor hashtag strategy').",
      "audienceProfile": "A detailed description of the audience, synthesized from analytics data and content style. Mention demographics, interests, and potential psychographics.",
      "brandArchetype": "Identify the primary brand archetype (e.g., The Sage, The Jester, The Hero) and briefly justify why based on the visual and textual tone.",
      "strategicRecommendations": [
        "A specific, actionable recommendation. For example: 'The analytics show a 70% female audience, but the color palette is very masculine. Recommendation: Test a new color palette incorporating softer tones on the next 3 posts to improve audience resonance.'",
        "Another specific, actionable recommendation.",
        "A third specific, actionable recommendation."
      ]
    }
    `;

    try {
        const parts: any[] = [{ text: prompt }];

        feedImages.forEach(image => {
            parts.push({
                inlineData: { data: image.base64, mimeType: image.mimeType }
            });
        });

        if (analyticsImage) {
            parts.push({
                inlineData: { data: analyticsImage.base64, mimeType: analyticsImage.mimeType }
            });
        }
        
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonString = response.text;
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonString = match[1];
        }

        const result: AnalysisResult = JSON.parse(jsonString.trim());
        return result;

    } catch (error: any) {
        console.error("Error analyzing social profile:", error);
        throw new Error("analyzerApiError");
    }
};