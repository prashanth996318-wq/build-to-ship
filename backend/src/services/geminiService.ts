import { GoogleGenAI } from '@google/genai';
import { getEnv } from '../config/env';
import { AdvisoryRequest, AdvisoryResult, AdvisoryResultSchema } from '../validators/advisory';

// Singleton Gemini client (initialized once, reused across requests)
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const env = getEnv();
    geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return geminiClient;
}

/**
 * Constructs the agricultural advisory prompt.
 * Includes system instructions that constrain Gemini's behavior for safety.
 */
function buildPrompt(data: AdvisoryRequest): string {
  const irrigationLabel: Record<string, string> = {
    rainfed: 'Rainfed (no irrigation — relies entirely on rainfall)',
    limited: 'Limited irrigation (occasional supplemental irrigation)',
    moderate: 'Moderate irrigation (irrigation available but not fully reliable)',
    reliable: 'Reliable irrigation (dependable irrigation supply)',
  };

  const landUnitLabel: Record<string, string> = {
    acre: 'acres',
    hectare: 'hectares',
    cent: 'cents',
    bigha: 'bighas',
    other: 'units',
  };

  const irrigationText = irrigationLabel[data.irrigation_availability] ?? data.irrigation_availability;
  const landUnitText = landUnitLabel[data.land_unit] ?? data.land_unit;

  const soilPHText = data.soil_ph != null
    ? `Soil pH: ${data.soil_ph} (on a 0-14 scale)`
    : 'Soil pH: Not tested / Unknown';

  return `
You are an agricultural decision-support assistant helping farmers make informed crop-planning decisions.

IMPORTANT SAFETY AND ACCURACY RULES:
- Base ALL recommendations strictly on the farm information provided below.
- Do NOT invent or assume soil-test results, weather forecasts, satellite data, or yield figures.
- Clearly distinguish between facts stated by the farmer and your agronomic reasoning.
- Where information is insufficient, explicitly state uncertainty and recommend consultation with a qualified local agricultural extension officer or agronomist.
- For fertilizer, pesticide, herbicide, or fungicide suggestions: ALWAYS state that specific product labels, locally approved rates, and agricultural extension guidance must take precedence over any general guidance provided here.
- Do NOT guarantee yields, profits, or crop success.
- Do NOT recommend banned or restricted agricultural inputs.
- Do NOT claim to have inspected the farm, collected soil samples, or accessed real-time data.
- The AI is a DECISION-SUPPORT TOOL, not a replacement for professional agronomists, soil laboratories, or local agricultural officers.

FARMER'S FARM INFORMATION:
=== Location ===
State/Region: ${data.state}
District/City: ${data.district}
${data.village_or_locality ? `Village/Locality: ${data.village_or_locality}` : ''}

=== Soil ===
Soil Type: ${data.soil_type}
${soilPHText}
${data.soil_notes ? `Soil Notes / Observations: ${data.soil_notes}` : ''}

=== Farm ===
Land Area: ${data.land_area} ${landUnitText}
Irrigation: ${irrigationText}
${data.water_source ? `Water Source: ${data.water_source}` : ''}

=== Agricultural Context ===
Current Season: ${data.season}
${data.previous_crop ? `Previous Crop: ${data.previous_crop}` : 'Previous Crop: Not specified'}
${data.crop_category ? `Preferred Crop Category: ${data.crop_category}` : ''}
Farming Objective: ${data.farming_objective}

${data.additional_notes ? `=== Farmer Observations / Additional Context ===\n${data.additional_notes}` : ''}

TASK:
Based on the above information, generate a structured agricultural crop advisory.

Return ONLY valid JSON matching this exact schema. Do not include any markdown formatting, explanations, or text outside the JSON object:

{
  "summary": "A 2-4 sentence overall summary of the recommendation and key reasoning.",
  "primary_recommendation": {
    "crop": "Primary recommended crop name",
    "suitability": "High / Moderate / Conditional (with brief qualifier if conditional)",
    "reasoning": "Clear explanation of why this crop suits the provided conditions (soil, climate, irrigation, objective). Be specific to the stated conditions."
  },
  "alternative_crops": [
    {
      "crop": "Alternative crop name",
      "suitability": "High / Moderate / Conditional",
      "reason": "Brief reason why this is a suitable alternative."
    }
  ],
  "soil_preparation": [
    "Action-oriented soil preparation step relevant to the stated soil type and condition."
  ],
  "planting_guidance": [
    "Specific planting/sowing guidance relevant to the season and crop."
  ],
  "irrigation": [
    "Practical irrigation guidance consistent with stated water availability."
  ],
  "nutrient_management": [
    "General nutrient management guidance. Include reminder that specific rates require professional soil testing and local extension guidance."
  ],
  "pest_and_disease_management": [
    "Monitoring and preventive pest/disease management guidance. Do not specify chemical application rates without full context."
  ],
  "weed_management": [
    "Practical weed management steps."
  ],
  "harvest_guidance": [
    "Harvest timing and handling considerations."
  ],
  "risk_factors": [
    "Specific risks to watch for given the provided conditions (weather, pest, disease, market, etc.)."
  ],
  "sustainability_tips": [
    "Resource-efficient and sustainable farming practices suitable for the context."
  ],
  "important_notes": [
    "This advisory is an AI-generated decision-support tool and should not replace advice from a qualified agronomist, soil laboratory, or local agricultural extension service.",
    "Additional important notes, caveats, or disclaimers specific to this recommendation."
  ]
}

Generate 2-4 alternative crops, 3-6 items per guidance section where applicable, and at least 2 risk factors and 2 sustainability tips. Ensure all advice is grounded in the provided farm information.
`;
}

