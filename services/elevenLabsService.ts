// services/elevenLabsService.ts

const PREDEFINED_VOICES: Record<string, string> = {
    'Rachel': '21m00Tcm4TlvDq8ikWAM',
    'Adam': 'pNInz6obpgDQGcFmaJgB',
    'Antoni': 'ErXwobaYiN019PkySvjV',
    'Arnold': 'VR6AewLTigWG4xSOh_Jz',
    'Bella': 'EXAVITQu4vr4xnSDxMaL',
};

/**
 * Generates an audio file from text using the ElevenLabs API.
 *
 * @param text The text to convert to speech.
 * @param voiceId The ID of the voice to use (can be a predefined name or a custom ID).
 * @param customApiKey Optional user-provided API key.
 * @returns A promise that resolves to a local blob URL of the generated audio.
 */
export const generateElevenLabsAudio = async (
    text: string,
    voiceId: string,
    customApiKey?: string
): Promise<string> => {
    if (!text) {
        throw new Error('Text for audio generation cannot be empty.');
    }

    const apiKey = customApiKey || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error('ElevenLabs API key is not configured.');
    }

    // Resolve voice ID from predefined names if necessary
    const resolvedVoiceId = PREDEFINED_VOICES[voiceId] || voiceId;

    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
                'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2', // High-quality multilingual model
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('ElevenLabs API Error:', errorBody);
            throw new Error(errorBody.detail?.message || 'Failed to generate audio from ElevenLabs.');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return audioUrl;

    } catch (error) {
        console.error('Error in generateElevenLabsAudio:', error);
        throw new Error("elevenLabsApiError");
    }
};