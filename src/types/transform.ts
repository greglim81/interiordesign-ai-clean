export type StylePreset = 'modern' | 'rustic' | 'minimalist' | 'luxury' | 'scandinavian' | 'industrial';

export interface StyleConfig {
  prompt: string;
  negative_prompt: string;
  guidance_scale: number;
  prompt_strength: number;
}

export const STYLE_PRESETS: Record<StylePreset, StyleConfig> = {
  modern: {
    prompt: "A contemporary living space with clean lines, minimalist furniture, and a neutral color palette. Modern art pieces adorn the walls, and large windows provide natural light. The space features sleek, high-end appliances and smart home technology.",
    negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, upholstered walls, fabric walls, plush walls, mirror, mirrored, functional, realistic, traditional, vintage, rustic",
    guidance_scale: 15,
    prompt_strength: 0.8
  },
  rustic: {
    prompt: "A cozy rustic interior with exposed wooden beams, vintage furniture, and warm lighting. Natural materials like stone and wood dominate the space, creating a warm and inviting atmosphere. Antique pieces and handmade decor add character.",
    negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, modern, minimalist, industrial, sleek",
    guidance_scale: 15,
    prompt_strength: 0.8
  },
  minimalist: {
    prompt: "A minimalist space with essential furniture pieces, clean lines, and a monochromatic color scheme. The design emphasizes functionality and simplicity, with carefully selected decor items and ample negative space.",
    negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, cluttered, busy, ornate, decorative",
    guidance_scale: 15,
    prompt_strength: 0.8
  },
  luxury: {
    prompt: "An opulent interior featuring high-end finishes, premium materials, and sophisticated design elements. Crystal chandeliers, marble surfaces, and designer furniture create an atmosphere of elegance and luxury.",
    negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, cheap, basic, simple, plain",
    guidance_scale: 15,
    prompt_strength: 0.8
  },
  scandinavian: {
    prompt: "A bright and airy Scandinavian-inspired space with light wood floors, white walls, and functional furniture. Natural light floods the room, and hygge elements like soft textiles and plants create a cozy atmosphere.",
    negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, dark, heavy, ornate, cluttered",
    guidance_scale: 15,
    prompt_strength: 0.8
  },
  industrial: {
    prompt: "An industrial-style space featuring exposed brick walls, metal fixtures, and raw materials. The design incorporates vintage machinery elements, concrete floors, and a mix of metal and wood furniture.",
    negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, soft, delicate, ornate, traditional",
    guidance_scale: 15,
    prompt_strength: 0.8
  }
};

export interface TransformOptions {
  style: StylePreset;
  customPrompt?: string;
  customNegativePrompt?: string;
  guidanceScale?: number;
  promptStrength?: number;
  numInferenceSteps?: number;
}

export interface TransformProgress {
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  progress: number;
  message: string;
} 