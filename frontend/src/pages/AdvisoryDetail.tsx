import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAdvisory } from '../lib/api';
import { AdvisoryResultDisplay } from '../components/advisory/AdvisoryResultDisplay';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import type { Advisory } from '../types';

export const AdvisoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/advisories', { replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      const response = await getAdvisory(id);
      setLoading(false);

      if (response.success) {
        setAdvisory(response.data);
      } else {
        if (response.error.code === 'UNAUTHORIZED') {
          navigate('/login', { replace: true });
        } else {
          setError(response.error.message);
        }
      }
    };

    load();
  }, [id, navigate]);

  return (
    <div className="page-container">
      {/* Back navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/advisories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 focus-ring rounded"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Advisories
        </Link>

        {advisory && advisory.status === 'completed' && (
          <Link to="/advisory/new">
            <Button variant="secondary" size="sm">
              New Advisory
            </Button>
          </Link>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24" aria-live="polite" aria-busy="true">
          <div className="text-center">
            <Spinner size="lg" className="text-green-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Loading advisory…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16">
          <Alert variant="error" message={error} className="max-w-md mx-auto mb-6" />
          <Link to="/advisories" className="btn btn-secondary btn-sm">
            Back to Advisories
          </Link>
        </div>
      )}

      {/* Failed advisory */}
      {advisory && advisory.status === 'failed' && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Advisory Generation Failed</h2>
          <p className="text-sm text-gray-600 mb-2">
            The AI advisory for this request could not be generated.
          </p>
          {advisory.error_message && (
            <p className="text-sm text-red-600 mb-6">{advisory.error_message}</p>
          )}
          <Link to="/advisory/new">
            <Button>Try Again with New Advisory</Button>
          </Link>
        </div>
      )}

      {/* Success */}
      {advisory && advisory.status === 'completed' && advisory.advisory_result && (
        <>
          {/* Location and date metadata */}
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>
              📍 {advisory.district}, {advisory.state}
              {advisory.village_or_locality ? `, ${advisory.village_or_locality}` : ''}
            </span>
            <span className="text-gray-300">·</span>
            <span>🗓️ {advisory.season}</span>
            <span className="text-gray-300">·</span>
            <span>
              Generated {new Date(advisory.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>

          <AdvisoryResultDisplay advisory={advisory} />
        </>
      )}
    </div>
  );
};
