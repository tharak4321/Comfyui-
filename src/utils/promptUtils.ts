import { MiniMaxH3StructuredPrompt, TimedDialogueLine } from '../types/comfy';

export const DEFAULT_MINIMAX_PROMPT: MiniMaxH3StructuredPrompt = {
  picture1Context: 'Picture 1: A close-up portrait of a woman with reflective obsidian sunglasses and neon cybernetic collar, slight rain dripping on skin.',
  multimodalDescription: 'integrated_multimodal_description: Cinematic handheld camera slowly tracking closer in a dimly lit rainy cyberpunk alley. Atmospheric blue and amber neon reflections.',
  whoSpeaks: 'WHO SPEAKS: Woman in obsidian glasses',
  actions: 'ACTIONS: Slowly raises her hand, adjusts the collar edge, breathes calmly, looks directly past the camera lens.',
  strictLipRule: 'STRICT LIP RULE: Synchronize mouth movement precisely with the spoken words, lips strictly relaxed and closed when not speaking.',
  dialogueLines: [
    {
      id: '1',
      startTime: '00:00',
      endTime: '00:03',
      speaker: 'Woman',
      text: "They traced the mainframe signal, but they won't find the source here.",
    },
    {
      id: '2',
      startTime: '00:03',
      endTime: '00:06',
      speaker: 'Woman',
      text: "Power down the terminal. We're moving now.",
    },
  ],
};

export function formatMiniMaxPrompt(structured: MiniMaxH3StructuredPrompt): string {
  const parts: string[] = [];

  if (structured.picture1Context.trim()) {
    parts.push(structured.picture1Context.trim());
  }

  if (structured.multimodalDescription.trim()) {
    parts.push(structured.multimodalDescription.trim());
  }

  if (structured.whoSpeaks.trim()) {
    parts.push(structured.whoSpeaks.trim());
  }

  if (structured.actions.trim()) {
    parts.push(structured.actions.trim());
  }

  if (structured.strictLipRule.trim()) {
    parts.push(structured.strictLipRule.trim());
  }

  if (structured.dialogueLines.length > 0) {
    const lines = structured.dialogueLines
      .filter((line) => line.text.trim().length > 0)
      .map((line) => `[${line.startTime.trim()} - ${line.endTime.trim()}] ${line.speaker.trim()}: "${line.text.trim()}"`);
    if (lines.length > 0) {
      parts.push(lines.join('\n'));
    }
  }

  return parts.join('\n\n');
}

export function parseRawMiniMaxPrompt(raw: string): MiniMaxH3StructuredPrompt {
  const lines = raw.split('\n');
  const result: MiniMaxH3StructuredPrompt = {
    picture1Context: '',
    multimodalDescription: '',
    whoSpeaks: '',
    actions: '',
    strictLipRule: '',
    dialogueLines: [],
  };

  const dialogueLines: TimedDialogueLine[] = [];
  const otherLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match dialogue: [00:00 - 00:03] Speaker: "text"
    const dialogueMatch = trimmed.match(/^\[([0-9:]+)\s*-\s*([0-9:]+)\]\s*([^:]+):\s*"?([^"]*)"?$/);
    if (dialogueMatch) {
      dialogueLines.push({
        id: Math.random().toString(36).substring(2, 9),
        startTime: dialogueMatch[1].trim(),
        endTime: dialogueMatch[2].trim(),
        speaker: dialogueMatch[3].trim(),
        text: dialogueMatch[4].trim(),
      });
      continue;
    }

    if (trimmed.toLowerCase().startsWith('picture 1:')) {
      result.picture1Context = trimmed;
    } else if (trimmed.toLowerCase().startsWith('integrated_multimodal_description:')) {
      result.multimodalDescription = trimmed;
    } else if (trimmed.toLowerCase().startsWith('who speaks:')) {
      result.whoSpeaks = trimmed;
    } else if (trimmed.toLowerCase().startsWith('actions:')) {
      result.actions = trimmed;
    } else if (trimmed.toLowerCase().startsWith('strict lip rule:')) {
      result.strictLipRule = trimmed;
    } else {
      otherLines.push(trimmed);
    }
  }

  if (dialogueLines.length > 0) {
    result.dialogueLines = dialogueLines;
  }

  // Fallback for fields if missing
  if (!result.picture1Context && otherLines.length > 0) {
    result.picture1Context = otherLines.shift() || '';
  }
  if (!result.multimodalDescription && otherLines.length > 0) {
    result.multimodalDescription = otherLines.join(' ');
  }

  return result;
}

