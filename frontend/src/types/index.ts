// Shared TypeScript types for the application.
// These mirror the database schema and API response shapes.

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  email: string | undefined;
}

// ---------------------------------------------------------------------------
// Enums / constants (mirroring backend validators)
// ---------------------------------------------------------------------------
export const LAND_UNITS = ['acre', 'hectare', 'cent', 'bigha', 'other'] as const;
export type LandUnit = (typeof LAND_UNITS)[number];

export const IRRIGATION_AVAILABILITIES = ['rainfed', 'limited', 'moderate', 'reliable'] as const;
export type IrrigationAvailability = (typeof IRRIGATION_AVAILABILITIES)[number];

export type AdvisoryStatus = 'pending' | 'processing' | 'completed' | 'failed';

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

export const SEASONS = [
  'Kharif (monsoon season)',
  'Rabi (winter season)',
  'Zaid (summer season)',
  'Year-round',
  'Spring',
  'Summer',
  'Autumn/Fall',
  'Winter',
  'Other',
] as const;

// ---------------------------------------------------------------------------
// Advisory request form data
// ---------------------------------------------------------------------------
export interface AdvisoryFormData {
  state: string;
  district: string;
  village_or_locality: string;
  soil_type: string;
  soil_ph: string; // String in form, converted to number on submit
  soil_notes: string;
  land_area: string; // String in form
  land_unit: LandUnit;
  irrigation_availability: IrrigationAvailability;
  water_source: string;
  season: string;
  previous_crop: string;
  crop_category: string;
  farming_objective: string;
  additional_notes: string;
}

// ---------------------------------------------------------------------------
// Advisory API request (sent to backend)
// ---------------------------------------------------------------------------
export interface AdvisoryRequest {
  state: string;
  district: string;
  village_or_locality?: string | null;
  soil_type: string;
  soil_ph?: number | null;
  soil_notes?: string | null;
  land_area: number;
  land_unit: LandUnit;
  irrigation_availability: IrrigationAvailability;
  water_source?: string | null;
  season: string;
  previous_crop?: string | null;
  crop_category?: string | null;
  farming_objective: string;
  additional_notes?: string | null;
}

// ---------------------------------------------------------------------------
// AI Advisory result structure
// ---------------------------------------------------------------------------
export interface AlternativeCrop {
  crop: string;
  suitability?: string;
  reason: string;
}

export interface PrimaryRecommendation {
  crop: string;
  suitability?: string;
  reasoning: string;
}

export interface AdvisoryResult {
  summary: string;
  primary_recommendation: PrimaryRecommendation;
  alternative_crops: AlternativeCrop[];
  soil_preparation: string[];
  planting_guidance: string[];
  irrigation: string[];
  nutrient_management: string[];
  pest_and_disease_management: string[];
  weed_management: string[];
  harvest_guidance: string[];
  risk_factors: string[];
  sustainability_tips: string[];
  important_notes: string[];
}

// ---------------------------------------------------------------------------
// Advisory record (returned from API)
// ---------------------------------------------------------------------------
export interface Advisory {
  id: string;
  user_id: string;
  status: AdvisoryStatus;
  state: string;
  district: string;
  village_or_locality: string | null;
  soil_type: string;
  soil_ph: number | null;
  land_area: number;
  land_unit: LandUnit;
  irrigation_availability: IrrigationAvailability;
  water_source: string | null;
  season: string;
  previous_crop: string | null;
  crop_category: string | null;
  farming_objective: string | null;
  additional_notes: string | null;
  recommended_crop: string | null;
  advisory_result: AdvisoryResult | null;
  ai_model: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    advisory_id?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Form validation errors
// ---------------------------------------------------------------------------
export type FormErrors = Partial<Record<keyof AdvisoryFormData, string>>;
