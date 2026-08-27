import React from 'react';
import type { Advisory, AdvisoryResult } from '../../types';

// ---------------------------------------------------------------------------
// Helper: Section wrapper
// ---------------------------------------------------------------------------
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ title, icon, iconBg, children, className = '' }) => (
  <section className={`card p-5 sm:p-6 ${className}`} aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <h2
      id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="advisory-section-title"
    >
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-white ${iconBg}`} aria-hidden="true">
        {icon}
      </span>
      {title}
    </h2>
    {children}
  </section>
);

// ---------------------------------------------------------------------------
// Helper: Bullet list
// ---------------------------------------------------------------------------
const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2.5 text-sm text-gray-700">
        <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

// ---------------------------------------------------------------------------
// Main result component
// ---------------------------------------------------------------------------
interface AdvisoryResultDisplayProps {
  advisory: Advisory;
}

function getSuitabilityBadge(suitability: string | undefined): React.ReactNode {
  if (!suitability) return null;
  const lower = suitability.toLowerCase();
  let cls = 'badge-gray';
  if (lower.includes('high')) cls = 'badge-green';
  else if (lower.includes('moderate')) cls = 'badge-amber';
  else if (lower.includes('conditional') || lower.includes('low')) cls = 'badge-amber';
  return <span className={cls}>{suitability}</span>;
}

export const AdvisoryResultDisplay: React.FC<AdvisoryResultDisplayProps> = ({ advisory }) => {
  const result = advisory.advisory_result as AdvisoryResult;

  if (!result) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500">No advisory result available.</p>
      </div>
    );
  }

  const pr = result.primary_recommendation;

  return (
    <div className="space-y-5">

      {/* ── Primary recommendation ── */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <p className="text-green-200 text-sm font-medium mb-2 uppercase tracking-wide">Primary Recommendation</p>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold">{pr.crop}</h1>
          {pr.suitability && (
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {pr.suitability}
            </span>
          )}
        </div>
        <p className="mt-4 text-green-50 text-sm sm:text-base leading-relaxed">{result.summary}</p>
      </div>

      {/* ── Why this crop ── */}
      <Section
        title="Why This Crop?"
        iconBg="bg-green-600"
        icon={
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        }
      >
        <p className="text-sm text-gray-700 leading-relaxed">{pr.reasoning}</p>
      </Section>

      {/* ── Alternative crops ── */}
      {result.alternative_crops.length > 0 && (
        <Section
          title="Alternative Crops"
          iconBg="bg-amber-500"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.alternative_crops.map((alt, i) => (
              <div key={i} className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-gray-900 text-sm">{alt.crop}</span>
                  {getSuitabilityBadge(alt.suitability)}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{alt.reason}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Two-column sections ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Soil preparation */}
        {result.soil_preparation.length > 0 && (
          <Section
            title="Soil Preparation"
            iconBg="bg-earth-600"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            }
          >
            <BulletList items={result.soil_preparation} />
          </Section>
        )}

        {/* Planting guidance */}
        {result.planting_guidance.length > 0 && (
          <Section
            title="Planting Plan"
            iconBg="bg-green-500"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M13 7H7v6h6V7z" />
                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
              </svg>
            }
          >
            <BulletList items={result.planting_guidance} />
          </Section>
        )}

        {/* Irrigation */}
        {result.irrigation.length > 0 && (
          <Section
            title="Water & Irrigation"
            iconBg="bg-sky-500"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            }
          >
            <BulletList items={result.irrigation} />
          </Section>
        )}

        {/* Nutrient management */}
        {result.nutrient_management.length > 0 && (
          <Section
            title="Nutrient Management"
            iconBg="bg-amber-600"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            }
          >
            <BulletList items={result.nutrient_management} />
          </Section>
        )}

        {/* Pest & disease */}
        {result.pest_and_disease_management.length > 0 && (
          <Section
            title="Pest & Disease Management"
            iconBg="bg-red-500"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            }
          >
            <BulletList items={result.pest_and_disease_management} />
          </Section>
        )}

        {/* Weed management */}
        {result.weed_management.length > 0 && (
          <Section
            title="Weed Management"
            iconBg="bg-green-700"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            }
          >
            <BulletList items={result.weed_management} />
          </Section>
        )}

        {/* Harvest */}
        {result.harvest_guidance.length > 0 && (
          <Section
            title="Harvest Considerations"
            iconBg="bg-amber-500"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            }
          >
            <BulletList items={result.harvest_guidance} />
          </Section>
        )}

        {/* Sustainability */}
        {result.sustainability_tips.length > 0 && (
          <Section
            title="Sustainable Practices"
            iconBg="bg-teal-600"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16A8 8 0 0010 2zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
            }
          >
            <BulletList items={result.sustainability_tips} />
          </Section>
        )}
      </div>

      {/* ── Risk factors ── */}
      {result.risk_factors.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6" aria-labelledby="section-risk-factors">
          <h2 id="section-risk-factors" className="advisory-section-title text-amber-800">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
            Risk Factors to Watch
          </h2>
          <ul className="space-y-2">
            {result.risk_factors.map((risk, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-amber-800">
                <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Important notes / disclaimer ── */}
      {result.important_notes.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6" aria-labelledby="section-important-notes">
          <h2 id="section-important-notes" className="advisory-section-title text-gray-700">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500 text-white" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </span>
            Important Notes & Disclaimer
          </h2>
          <ul className="space-y-3">
            {result.important_notes.map((note, i) => (
              <li key={i} className="text-sm text-gray-600 leading-relaxed">
                {i === 0 ? <strong className="text-gray-700">{note}</strong> : note}
              </li>
            ))}
          </ul>

          {/* AI model attribution */}
          {advisory.ai_model && (
            <p className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-400">
              Advisory generated by {advisory.ai_model} on {new Date(advisory.created_at).toLocaleString('en-IN')}
            </p>
          )}
        </section>
      )}
    </div>
  );
};
