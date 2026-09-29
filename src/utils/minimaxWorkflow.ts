/**
 * MiniMax H3 Real Workflow Import, Validation & Injection Engine
 * 
 * Strict rules:
 * - Never fabricate model names or replacement workflows.
 * - Require real ComfyUI API format JSON.
 * - Deep clone before modifying; never mutate the stored base workflow.
 * - Map strictly:
 *   * Prompt node 138 -> input 'value'
 *   * Reference image node 137 -> input 'image'
 *   * Seed node 142 -> input 'seed'
 *   * Duration node 132 -> input 'value'
 *   * Resolution node 115 -> inputs 'aspect_ratio' and 'megapixels'
 *   * FPS nodes 149 and 146 -> inspect actual keys
 *   * Video output node 145 -> preserve required 'pingpong' input
 */

export interface MiniMaxNodeInspection {
  id: string;
  classType: string;
  title?: string;
  inputs: Record<string, any>;
}

export interface MiniMaxWorkflowSummary {
  totalNodes: number;
  node138Prompt?: MiniMaxNodeInspection;
  node137Image?: MiniMaxNodeInspection;
  node142Seed?: MiniMaxNodeInspection;
  node132Duration?: MiniMaxNodeInspection;
  node115Resolution?: MiniMaxNodeInspection;
  node149Fps?: MiniMaxNodeInspection;
  node146Fps?: MiniMaxNodeInspection;
  node145Output?: MiniMaxNodeInspection;
  modelCheckpointsFound: string[];
}

export interface MiniMaxValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary?: MiniMaxWorkflowSummary;
}

// Known fake names that must NEVER be present
const FORBIDDEN_FAKE_MODEL_NAMES = [
  'minimax_h3_video.safetensors',
  'fake_minimax',
  'placeholder_model',
];

/**
 * Validates that an imported object is in genuine ComfyUI API format.
 * ComfyUI API format is a dictionary of { [nodeId: string]: { class_type: string, inputs: Record<string, any> } }
 */
