import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdvisoryForm } from '../components/advisory/AdvisoryForm';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { createAdvisory } from '../lib/api';
import type { AdvisoryRequest } from '../types';

export const NewAdvisory: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState<string | null>(null);

  const handleSubmit = async (data: AdvisoryRequest) => {
    setSubmitting(true);
    setSubmitError(null);
    setGeneratingMessage('Analyzing your farm conditions…');

    // Stagger loading messages for better UX
    const msgs = [
      'Analyzing your farm conditions…',
      'Consulting agricultural knowledge base…',
      'Generating personalized crop recommendations…',
      'Structuring your advisory report…',
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setGeneratingMessage(msgs[msgIdx]);
    }, 3000);

    const response = await createAdvisory(data);

    clearInterval(msgInterval);
    setSubmitting(false);
    setGeneratingMessage(null);

    if (response.success) {
      navigate(`/advisory/${response.data.id}`, { replace: true });
    } else {
      setSubmitError(response.error.message);
      // If the backend returned an advisory_id for a failed attempt, we can still navigate
      if (response.error.advisory_id) {
        // Offer navigation but stay on form to allow retry
      }
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">New Crop Advisory</h1>
        <p className="text-gray-600 text-sm">
          Fill in your farm details to receive a personalized AI-generated crop recommendation.
          The more accurate your information, the better the advisory.
        </p>
      </div>

      {/* AI generating overlay */}
      {submitting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4"
          role="status"
          aria-live="polite"
          aria-label="Generating advisory"
        >
          <div className="card p-8 text-center max-w-sm w-full shadow-xl">
            <Spinner size="lg" className="text-green-600 mx-auto mb-5" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Advisory</h2>
            <p className="text-sm text-gray-500 mb-4 min-h-[20px]">{generatingMessage}</p>
            <p className="text-xs text-gray-400">
              This takes 15–30 seconds. Please wait and do not close this tab.
            </p>
            {/* Progress bar animation */}
            <div className="mt-5 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full animate-pulse w-2/3" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {submitError && !submitting && (
        <Alert
          variant="error"
          title="Advisory generation failed"
          message={submitError}
          onDismiss={() => setSubmitError(null)}
          className="mb-6"
        />
      )}

      <div className="card-md p-6 sm:p-8">
        <AdvisoryForm
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={null /* shown above form, not inside it */}
        />
      </div>
    </div>
  );
};
