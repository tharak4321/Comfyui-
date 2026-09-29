import { MiniMaxNodeMapping } from '../types/comfy';

export const DEFAULT_MINIMAX_NODE_MAPPING: MiniMaxNodeMapping = {
  promptNodeId: '2',
  promptInputKey: 'text',
  imageNodeId: '1',
  imageInputKey: 'image',
  seedNodeId: '3',
  seedInputKey: 'seed',
  durationNodeId: '6',
  fpsNodeId: '8',
  outputNodeId: '8',
};

export const BUILTIN_WORKFLOWS = {
  minimaxH3: {
    name: 'MiniMax H3 Video',
    description: 'MiniMax Hailuo H3 high-fidelity video generation workflow with multimodal prompt & picture reference.',
    mapping: DEFAULT_MINIMAX_NODE_MAPPING,
    json: {
      '1': {
        class_type: 'LoadImage',
        inputs: {
          image: 'input_reference.png',
          upload: 'image',
        },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Multimodal Video Prompt (MiniMax H3)' },
        inputs: {
          text: '',
          clip: ['4', 1],
        },
      },
      '3': {
        class_type: 'KSampler',
        _meta: { title: 'MiniMax H3 Sampler' },
        inputs: {
          seed: 42,
          steps: 25,
          cfg: 6.5,
          sampler_name: 'euler_ancestral',
          scheduler: 'normal',
          denoise: 1.0,
          model: ['4', 0],
          positive: ['2', 0],
          negative: ['5', 0],
          latent_image: ['6', 0],
        },
      },
      '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: 'minimax_h3_video.safetensors',
        },
      },
      '5': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Negative Video Prompt' },
        inputs: {
          text: 'blurry, distorted face, erratic motion, flickering artifacts, out of sync lip movement, extra limbs',
          clip: ['4', 1],
        },
      },
      '6': {
        class_type: 'EmptyLatentImage',
        _meta: { title: 'Video Resolution & Duration Latent' },
        inputs: {
          width: 720,
          height: 1280,
          batch_size: 97, // ~4-5 seconds at 24fps
        },
      },
      '7': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['3', 0],
          vae: ['4', 2],
        },
      },
      '8': {
        class_type: 'VHS_VideoCombine',
        _meta: { title: 'Save Video Output' },
        inputs: {
          images: ['7', 0],
          frame_rate: 24,
          loop_count: 0,
          filename_prefix: 'ComfyRemote_MiniMaxH3',
          format: 'video/h264-mp4',
          pix_fmt: 'yuv420p',
          crf: 19,
          save_output: true,
        },
      },
    },
  },

  qwenImageEdit: {
    name: 'Qwen Image Edit',
    description: 'Qwen visual language instructed image editing with reference photo conditioning.',
    json: {
      '1': {
        class_type: 'LoadImage',
        inputs: {
          image: 'qwen_source.png',
          upload: 'image',
        },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Instruction / Positive Prompt' },
        inputs: {
          text: '',
          clip: ['4', 1],
        },
      },
      '3': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Negative Prompt' },
        inputs: {
          text: 'blurry, bad anatomy, artifacts, low resolution, bad hands',
          clip: ['4', 1],
        },
      },
      '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: 'qwen_image_edit.safetensors',
        },
      },
      '5': {
        class_type: 'VAEEncode',
        inputs: {
          pixels: ['1', 0],
          vae: ['4', 2],
        },
      },
      '6': {
        class_type: 'KSampler',
        inputs: {
          seed: 123456,
          steps: 28,
          cfg: 7.0,
          sampler_name: 'dpmpp_2m',
          scheduler: 'karras',
          denoise: 0.85,
          model: ['4', 0],
          positive: ['2', 0],
          negative: ['3', 0],
          latent_image: ['5', 0],
        },
      },
      '7': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['6', 0],
          vae: ['4', 2],
        },
      },
      '8': {
        class_type: 'SaveImage',
        inputs: {
          images: ['7', 0],
          filename_prefix: 'ComfyRemote_QwenEdit',
        },
      },
    },
  },

  krea2: {
    name: 'Krea 2',
    description: 'Krea 2 aesthetic generation workflow optimized for photorealism and high dynamic range.',
    json: {
      '1': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Positive Prompt' },
        inputs: {
          text: '',
          clip: ['3', 1],
        },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Negative Prompt' },
        inputs: {
          text: 'ugly, deformed, disfigured, poor details, bad quality, grainy, oversaturated',
          clip: ['3', 1],
        },
      },
      '3': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: 'krea_2_photoreal.safetensors',
        },
      },
      '4': {
        class_type: 'EmptyLatentImage',
        inputs: {
          width: 1024,
          height: 1024,
          batch_size: 1,
        },
      },
      '5': {
        class_type: 'KSampler',
        inputs: {
          seed: 9876543,
          steps: 30,
          cfg: 6.5,
          sampler_name: 'euler',
          scheduler: 'exponential',
          denoise: 1.0,
          model: ['3', 0],
          positive: ['1', 0],
          negative: ['2', 0],
          latent_image: ['4', 0],
        },
      },
      '6': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['5', 0],
          vae: ['3', 2],
        },
      },
      '7': {
        class_type: 'SaveImage',
        inputs: {
          images: ['6', 0],
          filename_prefix: 'ComfyRemote_Krea2',
        },
      },
    },
  },
};
