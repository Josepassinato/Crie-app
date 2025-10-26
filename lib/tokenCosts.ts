// Fix: Centralize token costs for AI actions and purchase packages.

/**
 * Estimated API Costs & Pricing Strategy (with 400% markup)
 * 
 * 1. Product Image (gemini-2.5-flash-image): 
 *    - Cost: Complex, depends on input/output size. Estimate ~$0.0025 per image.
 *    - Price: $0.0025 * 4 = $0.01. Let's set 1 token = ~$0.002, so this costs 5 tokens.
 * 
 * 2. Product Video (veo-3.1-fast-generate-preview):
 *    - Cost: ~$0.02 per 5 seconds of generated video.
 *    - Price: $0.02 * 4 = $0.08. This costs 40 tokens. This is high, so let's adjust the base price for UX.
 *    - Adjusted Price for UX: Let's make it more accessible. Let's say 20 tokens.
 * 
 * 3. Content Post (gemini-2.5-flash for text, gemini-2.5-flash-image for image):
 *    - Cost: Text (~$0.0005) + Image (~$0.0025) = ~$0.003.
 *    - Price: $0.003 * 4 = $0.012. This costs ~6 tokens. Let's make it 10 for simplicity and value perception.
 * 
 * 4. Profile Analysis (gemini-2.5-flash with Google Search):
 *    - Cost: Complex, includes search grounding. Estimate ~$0.0075.
 *    - Price: $0.0075 * 4 = $0.03. This costs 15 tokens.
 * 
 * 5. Campaign Plan (gemini-2.5-flash):
 *    - Cost: ~$0.0075 for a large, structured JSON response.
 *    - Price: $0.0075 * 4 = $0.03. This costs 15 tokens.
 *
 * 6. Performance Analysis (gemini-2.5-pro for vision):
 *   - Cost: ~$0.004 per image analysis.
 *   - Price: $0.004 * 4 = $0.016. This costs 8 tokens.
 */

export const TOKEN_COSTS = {
    PRODUCT_IMAGE: 5,
    PRODUCT_VIDEO: 20,
    CONTENT_POST: 10,
    PROFILE_ANALYSIS: 15,
    CAMPAIGN_PLAN: 15,
    PERFORMANCE_ANALYSIS: 8,
};

export const TOKEN_PACKAGES = {
    STARTER: 200,   // R$ 20,00 => R$ 0.10 per token
    PRO: 500,       // R$ 45,00 => R$ 0.09 per token
    BUSINESS: 1200, // R$ 99,00 => R$ 0.0825 per token
};
