import { GoogleGenAI, Type } from "@google/genai";
import { CampaignPlan, OrganicContentPlan, OrganicGrowthForm, TrafficPlanForm, UploadedImage, CampaignPerformanceAnalysisResult } from "../types.ts";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateCampaignPlan = async (form: TrafficPlanForm, language: string): Promise<CampaignPlan> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro';

    const prompt = `
    CRITICAL: Your entire JSON output, including all text values inside it, must be in the following language: ${language}.
    You are a senior traffic manager and digital marketing strategist. Based on the following information, create a comprehensive and actionable campaign plan.

    **Campaign Details:**
    - Product/Service: ${form.productService}
    - Target Audience: ${form.targetAudience}
    - Primary Objective: ${form.objective}
    - Budget: ${form.budget}
    - Duration: ${form.duration}
    - Selected Channels: ${form.channels.join(', ')}

    **Your Task:**
    Generate a structured campaign plan as a JSON object. The plan must be practical, insightful, and tailored to the provided details.

    **JSON Output Structure:**
    - "campaignStructure": { "name": "A catchy campaign name", "objective": "A clear, measurable objective (e.g., 'Increase online sales by 15% in 30 days')", "kpis": "Key Performance Indicators to track (e.g., 'CPA, ROAS, Conversion Rate')" }
    - "audienceDefinition": { "primary": "A detailed description of the primary audience persona", "secondary": "A description of a secondary audience, if applicable" }
    - "creativesAndCopy": { "guidelines": "General guidelines for visuals and text (e.g., 'Use vibrant colors, focus on benefits, use a clear call-to-action')", "postExamples": [ { "platform": "e.g., Instagram", "text": "Example post text with hashtags", "visualIdea": "A description of the image or video for this post" }, ... ] }
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
                        campaignStructure: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                objective: { type: Type.STRING },
                                kpis: { type: Type.STRING },
                            },
                            required: ["name", "objective", "kpis"],
                        },
                        audienceDefinition: {
                            type: Type.OBJECT,
                            properties: {
                                primary: { type: Type.STRING },
                                secondary: { type: Type.STRING },
                            },
                            required: ["primary", "secondary"],
                        },
                        creativesAndCopy: {
                            type: Type.OBJECT,
                            properties: {
                                guidelines: { type: Type.STRING },
                                postExamples: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            platform: { type: Type.STRING },
                                            text: { type: Type.STRING },
                                            visualIdea: { type: Type.STRING },
                                        },
                                        required: ["platform", "text", "visualIdea"],
                                    },
                                },
                            },
                            required: ["guidelines", "postExamples"],
                        },
                    },
                    required: ["campaignStructure", "audienceDefinition", "creativesAndCopy"],
                },
            },
        });
        const result = JSON.parse(response.text);
        return result;
    } catch (error) {
        console.error("Error generating campaign plan:", error);
        throw new Error("trafficPlanError");
    }
};

export const analyzeCampaignPerformance = async (
    adsManagerScreenshot: UploadedImage,
    language: string
): Promise<CampaignPerformanceAnalysisResult> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro'; // Pro for better vision and structured output

    const prompt = `
    CRITICAL: Your entire output must be a single, raw, valid JSON object, and nothing else. All text values within the JSON must be in the following language: ${language}.
    
    You are a senior performance marketing analyst and a highly practical digital marketing consultant. Your task is to analyze the provided screenshot from an ads manager platform (e.g., Meta Ads Manager, Google Ads).

    **Your Analysis Task:**
    1.  **Performance Summary (string):** Extract key metrics, summarize the campaign's performance (what's working/not working), and offer 2-3 specific, actionable recommendations for optimization. This should be a concise overview.
    2.  **Step-by-Step Implementation Guide (string[]):** Based on your performance summary and recommendations, provide a clear, numbered, step-by-step guide for the user to implement these changes manually within their chosen ads platform (e.g., Meta Ads Manager, Google Ads). Focus on *where to go* in the platform and *how to configure* the specific settings (e.g., audience adjustments, creative updates, budget changes). Each step should be a self-contained instruction.

    **JSON Output Specification:**
    {
      "performanceSummary": "A concise summary of campaign performance, including key metrics, what's working/not working, and actionable optimization recommendations.",
      "stepByStepGuide": [
        "Step 1: Go to the Meta Ads Manager and navigate to your campaign.",
        "Step 2: Edit the Ad Set. Under 'Audience', adjust demographics to include X and exclude Y.",
        "Step 3: Update Ad Creatives. For Ad A, change the primary text to Z and update the headline to W."
        // ... more steps based on the analysis
      ]
    }
    `;

    try {
        const imagePart = {
            inlineData: {
                data: adsManagerScreenshot.base64,
                mimeType: adsManagerScreenshot.mimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        performanceSummary: { type: Type.STRING },
                        stepByStepGuide: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["performanceSummary", "stepByStepGuide"],
                },
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error: any) {
        console.error("Error analyzing campaign performance:", error);
        throw new Error("trafficAnalysisImageError");
    }
};

export const generateOrganicContentPlan = async (form: OrganicGrowthForm, language: string): Promise<OrganicContentPlan> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-flash';

    const prompt = `
    CRITICAL: Your entire JSON output, including all text values (titles, keywords, outline points, CTAs), must be in the following language: ${language}.
    As an SEO and Content Marketing expert, create a content plan for organic growth based on the following details.

    - Main Keyword/Theme: ${form.mainKeyword}
    - Target Audience: ${form.targetAudience}
    - Content Format: ${form.contentFormat}

    Your task is to generate a comprehensive plan as a JSON object with the following structure:
    - "optimizedTitles": An array of 3-5 catchy, SEO-optimized titles for the content.
    - "relatedKeywords": An array of 5-7 related keywords and LSI (Latent Semantic Indexing) terms to include in the content.
    - "contentOutline": An array of strings representing a clear, structured outline for the content (e.g., "Introduction: Hook the reader", "Section 1: The Problem", "Section 2: The Solution", "Conclusion").
    - "ctaSuggestions": An array of 2-3 call-to-action suggestions to include at the end of the content.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        optimizedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
                        relatedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        contentOutline: { type: Type.ARRAY, items: { type: Type.STRING } },
                        ctaSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['optimizedTitles', 'relatedKeywords', 'contentOutline', 'ctaSuggestions']
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating organic content plan:", error);
        throw new Error("organicContentPlanError");
    }
};