export function validateMiniMaxH3Workflow(
  workflowObj: unknown
): MiniMaxValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!workflowObj || typeof workflowObj !== 'object' || Array.isArray(workflowObj)) {
    return {
      isValid: false,
      errors: ['The workflow must be a valid JSON object.'],
      warnings: [],
    };
  }

  const raw = workflowObj as Record<string, any>;

  // Check if user exported ComfyUI Web GUI format instead of API format
  if (Array.isArray(raw.nodes) && Array.isArray(raw.links)) {
    return {
      isValid: false,
      errors: [
        'Detected ComfyUI Web GUI format ({ "nodes": [...], "links": [...] }) instead of API format.',
        'To export in API format in ComfyUI: Click the gear icon (Settings) -> Enable "Enable Dev mode Options" -> Click "Save (API Format)" in the main menu.',
      ],
      warnings: [],
    };
  }

  const nodeIds = Object.keys(raw);
  if (nodeIds.length === 0) {
    return {
      isValid: false,
      errors: ['The workflow JSON is empty (0 nodes found).'],
      warnings: [],
    };
  }

  // Validate general API format structure
  for (const id of nodeIds) {
    const node = raw[id];
    if (!node || typeof node !== 'object') {
      errors.push(`Node '${id}' is not a valid node object.`);
      continue;
    }
    if (typeof node.class_type !== 'string' || !node.class_type.trim()) {
      errors.push(`Node '${id}' is missing required 'class_type' string.`);
    }
    if (!node.inputs || typeof node.inputs !== 'object' || Array.isArray(node.inputs)) {
      errors.push(`Node '${id}' is missing required 'inputs' dictionary.`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Collect model checkpoints and verify no fabricated filenames
  const modelCheckpointsFound: string[] = [];
  for (const id of nodeIds) {
    const node = raw[id];
    for (const [key, val] of Object.entries(node.inputs || {})) {
      if (typeof val === 'string' && (val.endsWith('.safetensors') || val.endsWith('.ckpt') || val.endsWith('.pt') || val.endsWith('.bin'))) {
        modelCheckpointsFound.push(`${id}.${key}: ${val}`);
        for (const fake of FORBIDDEN_FAKE_MODEL_NAMES) {
          if (val.toLowerCase().includes(fake.toLowerCase())) {
            errors.push(`Node '${id}' input '${key}' contains a fabricated model name: '${val}'. Real checkpoint required.`);
          }
        }
      }
    }
  }

  // Specific inspection of required MiniMax H3 nodes:
  // Node 138: Prompt node (input 'value')
  const node138 = raw['138'];
  if (!node138) {
    errors.push("Missing required prompt node '138'. MiniMax H3 workflow must contain node '138'.");
  } else if (!node138.inputs || typeof node138.inputs !== 'object') {
    errors.push("Prompt node '138' has an invalid or missing 'inputs' object.");
  } else if (!('value' in node138.inputs)) {
    errors.push("Prompt node '138' is missing the required input 'value'.");
  }

  // Node 137: Reference image node (input 'image')
  const node137 = raw['137'];
  if (!node137) {
    errors.push("Missing required reference image node '137'. MiniMax H3 workflow must contain node '137'.");
  } else if (!node137.inputs || typeof node137.inputs !== 'object') {
    errors.push("Reference image node '137' has an invalid or missing 'inputs' object.");
  } else if (!('image' in node137.inputs)) {
    errors.push("Reference image node '137' is missing the required input 'image'.");
  }

  // Node 142: Seed node (input 'seed')
  const node142 = raw['142'];
  if (!node142) {
    errors.push("Missing required seed node '142'. MiniMax H3 workflow must contain node '142'.");
  } else if (!node142.inputs || typeof node142.inputs !== 'object') {
    errors.push("Seed node '142' has an invalid or missing 'inputs' object.");
  } else if (!('seed' in node142.inputs)) {
    errors.push("Seed node '142' is missing the required input 'seed'.");
  }

  // Node 132: Duration node (input 'value')
  const node132 = raw['132'];
  if (!node132) {
    errors.push("Missing required duration node '132'. MiniMax H3 workflow must contain node '132'.");
  } else if (!node132.inputs || typeof node132.inputs !== 'object') {
    errors.push("Duration node '132' has an invalid or missing 'inputs' object.");
  } else if (!('value' in node132.inputs)) {
    errors.push("Duration node '132' is missing the required input 'value'.");
  }

  // Node 115: Resolution node (inputs 'aspect_ratio' and 'megapixels')
  const node115 = raw['115'];
  if (!node115) {
    errors.push("Missing required resolution node '115'. MiniMax H3 workflow must contain node '115'.");
  } else if (!node115.inputs || typeof node115.inputs !== 'object') {
    errors.push("Resolution node '115' has an invalid or missing 'inputs' object.");
  } else {
    if (!('aspect_ratio' in node115.inputs)) {
      errors.push("Resolution node '115' is missing required input 'aspect_ratio'.");
    }
    if (!('megapixels' in node115.inputs)) {
      errors.push("Resolution node '115' is missing required input 'megapixels'.");
    }
  }

  // Node 149 and Node 146: FPS nodes
  const node149 = raw['149'];
  const node146 = raw['146'];
  if (!node149 && !node146) {
    errors.push("Missing FPS nodes: at least one of node '149' or node '146' must exist in the workflow.");
  } else {
    if (node149 && (!node149.inputs || typeof node149.inputs !== 'object')) {
      errors.push("FPS node '149' has invalid or missing 'inputs' object.");
    }
    if (node146 && (!node146.inputs || typeof node146.inputs !== 'object')) {
      errors.push("FPS node '146' has invalid or missing 'inputs' object.");
    }
  }

  // Node 145: Video output node (preserve required pingpong input)
  const node145 = raw['145'];
  if (!node145) {
    errors.push("Missing required video output node '145'. MiniMax H3 workflow must contain node '145'.");
  } else if (!node145.inputs || typeof node145.inputs !== 'object') {
    errors.push("Video output node '145' has an invalid or missing 'inputs' object.");
  } else if (!('pingpong' in node145.inputs)) {
    warnings.push("Video output node '145' does not have a 'pingpong' input currently set. Default false will be preserved.");
  }

  const summary: MiniMaxWorkflowSummary = {
    totalNodes: nodeIds.length,
    node138Prompt: node138 ? { id: '138', classType: node138.class_type, title: node138._meta?.title, inputs: node138.inputs } : undefined,
    node137Image: node137 ? { id: '137', classType: node137.class_type, title: node137._meta?.title, inputs: node137.inputs } : undefined,
    node142Seed: node142 ? { id: '142', classType: node142.class_type, title: node142._meta?.title, inputs: node142.inputs } : undefined,
    node132Duration: node132 ? { id: '132', classType: node132.class_type, title: node132._meta?.title, inputs: node132.inputs } : undefined,
    node115Resolution: node115 ? { id: '115', classType: node115.class_type, title: node115._meta?.title, inputs: node115.inputs } : undefined,
    node149Fps: node149 ? { id: '149', classType: node149.class_type, title: node149._meta?.title, inputs: node149.inputs } : undefined,
    node146Fps: node146 ? { id: '146', classType: node146.class_type, title: node146._meta?.title, inputs: node146.inputs } : undefined,
    node145Output: node145 ? { id: '145', classType: node145.class_type, title: node145._meta?.title, inputs: node145.inputs } : undefined,
    modelCheckpointsFound,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

export interface PrepareMiniMaxExecutionOptions {
  baseWorkflow: Record<string, any>;
  promptText: string;
  uploadedImageName?: string | null;
  seed: number;
  durationSeconds: number;
  aspectRatio: string; // e.g. "9:16", "16:9", "1:1", etc.
  megapixels?: number | string;
  fps: number;
}

/**
 * Deep-clones the base workflow, verifies every node and input exists,
 * and updates strictly only the intended inputs while preserving every
 * link, other input, and metadata intact.
 * 
 * Never mutates the base workflow.
 */
export function prepareMiniMaxH3ExecutionPayload(
  options: PrepareMiniMaxExecutionOptions
): { payload: Record<string, any>; errors: string[] } {
  const {
    baseWorkflow,
    promptText,
    uploadedImageName,
    seed,
    durationSeconds,
    aspectRatio,
    megapixels,
    fps,
  } = options;

  const errors: string[] = [];

  // Deep clone to guarantee original is never mutated
  const cloned: Record<string, any> = JSON.parse(JSON.stringify(baseWorkflow));

  // 1. Confirm and set Prompt Node 138 -> input 'value'
  const node138 = cloned['138'];
  if (!node138 || !node138.inputs) {
    errors.push("Cannot set prompt: Node '138' or its 'inputs' object does not exist in the workflow.");
  } else {
    // Confirm input 'value' exists before setting
    if (!('value' in node138.inputs)) {
      errors.push("Cannot set prompt: Node '138' does not have an input named 'value'.");
    } else {
      node138.inputs.value = promptText;
    }
  }

  // 2. Confirm and set Reference Image Node 137 -> input 'image'
  const node137 = cloned['137'];
  if (!node137 || !node137.inputs) {
    errors.push("Cannot set reference image: Node '137' or its 'inputs' object does not exist in the workflow.");
  } else {
    if (!('image' in node137.inputs)) {
      errors.push("Cannot set reference image: Node '137' does not have an input named 'image'.");
    } else if (uploadedImageName) {
      node137.inputs.image = uploadedImageName;
    }
  }

  // 3. Confirm and set Seed Node 142 -> input 'seed'
  const node142 = cloned['142'];
  if (!node142 || !node142.inputs) {
    errors.push("Cannot set seed: Node '142' or its 'inputs' object does not exist in the workflow.");
  } else {
    if (!('seed' in node142.inputs)) {
      errors.push("Cannot set seed: Node '142' does not have an input named 'seed'.");
    } else {
      node142.inputs.seed = Math.floor(Math.abs(seed));
    }
  }

  // 4. Confirm and set Duration Node 132 -> input 'value'
  const node132 = cloned['132'];
  if (!node132 || !node132.inputs) {
    errors.push("Cannot set duration: Node '132' or its 'inputs' object does not exist in the workflow.");
  } else {
    if (!('value' in node132.inputs)) {
      errors.push("Cannot set duration: Node '132' does not have an input named 'value'.");
    } else {
      // Set to duration seconds (number)
      node132.inputs.value = Number(durationSeconds);
    }
  }

  // 5. Confirm and set Resolution Node 115 -> inputs 'aspect_ratio' and 'megapixels'
  const node115 = cloned['115'];
  if (!node115 || !node115.inputs) {
    errors.push("Cannot set resolution: Node '115' or its 'inputs' object does not exist in the workflow.");
  } else {
    // Aspect ratio
    if (!('aspect_ratio' in node115.inputs)) {
      errors.push("Resolution node '115' is missing input 'aspect_ratio'.");
    } else {
      // Normalize aspect ratio to match workflow convention (e.g. "9:16", "16:9", "1:1")
      let cleanAspect = aspectRatio.trim();
      const match = cleanAspect.match(/(\d+:\d+)/);
      if (match) {
        cleanAspect = match[1];
      }
      node115.inputs.aspect_ratio = cleanAspect;
    }

    // Megapixels
    if (!('megapixels' in node115.inputs)) {
      errors.push("Resolution node '115' is missing input 'megapixels'.");
    } else if (megapixels !== undefined && megapixels !== null) {
      const existingVal = node115.inputs.megapixels;
      if (typeof existingVal === 'number') {
        node115.inputs.megapixels = Number(megapixels);
      } else {
        node115.inputs.megapixels = String(megapixels);
      }
    }
  }

  // 6. Inspect and set FPS on nodes 149 and/or 146
  // Inspect the imported JSON roles and valid keys without guessing or fabricating
  const node149 = cloned['149'];
  const node146 = cloned['146'];

  let fpsApplied = false;

  const tryApplyFpsToNode = (node: any, nodeId: string): boolean => {
    if (!node || !node.inputs) return false;
    let applied = false;

    // Check for direct literal input keys (not link tuples [nodeId, index])
    const candidates = ['value', 'fps', 'frame_rate', 'int', 'float'];
    for (const key of candidates) {
      if (key in node.inputs && !Array.isArray(node.inputs[key])) {
        const current = node.inputs[key];
        if (typeof current === 'number') {
          node.inputs[key] = Number(fps);
          applied = true;
        } else if (typeof current === 'string' && !isNaN(Number(current))) {
          node.inputs[key] = String(fps);
          applied = true;
        }
      }
    }
    return applied;
  };

  if (node149) {
    if (tryApplyFpsToNode(node149, '149')) fpsApplied = true;
  }
  if (node146) {
    if (tryApplyFpsToNode(node146, '146')) fpsApplied = true;
  }

  if (!fpsApplied && (node149 || node146)) {
    // If neither candidate matched a primitive input, check if there's any scalar number input
    for (const n of [node149, node146]) {
      if (n && n.inputs) {
        for (const [k, v] of Object.entries(n.inputs)) {
          if (typeof v === 'number' && !Array.isArray(v)) {
            n.inputs[k] = Number(fps);
            fpsApplied = true;
            break;
          }
        }
      }
      if (fpsApplied) break;
    }
  }

  // 7. Confirm Video Output Node 145 and ensure required 'pingpong' input is preserved
  const node145 = cloned['145'];
  if (!node145 || !node145.inputs) {
    errors.push("Video output node '145' or its 'inputs' object does not exist in the workflow.");
  } else {
    // Preserve existing pingpong or default to existing value
    if (node145.inputs.pingpong === undefined) {
      node145.inputs.pingpong = false;
    }
    // Do NOT delete or modify any other inputs on node 145
  }

  return {
    payload: cloned,
    errors,
  };
}
