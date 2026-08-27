import React from 'react';
import { Link } from 'react-router-dom';
import type { Advisory } from '../../types';

interface AdvisoryCardProps {
  advisory: Advisory;
  onDelete: (id: string) => void;
}

const statusConfig: Record<Advisory['status'], { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'badge-green' },
  pending: { label: 'Pending', className: 'badge-gray' },
  processing: { label: 'Processing', className: 'badge-blue' },
  failed: { label: 'Failed', className: 'badge-red' },
};

const irrigationLabels: Record<string, string> = {
  rainfed: 'Rainfed',
  limited: 'Limited irrigation',
  moderate: 'Moderate irrigation',
  reliable: 'Reliable irrigation',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({ advisory, onDelete }) => {
  const status = statusConfig[advisory.status];

  return (
    <div className="card p-5 hover:shadow-card-md transition-shadow duration-150">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {advisory.recommended_crop && advisory.status === 'completed' ? (
              <h3 className="text-base font-semibold text-gray-900 truncate">
                🌱 {advisory.recommended_crop}
              </h3>
            ) : (
              <h3 className="text-base font-semibold text-gray-700">
                {advisory.district}, {advisory.state}
              </h3>
            )}
            <span className={status.className}>{status.label}</span>
          </div>
          {advisory.recommended_crop && (
            <p className="text-sm text-gray-500 mt-0.5">
              {advisory.district}, {advisory.state}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
          {formatDate(advisory.created_at)}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs mb-4">
        <div>
          <span className="text-gray-400">Season</span>
          <p className="font-medium text-gray-700 truncate">{advisory.season}</p>
        </div>
        <div>
          <span className="text-gray-400">Soil type</span>
          <p className="font-medium text-gray-700 truncate">{advisory.soil_type}</p>
        </div>
        <div>
          <span className="text-gray-400">Irrigation</span>
          <p className="font-medium text-gray-700 truncate">{irrigationLabels[advisory.irrigation_availability] ?? advisory.irrigation_availability}</p>
        </div>
        <div>
          <span className="text-gray-400">Land</span>
          <p className="font-medium text-gray-700">{advisory.land_area} {advisory.land_unit}</p>
        </div>
        {advisory.crop_category && (
          <div>
            <span className="text-gray-400">Category</span>
            <p className="font-medium text-gray-700 truncate">{advisory.crop_category}</p>
          </div>
        )}
        {advisory.soil_ph != null && (
          <div>
            <span className="text-gray-400">Soil pH</span>
            <p className="font-medium text-gray-700">{advisory.soil_ph}</p>
          </div>
        )}
      </div>

      {/* Failed state */}
      {advisory.status === 'failed' && advisory.error_message && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
          ⚠️ {advisory.error_message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {advisory.status === 'completed' && (
          <Link
            to={`/advisory/${advisory.id}`}
            className="btn btn-primary btn-sm flex-1 text-center"
          >
            View Advisory
          </Link>
        )}
        <button
          onClick={() => onDelete(advisory.id)}
          className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50 hover:border-red-200"
          aria-label={`Delete advisory for ${advisory.district}, ${advisory.state}`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};
