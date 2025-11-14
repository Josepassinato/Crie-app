// lib/personaTemplates.ts
import { personaImageDataBase64 } from './personaImages.ts';

export interface PersonaTemplate {
  nameKey: string;
  descKey: string;
  imageUrl: string;
  prompt: string; // Detailed description for the AI
}

export const PERSONA_TEMPLATES: Record<string, PersonaTemplate> = {
  'persona1': {
    nameKey: 'persona1Name',
    descKey: 'persona1Desc',
    imageUrl: personaImageDataBase64.julia,
    prompt: 'A photorealistic image of a young, charismatic female influencer in her early 20s, with a friendly smile and trendy, casual style. She has long, flowing blonde hair and is exuding confidence and approachability. She looks directly at the camera.'
  },
  'persona2': {
    nameKey: 'persona2Name',
    descKey: 'persona2Desc',
    imageUrl: personaImageDataBase64.sofia,
    prompt: 'A photorealistic image of a sophisticated and elegant woman in her late 20s or early 30s. She is dressed in a stylish business-casual outfit, looking confident and inspiring. Her posture is poised and her expression is serene.'
  },
  'persona3': {
    nameKey: 'persona3Name',
    descKey: 'persona3Desc',
    imageUrl: personaImageDataBase64.laura,
    prompt: 'A photorealistic image of an energetic, adventurous woman in her mid-20s. She has a natural, authentic look, maybe with freckles and slightly wind-tousled blonde hair. She is wearing practical but stylish outdoor gear and has a genuine, happy expression.'
  },
  'persona4': {
    nameKey: 'persona4Name',
    descKey: 'persona4Desc',
    imageUrl: personaImageDataBase64.lucas,
    prompt: 'A photorealistic image of a modern, urban man in his mid-20s. He has a creative and stylish look, possibly with well-groomed facial hair or a unique haircut. He is wearing fashionable streetwear and looks thoughtfully towards the camera.'
  },
  'persona5': {
    nameKey: 'persona5Name',
    descKey: 'persona5Desc',
    imageUrl: personaImageDataBase64.rafael,
    prompt: 'A photorealistic image of a professional, trustworthy man in his 30s. He is wearing a sharp, well-fitted suit or smart casual attire. His expression is confident and intelligent, conveying expertise and reliability.'
  },
  'persona6': {
    nameKey: 'persona6Name',
    descKey: 'persona6Desc',
    // FIX: Corrected property access to a now-existing key in personaImageDataBase64.
    imageUrl: personaImageDataBase64.helena,
    prompt: 'A photorealistic image of a creative and expressive female artist in her late 20s, with a thoughtful expression. She has colorful paint splatters on her apron and is holding a paintbrush, standing in a bright, art-filled studio.'
  },
  'persona7': {
    nameKey: 'persona7Name',
    descKey: 'persona7Desc',
    // FIX: Corrected property access to a now-existing key in personaImageDataBase64.
    imageUrl: personaImageDataBase64.beatriz,
    prompt: 'A photorealistic image of a serene woman in her 30s, with a calm and centered demeanor. She is dressed in comfortable yoga attire, sitting in a meditative pose in a tranquil, nature-filled environment like a garden or a room with many plants.'
  },
  'persona8': {
    nameKey: 'persona8Name',
    descKey: 'persona8Desc',
    // FIX: Corrected property access to a now-existing key in personaImageDataBase64.
    imageUrl: personaImageDataBase64.carlos,
    prompt: 'A photorealistic image of a wise and experienced senior man in his late 50s or early 60s, with graying hair and a confident, kind smile. He is dressed in a sharp, elegant suit and is in a modern, professional office setting.'
  },
  'persona9': {
    nameKey: 'persona9Name',
    descKey: 'persona9Desc',
    // FIX: Corrected property access to a now-existing key in personaImageDataBase64.
    imageUrl: personaImageDataBase64.marina,
    prompt: 'A photorealistic image of a modern and loving mother in her mid-30s, multitasking with a warm smile. She is stylishly but comfortably dressed, perhaps holding a tablet in one hand while a young child hugs her leg, in a bright, clean, and cozy home environment.'
  },
  'persona10': {
    nameKey: 'persona10Name',
    descKey: 'persona10Desc',
    // FIX: Corrected property access to a now-existing key in personaImageDataBase64.
    imageUrl: personaImageDataBase64.fernando,
    prompt: 'A photorealistic image of an intelligent and enthusiastic tech geek in his early 30s. He is wearing a t-shirt with a nerdy reference and glasses, surrounded by computer screens with code, and looking excitedly at a new gadget in his hands.'
  }
};
