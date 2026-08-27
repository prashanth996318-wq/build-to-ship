import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdvisories } from '../hooks/useAdvisories';
import { AdvisoryCard } from '../components/advisory/AdvisoryCard';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const AdvisoryHistory: React.FC = () => {
  const { advisories, loading, error, fetchAdvisories, removeAdvisory } = useAdvisories();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchAdvisories();
  }, [fetchAdvisories]);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    await removeAdvisory(deletingId);
    setDeleteLoading(false);
    setDeletingId(null);
  };

  return (
    <>
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advisory History</h1>
            <p className="text-sm text-gray-500 mt-1">
              All your past AI-generated crop advisories in one place.
            </p>
          </div>
          <Link
            to="/advisory/new"
            className="btn btn-primary flex-shrink-0"
            aria-label="Create new advisory"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Advisory
          </Link>
        </div>

        {error && <Alert variant="error" message={error} className="mb-6" />}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20" aria-live="polite" aria-busy="true">
            <div className="text-center">
              <Spinner size="lg" className="text-green-600 mx-auto" />
              <p className="mt-3 text-sm text-gray-500">Loading advisories…</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && advisories.length === 0 && !error && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4" aria-hidden="true">📋</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No advisories yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              You haven't generated any crop advisories yet. Create your first one to get personalized AI recommendations.
            </p>
            <Link to="/advisory/new" className="btn btn-primary">
              Create First Advisory
            </Link>
          </div>
        )}

        {/* Advisory grid */}
        {!loading && advisories.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{advisories.length} total advisory{advisories.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {advisories.map((advisory) => (
                <AdvisoryCard
                  key={advisory.id}
                  advisory={advisory}
                  onDelete={setDeletingId}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Advisory"
        message="Are you sure you want to permanently delete this advisory? This action cannot be undone."
        confirmLabel="Delete Advisory"
        cancelLabel="Keep It"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
        loading={deleteLoading}
      />
    </>
  );
};
