import { GoogleGenAI, Type } from "@google/genai";
import { CampaignPlan, UploadedImage } from "../types";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateCampaignPlan = async (brief: {
    productService: string;
    targetAudience: string;
    objective: string;
    budget: string;
    platform: string;
    abTestRequest: string;
}): Promise<CampaignPlan> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-flash';
    
    const prompt = `
    Act as a senior digital marketing traffic manager. Based on the following brief, create a comprehensive and actionable advertising campaign plan.

    Brief:
    - Product/Service: ${brief.productService}
    - Target Audience: ${brief.targetAudience}
    - Campaign Objective: ${brief.objective}
    - Budget: ${brief.budget || 'Not specified'}
    - Platform: ${brief.platform}
    - Desired A/B Test: ${brief.abTestRequest || 'Suggest a relevant A/B test.'}

    Generate a detailed plan with the following structure:
    1.  **Target Audience:** A detailed description of the audience to target on the platform.
    2.  **Campaign Structure:** The recommended setup (e.g., campaigns, ad sets, ads).
    3.  **Creatives and Copy:** Guidelines and specific suggestions for ad visuals and text.
    4.  **A/B Test Plan:** A clear hypothesis and implementation plan for the A/B test.
    5.  **Step-by-Step Guide:** A numbered list of simple, clear steps for the user to implement this plan in the platform's Ads Manager.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        targetAudience: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING },
                                details: { type: Type.STRING }
                            },
                             required: ["description", "details"]
                        },
                        campaignStructure: {
                            type: Type.OBJECT,
                            properties: {
                                objective: { type: Type.STRING },
                                setup: { type: Type.STRING }
                            },
                            required: ["objective", "setup"]
                        },
                        creativesAndCopy: {
                            type: Type.OBJECT,
                            properties: {
                                guidelines: { type: Type.STRING },
                                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                             required: ["guidelines", "suggestions"]
                        },
                        abTestPlan: {
                            type: Type.OBJECT,
                            properties: {
                                hypothesis: { type: Type.STRING },
                                implementation: { type: Type.STRING }
                            },
                            required: ["hypothesis", "implementation"]
                        },
                        stepByStepGuide: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                     required: ["targetAudience", "campaignStructure", "creativesAndCopy", "abTestPlan", "stepByStepGuide"]
                }
            }
        });
        const result = JSON.parse(response.text);
        return result;
    } catch (error: any) {
        console.error("Error generating campaign plan:", error);
        throw new Error("A IA não conseguiu gerar o plano de campanha. Tente refinar seu briefing.");
    }
};

export const analyzeCampaignPerformance = async (image: UploadedImage): Promise<string> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro'; // Vision capabilities are part of the main models

    const prompt = `
    As a data-driven traffic manager, analyze this screenshot from an ads manager dashboard.
    1. Identify the key performance indicators (KPIs) visible (e.g., CPC, CTR, ROAS, Amount Spent).
    2. Identify which campaigns or ad sets are performing well and which are underperforming based on common marketing goals.
    3. Provide a short, bulleted list of actionable recommendations for optimization. For example: "- Consider increasing the budget for Campaign A as its ROAS is high. - The creative in Ad Set B has a low CTR; try testing a new image or video."
    Keep the analysis concise and focused on actionable advice.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { data: image.base64, mimeType: image.mimeType } },
                    { text: prompt }
                ]
            },
        });
        return response.text.trim();
    } catch (error: any) {
        console.error("Error analyzing performance:", error);
        throw new Error("A IA não conseguiu analisar a imagem. Verifique se o print está claro e legível.");
    }
};
