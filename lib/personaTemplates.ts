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
};