/**
 * Calls Google Gemini to generate a structured crop advisory.
 * Validates and returns the structured advisory result.
 *
 * @throws Error if Gemini fails or returns an unparseable/invalid response.
 */
export async function generateCropAdvisory(
  data: AdvisoryRequest
): Promise<{ result: AdvisoryResult; modelUsed: string }> {
  const env = getEnv();
  const client = getGeminiClient();

  const prompt = buildPrompt(data);

  const candidateModels = Array.from(new Set([
    'gemini-3.6-flash',
    env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-1.5-flash',
  ]));

  let rawText = '';
  let modelUsed = env.GEMINI_MODEL;
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        const response = await client.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.4,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        });

        if (response.text && response.text.trim().length > 0) {
          rawText = response.text;
          modelUsed = model;
          lastError = null;
          break;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[GeminiService] Model ${model} attempt ${attempts} failed (${message}).`);
        lastError = err instanceof Error ? err : new Error(message);

        // If it's a 503 / temporary overload, wait 1 second and retry once before skipping model
        if (attempts < 2 && message.includes('503')) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (rawText) break;
  }

  if (lastError && !rawText) {
    console.error('[GeminiService] All Gemini candidate models failed:', lastError.message);
    throw new Error(`AI service unavailable: ${lastError.message}`);
  }

  // Clean up potential markdown code fences in the response
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('[GeminiService] Failed to parse JSON response. Raw text:', rawText.slice(0, 500));
    throw new Error('AI service returned an unexpected response format. Please try again.');
  }

  // Normalize response object structure before validation
  if (parsed && typeof parsed === 'object' && parsed !== null) {
    const p = parsed as Record<string, any>;
    if (Array.isArray(p.alternative_crops)) {
      p.alternative_crops = p.alternative_crops.map((item: any) => {
        if (typeof item === 'string') return { crop: item, reason: '' };
        if (typeof item === 'object' && item !== null) {
          return {
            crop: String(item.crop || item.name || 'Alternative Crop'),
            suitability: item.suitability ? String(item.suitability) : undefined,
            reason: String(item.reason || item.reasoning || item.description || ''),
          };
        }
        return { crop: 'Alternative Crop', reason: '' };
      });
    }
  }

  // Validate the parsed response against our schema
  const validation = AdvisoryResultSchema.safeParse(parsed);
  if (!validation.success) {
    console.error('[GeminiService] AI response failed Zod validation:', validation.error.flatten());
    throw new Error('AI service returned an invalid advisory structure. Please try again.');
  }

  return {
    result: validation.data,
    modelUsed: modelUsed,
  };
}
