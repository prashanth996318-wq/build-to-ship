import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '../config/env';
import { AdvisoryRequest, AdvisoryResult } from '../validators/advisory';

// Lazy-initialized service-role client (server-side only — NEVER expose to browser)
let serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const env = getEnv();
    serviceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdvisoryRecord {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  state: string;
  district: string;
  village_or_locality: string | null;
  soil_type: string;
  soil_ph: number | null;
  land_area: number;
  land_unit: string;
  irrigation_availability: string;
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
// Create advisory (pending state)
// ---------------------------------------------------------------------------

export async function createAdvisoryRecord(
  userId: string,
  data: AdvisoryRequest
): Promise<AdvisoryRecord> {
  const client = getServiceClient();

  const { data: record, error } = await client
    .from('advisories')
    .insert({
      user_id: userId,
      status: 'pending',
      state: data.state,
      district: data.district,
      village_or_locality: data.village_or_locality ?? null,
      soil_type: data.soil_type,
      soil_ph: data.soil_ph ?? null,
      land_area: data.land_area,
      land_unit: data.land_unit,
      irrigation_availability: data.irrigation_availability,
      water_source: data.water_source ?? null,
      season: data.season,
      previous_crop: data.previous_crop ?? null,
      crop_category: data.crop_category ?? null,
      farming_objective: data.farming_objective ?? null,
      additional_notes: data.additional_notes ?? null,
      request_payload: data,
    })
    .select()
    .single();

  if (error || !record) {
    throw new Error(`Failed to create advisory record: ${error?.message}`);
  }

  return record as AdvisoryRecord;
}

// ---------------------------------------------------------------------------
// Update advisory with AI result
// ---------------------------------------------------------------------------

export async function updateAdvisoryWithResult(
  id: string,
  userId: string,
  result: AdvisoryResult,
  modelUsed: string
): Promise<void> {
  const client = getServiceClient();

  const { error } = await client
    .from('advisories')
    .update({
      status: 'completed',
      recommended_crop: result.primary_recommendation.crop,
      advisory_result: result,
      ai_model: modelUsed,
      error_code: null,
      error_message: null,
    })
    .eq('id', id)
    .eq('user_id', userId); // Double-check ownership even with service role

  if (error) {
    throw new Error(`Failed to update advisory with result: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Mark advisory as failed
// ---------------------------------------------------------------------------

export async function markAdvisoryFailed(
  id: string,
  userId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  const client = getServiceClient();

  await client
    .from('advisories')
    .update({
      status: 'failed',
      error_code: errorCode,
      error_message: errorMessage,
    })
    .eq('id', id)
    .eq('user_id', userId);
}

// ---------------------------------------------------------------------------
// Get all advisories for a user
// ---------------------------------------------------------------------------

export async function getUserAdvisories(userId: string): Promise<AdvisoryRecord[]> {
  const client = getServiceClient();

  const { data, error } = await client
    .from('advisories')
    .select(
      'id, user_id, status, state, district, village_or_locality, soil_type, soil_ph, land_area, land_unit, irrigation_availability, water_source, season, previous_crop, crop_category, farming_objective, additional_notes, recommended_crop, ai_model, error_code, error_message, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch advisories: ${error.message}`);
  }

  return (data ?? []) as AdvisoryRecord[];
}

// ---------------------------------------------------------------------------
// Get a single advisory (with full result) — verifies ownership
// ---------------------------------------------------------------------------

export async function getAdvisoryById(
  id: string,
  userId: string
): Promise<AdvisoryRecord | null> {
  const client = getServiceClient();

  const { data, error } = await client
    .from('advisories')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    // PGRST116 = no rows returned (not found)
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch advisory: ${error.message}`);
  }

  return data as AdvisoryRecord;
}

// ---------------------------------------------------------------------------
// Delete an advisory — verifies ownership
// ---------------------------------------------------------------------------

export async function deleteAdvisory(id: string, userId: string): Promise<boolean> {
  const client = getServiceClient();

  const { error, count } = await client
    .from('advisories')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete advisory: ${error.message}`);
  }

  return (count ?? 0) > 0;
}
