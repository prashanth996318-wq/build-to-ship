import { useState, useCallback } from 'react';
import * as api from '../lib/api';
import type { Advisory, AdvisoryRequest } from '../types';

interface UseAdvisoriesReturn {
  advisories: Advisory[];
  loading: boolean;
  error: string | null;
  fetchAdvisories: () => Promise<void>;
  fetchAdvisory: (id: string) => Promise<Advisory | null>;
  createAdvisory: (data: AdvisoryRequest) => Promise<{ id: string; advisory_result: Advisory['advisory_result'] } | null>;
  removeAdvisory: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useAdvisories(): UseAdvisoriesReturn {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvisories = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await api.getAdvisories();
    setLoading(false);

    if (response.success) {
      setAdvisories(response.data);
    } else {
      setError(response.error.message);
    }
  }, []);

  const fetchAdvisory = useCallback(async (id: string): Promise<Advisory | null> => {
    const response = await api.getAdvisory(id);
    if (response.success) {
      return response.data;
    }
    return null;
  }, []);

  const createAdvisory = useCallback(
    async (data: AdvisoryRequest): Promise<{ id: string; advisory_result: Advisory['advisory_result'] } | null> => {
      const response = await api.createAdvisory(data);
      if (response.success) {
        return {
          id: response.data.id,
          advisory_result: response.data.advisory_result,
        };
      }
      setError(response.error.message);
      return null;
    },
    []
  );

  const removeAdvisory = useCallback(async (id: string): Promise<boolean> => {
    const response = await api.deleteAdvisory(id);
    if (response.success) {
      setAdvisories((prev) => prev.filter((a) => a.id !== id));
      return true;
    }
    setError(response.error.message);
    return false;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    advisories,
    loading,
    error,
    fetchAdvisories,
    fetchAdvisory,
    createAdvisory,
    removeAdvisory,
    clearError,
  };
}