export interface PromptTemplatePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  data: MiniMaxH3StructuredPrompt;
}

export const MINIMAX_TEMPLATES: PromptTemplatePreset[] = [
  {
    id: 'cyberpunk-dialogue',
    name: 'Cyberpunk Alley Dialogue',
    category: 'Sci-Fi / Cinematic',
    description: 'Moody neon aesthetic with precise lip sync and dramatic pacing.',
    data: DEFAULT_MINIMAX_PROMPT,
  },
  {
    id: 'broadcast-reporter',
    name: 'Breaking News Reporter',
    category: 'Broadcast / Realism',
    description: 'Dynamic handheld street reportage with rapid dialogue delivery.',
    data: {
      picture1Context: 'Picture 1: Professional news correspondent wearing a waterproof trench coat holding a broadcast microphone.',
      multimodalDescription: 'integrated_multimodal_description: Live television field report style, subtle wind blowing hair, blurred emergency vehicles with flashing lights in the distant background.',
      whoSpeaks: 'WHO SPEAKS: Field Correspondent',
      actions: 'ACTIONS: Gestures toward the distant skyline, tilts head slightly to hear earpiece, speaks with urgent clarity.',
      strictLipRule: 'STRICT LIP RULE: Synchronize lips strictly with rapid natural human speech cadence. Keep mouth closed when listening to earpiece.',
      dialogueLines: [
        {
          id: '1',
          startTime: '00:00',
          endTime: '00:03',
          speaker: 'Reporter',
          text: 'Authorities have confirmed that the power grid will be restored by midnight.',
        },
        {
          id: '2',
          startTime: '00:03',
          endTime: '00:05',
          speaker: 'Reporter',
          text: 'For now, residents are advised to remain indoors.',
        },
      ],
    },
  },
  {
    id: 'commercial-product',
    name: 'Luxury Brand Commercial',
    category: 'Commercial',
    description: 'High elegance slow motion with smooth cinematic narration.',
    data: {
      picture1Context: 'Picture 1: Elegant luxury model in minimalist studio lighting with brushed titanium jewelry.',
      multimodalDescription: 'integrated_multimodal_description: Super-smooth high-frame-rate studio commercial, buttery depth of field, warm golden hour rim lighting.',
      whoSpeaks: 'WHO SPEAKS: Voiceover Narrator',
      actions: 'ACTIONS: Model turns slowly toward key light, gentle smile without parting lips, soft head turn.',
      strictLipRule: 'STRICT LIP RULE: Subtle subtle lip movements only, model stays poised, mouth resting naturally.',
      dialogueLines: [
        {
          id: '1',
          startTime: '00:00',
          endTime: '00:04',
          speaker: 'Narrator',
          text: 'Timeless precision, crafted for those who define tomorrow.',
        },
      ],
    },
  },
  {
    id: 'fantasy-mage',
    name: 'Fantasy Archmage Incantation',
    category: 'Fantasy / FX',
    description: 'Mystical rune lighting with intense vocal spellcasting.',
    data: {
      picture1Context: 'Picture 1: Elderly sorcerer in embroidered deep indigo velvet robes, glowing runic tattoos across hands.',
      multimodalDescription: 'integrated_multimodal_description: Epic fantasy camera rotating 45 degrees around the sorcerer. Floating embers and swirling magical particles illuminate facial features.',
      whoSpeaks: 'WHO SPEAKS: Sorcerer',
      actions: 'ACTIONS: Raises staff, eyes ignite with blue arcane fire, speaks solemn ancient words with conviction.',
      strictLipRule: 'STRICT LIP RULE: Match mouth movements to low resonant chant cadence.',
      dialogueLines: [
        {
          id: '1',
          startTime: '00:00',
          endTime: '00:03',
          speaker: 'Sorcerer',
          text: 'By the sacred oath of the elders, let the veil be unsealed.',
        },
      ],
    },
  },
];
