import { supabase } from './supabase';
import type { Advisory, AdvisoryRequest, ApiResponse } from '../types';

// Use the Vite proxy in dev (/api → http://localhost:3001)
// In production, set VITE_API_URL to the deployed backend URL.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

/**
 * Gets the current user's Supabase access token.
 * Returns null if the user is not authenticated.
 */
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Makes an authenticated request to the Express backend.
 * Automatically attaches the Supabase JWT as a Bearer token.
 */
async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAccessToken();

  if (!token) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to perform this action.',
      },
    };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const json = (await response.json()) as ApiResponse<T>;
    return json;
  } catch {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your connection and try again.',
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Advisory API calls
// ---------------------------------------------------------------------------

export async function createAdvisory(
  data: AdvisoryRequest
): Promise<ApiResponse<{ id: string; status: string; advisory_result: Advisory['advisory_result']; recommended_crop: string; ai_model: string }>> {
  return authFetch('/advisories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAdvisories(): Promise<ApiResponse<Advisory[]>> {
  return authFetch('/advisories');
}

export async function getAdvisory(id: string): Promise<ApiResponse<Advisory>> {
  return authFetch(`/advisories/${id}`);
}

export async function deleteAdvisory(id: string): Promise<ApiResponse<{ message: string }>> {
  return authFetch(`/advisories/${id}`, { method: 'DELETE' });
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
