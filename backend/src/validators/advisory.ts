import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enum values (mirroring the PostgreSQL enums)
// ---------------------------------------------------------------------------

export const LAND_UNITS = ['acre', 'hectare', 'cent', 'bigha', 'other'] as const;
export const IRRIGATION_AVAILABILITIES = ['rainfed', 'limited', 'moderate', 'reliable'] as const;
export const ADVISORY_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;

export const SOIL_TYPES = [
  'Sandy',
  'Sandy loam',
  'Loamy',
  'Clay loam',
  'Clay',
  'Silt loam',
  'Black soil',
  'Red soil',
  'Alluvial soil',
  'Laterite soil',
  'Unknown/Other',
] as const;

export const CROP_CATEGORIES = [
  'Cereals',
  'Pulses',
  'Oilseeds',
  'Vegetables',
  'Fruits',
  'Cash crops',
  'Fiber crops',
  'Fodder crops',
  'Spices',
  'Other',
] as const;

export const WATER_SOURCES = [
  'Rainwater',
  'Borewell',
  'Well',
  'Canal',
  'Reservoir',
  'River',
  'Community water source',
  'Other',
] as const;

export const FARMING_OBJECTIVES = [
  'Maximum yield',
  'Low input cost',
  'Water efficiency',
  'Sustainable farming',
  'Short-duration crop',
  'Long-term profitability',
  'Crop diversification',
  'Soil improvement',
  'Other',
] as const;

// ---------------------------------------------------------------------------
// Advisory request schema — validated on every POST /api/advisories
// ---------------------------------------------------------------------------

export const AdvisoryRequestSchema = z.object({
  // Location
  state: z
    .string()
    .min(2, 'State/region is required.')
    .max(100, 'State name is too long.')
    .trim(),
  district: z
    .string()
    .min(2, 'District/city is required.')
    .max(100, 'District name is too long.')
    .trim(),
  village_or_locality: z
    .string()
    .max(150, 'Village/locality name is too long.')
    .trim()
    .optional()
    .nullable(),

  // Soil
  soil_type: z
    .string()
    .min(1, 'Soil type is required.')
    .max(50, 'Soil type value is too long.'),
  soil_ph: z
    .number({
      invalid_type_error: 'Soil pH must be a number.',
    })
    .min(0, 'Soil pH must be at least 0.')
    .max(14, 'Soil pH must be at most 14.')
    .optional()
    .nullable(),
  soil_notes: z
    .string()
    .max(500, 'Soil notes must not exceed 500 characters.')
    .trim()
    .optional()
    .nullable(),

  // Farm
  land_area: z
    .number({
      required_error: 'Land area is required.',
      invalid_type_error: 'Land area must be a number.',
    })
    .positive('Land area must be greater than zero.'),
  land_unit: z.enum(LAND_UNITS, {
    errorMap: () => ({ message: 'Please select a valid land unit.' }),
  }),

  // Water
  irrigation_availability: z.enum(IRRIGATION_AVAILABILITIES, {
    errorMap: () => ({ message: 'Please select your irrigation availability.' }),
  }),
  water_source: z
    .string()
    .max(100, 'Water source is too long.')
    .optional()
    .nullable(),

  // Agricultural context
  season: z
    .string()
    .min(1, 'Season is required.')
    .max(100, 'Season is too long.')
    .trim(),
  previous_crop: z
    .string()
    .max(150, 'Previous crop name is too long.')
    .trim()
    .optional()
    .nullable(),
  crop_category: z
    .string()
    .max(100, 'Crop category is too long.')
    .optional()
    .nullable(),
  farming_objective: z
    .string()
    .min(1, 'Farming objective is required.')
    .max(150, 'Farming objective is too long.'),

  // Additional
  additional_notes: z
    .string()
    .max(1000, 'Additional notes must not exceed 1000 characters.')
    .trim()
    .optional()
    .nullable(),
});

export type AdvisoryRequest = z.infer<typeof AdvisoryRequestSchema>;

// ---------------------------------------------------------------------------
// AI response schema — validates the structured output from Gemini
// ---------------------------------------------------------------------------

const AlternativeCropSchema = z.object({
  crop: z.string().max(250),
  suitability: z.string().max(250).optional().nullable(),
  reason: z.string().max(1000).optional().nullable().transform((val) => val ?? ''),
});

const PrimaryRecommendationSchema = z.object({
  crop: z.string().max(250),
  suitability: z.string().max(250).optional().nullable(),
  reasoning: z.string().max(2000),
});

export const AdvisoryResultSchema = z.object({
  summary: z.string().max(3000),
  primary_recommendation: PrimaryRecommendationSchema,
  alternative_crops: z.array(AlternativeCropSchema).max(10).default([]),
  soil_preparation: z.array(z.string().max(1500)).max(15).default([]),
  planting_guidance: z.array(z.string().max(1500)).max(15).default([]),
  irrigation: z.array(z.string().max(1500)).max(15).default([]),
  nutrient_management: z.array(z.string().max(1500)).max(15).default([]),
  pest_and_disease_management: z.array(z.string().max(1500)).max(15).default([]),
  weed_management: z.array(z.string().max(1500)).max(15).default([]),
  harvest_guidance: z.array(z.string().max(1500)).max(15).default([]),
  risk_factors: z.array(z.string().max(1500)).max(15).default([]),
  sustainability_tips: z.array(z.string().max(1500)).max(15).default([]),
  important_notes: z.array(z.string().max(2000)).max(15).default([]),
});

export type AdvisoryResult = z.infer<typeof AdvisoryResultSchema>;
