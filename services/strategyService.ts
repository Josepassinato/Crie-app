import { GoogleGenAI, Type } from "@google/genai";
import { SavedAccount, GeneratedHistoryItem, HolisticStrategyResult, ContentMarketingPost, ProductPostContent, AnalysisResult, CampaignPlan, PerformanceReport, CampaignPerformanceAnalysisResult } from "../types.ts";

const getGoogleAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

const formatHistoryForPrompt = (history: GeneratedHistoryItem[]): string => {
    if (history.length === 0) {
        return "This account has no history yet.";
    }

    // Process most recent 10 items to keep prompt concise
    return history.slice(0, 10).reverse().map(item => {
        switch (item.type) {
            case 'contentPost':
                const contentData = item.data as ContentMarketingPost;
                return `- Generated a content post. Instagram text: "${contentData.platformTexts.instagram.substring(0, 100)}...". Visual was created.`;
            case 'productPost':
                const productData = item.data as ProductPostContent;
                return `- Generated a product post for "${productData.productName}". Post text: "${productData.postText.substring(0, 100)}...". A ${productData.mediaType} was created.`;
            case 'analysis':
                const analysisData = item.data as AnalysisResult;
                return `- Performed a profile analysis. Key findings: Brand Archetype is "${analysisData.brandArchetype}", Audience is "${analysisData.audienceProfile}".`;
            case 'campaignPlan':
                 const campaignData = item.data as CampaignPlan;
                 return `- Created a campaign plan. Objective: "${campaignData.campaignStructure.objective}". Guideline: "${campaignData.creativesAndCopy.guidelines}".`;
            case 'performanceFeedback':
                 // FIX: Correctly access the `performanceSummary` property of the `CampaignPerformanceAnalysisResult` object.
                 const feedbackData = item.data as CampaignPerformanceAnalysisResult;
                 return `- Analyzed ad performance. Feedback: "${feedbackData.performanceSummary.substring(0, 150)}..."`;
            default:
                return '';
        }
    }).filter(line => line).join('\n');
};


