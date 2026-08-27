import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';
import { useAdvisories } from '../hooks/useAdvisories';
import { AdvisoryCard } from '../components/advisory/AdvisoryCard';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const Dashboard: React.FC = () => {
  const { user } = useAuthContext();
  const { advisories, loading, error, fetchAdvisories, removeAdvisory } = useAdvisories();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  useEffect(() => {
    fetchAdvisories();
  }, [fetchAdvisories]);

  const handleDeleteRequest = (id: string) => setDeletingId(id);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    await removeAdvisory(deletingId);
    setDeleteLoading(false);
    setDeletingId(null);
  };

  const recentAdvisories = advisories.slice(0, 3);
  const completedCount = advisories.filter((a) => a.status === 'completed').length;

  return (
    <>
      <div className="page-container">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-6 sm:p-8 text-white mb-8 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Good {getTimeOfDay()}, Farmer! 🌱
              </h1>
              <p className="text-green-200 text-sm truncate max-w-xs">{user?.email}</p>
              <div className="flex gap-4 mt-3 text-sm text-green-100">
                <span><strong className="text-white">{advisories.length}</strong> total advisories</span>
                <span><strong className="text-white">{completedCount}</strong> completed</span>
              </div>
            </div>
            <Link
              to="/advisory/new"
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors shadow focus-ring"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Advisory
            </Link>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="error" message={error} className="mb-6" />
        )}

        {/* Recent advisories */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Advisories</h2>
          {advisories.length > 3 && (
            <Link to="/advisories" className="text-sm font-medium text-green-600 hover:text-green-700 focus-ring rounded">
              View all →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16" aria-live="polite" aria-busy="true">
            <div className="text-center">
              <Spinner size="lg" className="text-green-600 mx-auto" />
              <p className="mt-3 text-sm text-gray-500">Loading your advisories…</p>
            </div>
          </div>
        ) : advisories.length === 0 ? (
          /* Empty state */
          <div className="card p-10 text-center">
            <div className="text-5xl mb-4" aria-hidden="true">🌾</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No advisories yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Create your first AI crop advisory by describing your farm's soil, location, and season.
            </p>
            <Link to="/advisory/new" className="btn btn-primary">
              Create Your First Advisory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentAdvisories.map((advisory) => (
              <AdvisoryCard key={advisory.id} advisory={advisory} onDelete={handleDeleteRequest} />
            ))}
          </div>
        )}

        {/* Quick links if there are advisories */}
        {advisories.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/advisories" className="card p-5 flex items-center gap-4 hover:shadow-card-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Advisory History</p>
                <p className="text-xs text-gray-500">View all {advisories.length} advisories</p>
              </div>
            </Link>
            <Link to="/advisory/new" className="card p-5 flex items-center gap-4 hover:shadow-card-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">New Advisory</p>
                <p className="text-xs text-gray-500">Get a fresh AI crop recommendation</p>
              </div>
            </Link>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Advisory"
        message="Are you sure you want to delete this advisory? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
        loading={deleteLoading}
      />
    </>
  );
};

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
