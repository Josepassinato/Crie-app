// lib/styleTemplates.ts
export interface StyleTemplate {
  name: string; // The key for translations
  prompt: string;
}

export const styleTemplates: Record<string, StyleTemplate> = {
  'Padrão': {
    name: 'styleDefault',
    prompt: 'photographic, hyper-realistic, cinematic lighting, professional quality.'
  },
  'Vintage': {
    name: 'styleVintage',
    prompt: 'vintage photography style, faded colors, film grain, nostalgic mood, soft focus, retro aesthetic, reminiscent of the 1970s.'
  },
  'Aquarela': {
    name: 'styleWatercolor',
    prompt: 'watercolor painting style, soft edges, vibrant washes of color, delicate brushstrokes, on textured paper, artistic and fluid.'
  },
  'Abstrato': {
    name: 'styleAbstract',
    prompt: 'abstract art style, focus on shapes, forms, colors, and textures over realistic representation. Energetic, non-objective, expressive.'
  },
  'Cyberpunk': {
    name: 'styleCyberpunk',
    prompt: 'cyberpunk style, neon-drenched cityscapes, futuristic technology, high-tech low-life, Blade Runner aesthetic, moody, atmospheric lighting.'
  },
  'Steampunk': {
    name: 'styleSteampunk',
    prompt: 'steampunk style, Victorian-era aesthetics combined with industrial steam-powered machinery. Gears, cogs, copper and brass elements, intricate details.'
  },
  'Fantasia': {
    name: 'styleFantasy',
    prompt: 'epic fantasy art style, magical elements, dramatic lighting, mythical creatures, otherworldly landscapes, detailed and imaginative, high-fantasy aesthetic.'
  },
  'Minimalista Arte': {
    name: 'styleMinimalistArt',
    prompt: 'minimalist art style, clean lines, simple forms, limited color palette, ample negative space, focus on essential elements, serene and uncluttered.'
  }
};