export const generateHolisticStrategy = async (account: SavedAccount, language: string): Promise<HolisticStrategyResult> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro'; // Use a more powerful model for strategic reasoning

    const historySummary = formatHistoryForPrompt(account.history);

    const prompt = `
    CRITICAL: Your entire JSON output, including all text values, must be in the following language: ${language}.
    Act as a master digital marketing strategist. Your task is to provide a holistic and unified strategy for a client account based on their profile and a summary of recent activities generated using this same tool.

    **Client Account Information:**
    - Account Name: ${account.name}
    - Account Type: ${account.type === 'content' ? 'Personal Brand / Content Creator' : 'Business / Product'}
    - Profile Details: ${JSON.stringify(account.formData)}

    **Summary of Recent Activities (from oldest to most recent):**
    ${historySummary}

    **Your Task:**
    Based on ALL the information provided, synthesize a cohesive strategic report. Connect the dots between the profile analysis, the creatives generated, the campaign plans, and performance feedback. Identify patterns, strengths, weaknesses, and opportunities.

    Provide your output as a single, valid JSON object with the following structure:
    - "overallDiagnosis": A string with a concise summary of the account's current strategic position.
    - "strategicPillars": An array of 2-3 strings, where each string is a key strategic pillar or theme to focus on (e.g., "Reinforce Brand Authority", "Optimize Conversion Funnel").
    - "actionableRecommendations": An array of 3-5 strings with specific, actionable next steps. These should directly reference the past activities and suggest concrete actions within the app (e.g., "The 'Hero' archetype from the analysis is not reflected in the latest product posts. Generate a new post for '${(account.formData as any).productName || (account.formData as any).profession}' using a more dynamic prompt and the 'Grunge' mask template.").
    - "kpisToTrack": An array of 2-4 strings listing the key performance indicators the user should monitor to evaluate the success of this strategy (e.g., "Engagement Rate on content posts", "CTR on campaigns with the new creative direction").
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
                        overallDiagnosis: { type: Type.STRING },
                        strategicPillars: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actionableRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                        kpisToTrack: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["overallDiagnosis", "strategicPillars", "actionableRecommendations", "kpisToTrack"]
                }
            }
        });
        const result = JSON.parse(response.text);
        return result;
    } catch (error: any) {
        console.error("Error generating holistic strategy:", error);
        throw new Error("strategyApiError");
    }
};

const formatHistoryForPerformanceAnalysis = (history: GeneratedHistoryItem[]): string => {
    if (history.length === 0) {
        return "This account has no history yet.";
    }

    // Focus on items with performance data, from oldest to newest
    return history.slice().reverse().map(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        switch (item.type) {
            case 'analysis':
                const analysisData = item.data as AnalysisResult;
                return `[${date}] Profile Analysis Conducted: Identified brand archetype as "${analysisData.brandArchetype}" and noted audience profile. Performance summary was: "${analysisData.performanceSummary.substring(0, 100)}...".`;
            case 'campaignPlan':
                 const campaignData = item.data as CampaignPlan;
                 return `[${date}] Campaign Planned: Objective was "${campaignData.campaignStructure.objective}".`;
            case 'performanceFeedback':
                 // FIX: Correctly access the `performanceSummary` property of the `CampaignPerformanceAnalysisResult` object.
                 const feedbackData = item.data as CampaignPerformanceAnalysisResult;
                 return `[${date}] Campaign Performance Analyzed: AI feedback was: "${feedbackData.performanceSummary.substring(0, 150)}..."`;
            default:
                return null; // Ignore posts for this specific analysis
        }
    }).filter(line => line).join('\n');
};


export const analyzeAccountPerformance = async (account: SavedAccount, language: string): Promise<PerformanceReport> => {
    const ai = getGoogleAI();
    const model = 'gemini-2.5-pro';

    const historySummary = formatHistoryForPerformanceAnalysis(account.history);

    // Calculate quantitative stats
    const totalPosts = account.history.filter(item => item.type === 'contentPost' || item.type === 'productPost').length;
    const totalCampaigns = account.history.filter(item => item.type === 'campaignPlan').length;
    const totalAnalyses = account.history.filter(item => item.type === 'analysis' || item.type === 'performanceFeedback').length;

    const prompt = `
    CRITICAL: Your entire JSON output, including all text values, must be in the following language: ${language}.
    Act as a senior data analyst specializing in social media growth. Your task is to analyze the historical performance of a client account by interpreting a chronological summary of their activities and analyses.

    **Client Account Information:**
    - Account Name: ${account.name}
    - Account Type: ${account.type}
    - Profile Details: ${JSON.stringify(account.formData)}

    **Quantitative Data for the Period:**
    - Total Posts Created: ${totalPosts}
    - Total Campaigns Planned: ${totalCampaigns}
    - Total Profile/Performance Analyses Conducted: ${totalAnalyses}

    **Chronological History of Activities & Analyses:**
    ${historySummary}

    **Your Task:**
    Synthesize the historical and quantitative data to identify trends and measure progress over time. Do not just repeat the data; interpret it.
    - Start with a "quantitativeSummary" section. In it, provide a "reportOverview" which is a brief text summarizing the quantitative data provided above in a meaningful way for a client.
    - Analyze follower growth and reach trends for the "growthAnalysis" section.
    - Analyze engagement trends for the "engagementTrends" section.
    - Evaluate campaign success for the "campaignEffectiveness" section.
    - Conclude with an overall performance trajectory and one key recommendation in the "strategicSummary".

    Provide your output as a single, valid JSON object with the following structure:
    - "quantitativeSummary": An object with a key "reportOverview" (string).
    - "growthAnalysis": A string analyzing follower growth and reach.
    - "engagementTrends": A string analyzing engagement evolution.
    - "campaignEffectiveness": A string evaluating campaign success.
    - "strategicSummary": A string summarizing the overall trajectory and providing one key recommendation.
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
                        quantitativeSummary: {
                            type: Type.OBJECT,
                            properties: {
                                reportOverview: { type: Type.STRING }
                            },
                            required: ["reportOverview"]
                        },
                        growthAnalysis: { type: Type.STRING },
                        engagementTrends: { type: Type.STRING },
                        campaignEffectiveness: { type: Type.STRING },
                        strategicSummary: { type: Type.STRING },
                    },
                    required: ["quantitativeSummary", "growthAnalysis", "engagementTrends", "campaignEffectiveness", "strategicSummary"]
                }
            }
        });
        const result = JSON.parse(response.text) as PerformanceReport;

        // Add the calculated numbers to the final result object
        result.quantitativeSummary.totalPosts = totalPosts;
        result.quantitativeSummary.totalCampaigns = totalCampaigns;
        result.quantitativeSummary.totalAnalyses = totalAnalyses;

        return result;
    } catch (error: any) {
        console.error("Error analyzing account performance:", error);
        throw new Error("performanceApiError");
    }
};
