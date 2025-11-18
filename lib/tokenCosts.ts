// Fix: Centralize token costs for AI actions and purchase packages.

/**
 * Estimated API Costs & Pricing Strategy (with 400% markup)
 * 
 * 1. Product Image (gemini-2.5-flash-image): 
 *    - Cost: Complex, depends on input/output size. Estimate ~$0.0025 per image.
 *    - Price: $0.0025 * 4 = $0.01. Let's set 1 token = ~$0.002, so this costs 5 tokens.
 * 
 * 2. Product Video (veo-3.1-fast-generate-preview):
 *    - New variable pricing model based on duration.
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
 * 
 * 7. Holistic Strategy (gemini-2.5-pro for complexity):
 *   - Cost: Large context window, complex reasoning. Estimate ~$0.01.
 *   - Price: $0.01 * 4 = $0.04. This costs 20 tokens.
 *
 * 8. Account Performance Analysis (gemini-2.5-pro for complexity):
 *   - Cost: Similar to holistic strategy. Estimate ~$0.01.
 *   - Price: $0.01 * 4 = $0.04. This costs 20 tokens.
 * 
 * 9. Creative Suggestions Analysis (gemini-2.5-pro with Google Search):
 *    - Cost: Medium complexity, includes search grounding. Estimate ~$0.005.
 *    - Price: $0.005 * 4 = $0.02. This costs 10 tokens.
 * 
 * 10. Special Video Composition (gemini-2.5-flash-image + veo):
 *     - Cost: Image comp (~$0.003) + Video (~$0.02) = ~$0.023
 *     - Price: $0.023 * 4 = ~$0.092. This costs ~46 tokens. Let's set it to 50.
 *
 * 11. Prompt Enhancement (gemini-2.5-pro):
 *     - Cost: ~$0.001 for a medium complexity text/image reasoning task.
 *     - Price: $0.001 * 4 = $0.004. This costs 2 tokens.
 * 
 * 12. ElevenLabs Audio Generation:
 *     - Cost: ~$0.002 for a short script.
 *     - Price: $0.002 * 4 = $0.008. Let's set it to 5 tokens.
 * 
 * 13. Persona Post (gemini-2.5-flash-image for image, gemini-2.5-flash for text):
 *    - Cost: Image (~$0.0025) + Text (~$0.0005) = ~$0.003
 *    - Price: $0.003 * 4 = $0.012. This costs 6 tokens. Let's set it to 10.
 * 
 * 14. Persona Video (veo-3.1-generate-preview with reference images):
 *    - Cost: Similar to Special Video Composition. ~€0.023
 *    - Price: $0.023 * 4 = ~$0.092. This costs ~46 tokens. Let's set it to 50.
 * 
 * 15. Persona Image Generation (gemini-2.5-flash-image):
 *    - Cost: ~$0.0025 per image.
 *    - Price: $0.0025 * 4 = $0.01. This costs 5 tokens.
 */

export const TOKEN_COSTS = {
    PRODUCT_IMAGE: 5,
    CONTENT_POST: 10,
    PERSONA_POST: 10,
    PERSONA_VIDEO: 50,
    PERSONA_IMAGE_GENERATION: 5,
    PROFILE_ANALYSIS: 15,
    CAMPAIGN_PLAN: 15,
    PERFORMANCE_ANALYSIS: 8,
    STRATEGY_ANALYSIS: 20,
    ACCOUNT_PERFORMANCE_ANALYSIS: 20,
    CREATIVE_SUGGESTIONS_ANALYSIS: 10,
    SPECIAL_VIDEO_COMPOSITION: 50,
    LIVE_CONVERSATION_START: 15, // FIX: Added token cost for initiating a live conversation.
    PROMPT_ENHANCEMENT: 2,
    ELEVENLABS_AUDIO_GENERATION: 5,
};

export const VIDEO_COSTS = {
    '5s': 20,
    '8s': 30,
};

export const TOKEN_PACKAGES = {
    STARTER: 200,      // R$ 20,00 => R$ 0.10 per token
    PRO: 500,          // R$ 45,00 => R$ 0.09 per token
    BUSINESS: 1200,    // R$ 99,00 => R$ 0.0825 per token
    MEGA: 3000,        // R$ 220,00 => R$ 0.073 per token (27% savings)
    ENTERPRISE: 10000, // R$ 650,00 => R$ 0.065 per token (35% savings)
};