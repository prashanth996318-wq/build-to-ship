import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import type {
  AdvisoryFormData,
  AdvisoryRequest,
  FormErrors,
  LandUnit,
  IrrigationAvailability,
} from '../../types';
import {
  SOIL_TYPES,
  CROP_CATEGORIES,
  WATER_SOURCES,
  FARMING_OBJECTIVES,
  SEASONS,
  LAND_UNITS,
} from '../../types';

// ---------------------------------------------------------------------------
// Form steps
// ---------------------------------------------------------------------------
const STEPS = [
  { id: 'location', label: 'Location', icon: '📍' },
  { id: 'soil', label: 'Soil', icon: '🌍' },
  { id: 'farm', label: 'Farm', icon: '🚜' },
  { id: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { id: 'extra', label: 'Review', icon: '✅' },
];

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------
const defaultFormData: AdvisoryFormData = {
  state: '',
  district: '',
  village_or_locality: '',
  soil_type: '',
  soil_ph: '',
  soil_notes: '',
  land_area: '',
  land_unit: 'acre',
  irrigation_availability: 'rainfed',
  water_source: '',
  season: '',
  previous_crop: '',
  crop_category: '',
  farming_objective: '',
  additional_notes: '',
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateStep(step: number, data: AdvisoryFormData): FormErrors {
  const errors: FormErrors = {};

  if (step === 0) {
    if (!data.state.trim()) errors.state = 'State or region is required.';
    else if (data.state.trim().length < 2) errors.state = 'Please enter a valid state name.';
    if (!data.district.trim()) errors.district = 'District or city is required.';
    else if (data.district.trim().length < 2) errors.district = 'Please enter a valid district name.';
  }

  if (step === 1) {
    if (!data.soil_type) errors.soil_type = 'Please select a soil type.';
    if (data.soil_ph !== '') {
      const ph = parseFloat(data.soil_ph);
      if (isNaN(ph)) errors.soil_ph = 'Soil pH must be a number.';
      else if (ph < 0 || ph > 14) errors.soil_ph = 'Soil pH must be between 0 and 14.';
    }
  }

  if (step === 2) {
    if (!data.land_area) {
      errors.land_area = 'Land area is required.';
    } else {
      const area = parseFloat(data.land_area);
      if (isNaN(area) || area <= 0) errors.land_area = 'Land area must be a positive number.';
    }
    if (!data.land_unit) errors.land_unit = 'Please select a land unit.';
    if (!data.irrigation_availability) errors.irrigation_availability = 'Please select irrigation availability.';
  }

  if (step === 3) {
    if (!data.season) errors.season = 'Please select a season.';
    if (!data.farming_objective) errors.farming_objective = 'Please select a farming objective.';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface AdvisoryFormProps {
  onSubmit: (data: AdvisoryRequest) => Promise<void>;
  submitting: boolean;
  submitError: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const AdvisoryForm: React.FC<AdvisoryFormProps> = ({ onSubmit, submitting, submitError }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AdvisoryFormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = (field: keyof AdvisoryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const goNext = () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps before submit
    let allErrors: FormErrors = {};
    for (let i = 0; i < 4; i++) {
      allErrors = { ...allErrors, ...validateStep(i, formData) };
    }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    const request: AdvisoryRequest = {
      state: formData.state.trim(),
      district: formData.district.trim(),
      village_or_locality: formData.village_or_locality.trim() || null,
      soil_type: formData.soil_type,
      soil_ph: formData.soil_ph !== '' ? parseFloat(formData.soil_ph) : null,
      soil_notes: formData.soil_notes.trim() || null,
      land_area: parseFloat(formData.land_area),
      land_unit: formData.land_unit as LandUnit,
      irrigation_availability: formData.irrigation_availability as IrrigationAvailability,
      water_source: formData.water_source || null,
      season: formData.season,
      previous_crop: formData.previous_crop.trim() || null,
      crop_category: formData.crop_category || null,
      farming_objective: formData.farming_objective,
      additional_notes: formData.additional_notes.trim() || null,
    };

    await onSubmit(request);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderStep = () => {
    switch (currentStep) {
      // --- Step 0: Location ---
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Farm Location</h2>
              <p className="text-sm text-gray-500">Help us understand where your farm is located so we can tailor the recommendation to your region.</p>
            </div>
            <Input
              id="field-state"
              label="State / Region"
              placeholder="e.g., Maharashtra, Punjab, Karnataka"
              value={formData.state}
              onChange={(e) => update('state', e.target.value)}
              error={errors.state}
              required
              autoFocus
            />
            <Input
              id="field-district"
              label="District / City"
              placeholder="e.g., Nashik, Amritsar, Belgaum"
              value={formData.district}
              onChange={(e) => update('district', e.target.value)}
              error={errors.district}
              required
            />
            <Input
              id="field-village"
              label="Village / Locality (optional)"
              placeholder="e.g., Igatpuri"
              value={formData.village_or_locality}
              onChange={(e) => update('village_or_locality', e.target.value)}
            />
          </div>
        );

      // --- Step 1: Soil ---
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Soil Information</h2>
              <p className="text-sm text-gray-500">Soil characteristics are a key factor in determining which crops will thrive on your land.</p>
            </div>
            <Select
              id="field-soil-type"
              label="Soil Type"
              value={formData.soil_type}
              onChange={(e) => update('soil_type', e.target.value)}
              options={SOIL_TYPES.map((s) => ({ value: s, label: s }))}
              placeholder="Select soil type"
              error={errors.soil_type}
              required
            />
            <Input
              id="field-soil-ph"
              label="Soil pH (optional)"
              type="number"
              min={0}
              max={14}
              step={0.1}
              placeholder="e.g., 6.5"
              value={formData.soil_ph}
              onChange={(e) => update('soil_ph', e.target.value)}
              error={errors.soil_ph}
              hint="Typical agricultural range: 5.5–7.5. Leave blank if unknown."
              rightAddon="pH"
            />
            <Textarea
              id="field-soil-notes"
              label="Soil Observations / Notes (optional)"
              placeholder="e.g., Recently conducted soil test shows low nitrogen. Fields tend to waterlog."
              value={formData.soil_notes}
              onChange={(e) => update('soil_notes', e.target.value)}
              rows={3}
              maxLength={500}
              showCount
            />
          </div>
        );

      // --- Step 2: Farm ---
      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Farm Details</h2>
              <p className="text-sm text-gray-500">Tell us about your land size and water availability for irrigation planning.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  id="field-land-area"
                  label="Land Area"
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="e.g., 2.5"
                  value={formData.land_area}
                  onChange={(e) => update('land_area', e.target.value)}
                  error={errors.land_area}
                  required
                />
              </div>
              <div className="w-36">
                <Select
                  id="field-land-unit"
                  label="Unit"
                  value={formData.land_unit}
                  onChange={(e) => update('land_unit', e.target.value)}
                  options={LAND_UNITS.map((u) => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}
                  error={errors.land_unit}
                  required
                />
              </div>
            </div>
            <Select
              id="field-irrigation"
              label="Irrigation Availability"
              value={formData.irrigation_availability}
              onChange={(e) => update('irrigation_availability', e.target.value)}
              options={[
                { value: 'rainfed', label: 'Rainfed — no irrigation, relies on rainfall' },
                { value: 'limited', label: 'Limited — occasional supplemental irrigation' },
                { value: 'moderate', label: 'Moderate — irrigation available but not always reliable' },
                { value: 'reliable', label: 'Reliable — dependable irrigation supply' },
              ]}
              error={errors.irrigation_availability}
              required
            />
            {formData.irrigation_availability !== 'rainfed' && (
              <Select
                id="field-water-source"
                label="Primary Water Source (optional)"
                value={formData.water_source}
                onChange={(e) => update('water_source', e.target.value)}
                options={WATER_SOURCES.map((s) => ({ value: s, label: s }))}
                placeholder="Select water source"
              />
            )}
          </div>
        );

      // --- Step 3: Agricultural context ---
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Agricultural Context</h2>
              <p className="text-sm text-gray-500">Season, crop history, and your farming goals are essential for a personalized recommendation.</p>
            </div>
            <Select
              id="field-season"
              label="Current / Upcoming Season"
              value={formData.season}
              onChange={(e) => update('season', e.target.value)}
              options={SEASONS.map((s) => ({ value: s, label: s }))}
              placeholder="Select season"
              error={errors.season}
              required
            />
            <Input
              id="field-previous-crop"
              label="Previous Crop (optional)"
              placeholder="e.g., Wheat, Rice, Soybean"
              value={formData.previous_crop}
              onChange={(e) => update('previous_crop', e.target.value)}
              hint="Helps us suggest suitable crop rotation options."
            />
            <Select
              id="field-crop-category"
              label="Preferred Crop Category (optional)"
              value={formData.crop_category}
              onChange={(e) => update('crop_category', e.target.value)}
              options={CROP_CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder="No preference — let AI decide"
            />
            <Select
              id="field-farming-objective"
              label="Farming Objective"
              value={formData.farming_objective}
              onChange={(e) => update('farming_objective', e.target.value)}
              options={FARMING_OBJECTIVES.map((o) => ({ value: o, label: o }))}
              placeholder="Select your primary objective"
              error={errors.farming_objective}
              required
              hint="Your primary goal will guide the recommendation."
            />
          </div>
        );

      // --- Step 4: Review / Additional notes ---
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Final Review & Observations</h2>
              <p className="text-sm text-gray-500">Add any other relevant information about your farm, then submit to generate your AI advisory.</p>
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-green-50 border border-green-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-gray-800">{formData.district}, {formData.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Soil Type</span>
                <span className="font-medium text-gray-800">{formData.soil_type || '—'}</span>
              </div>
              {formData.soil_ph && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Soil pH</span>
                  <span className="font-medium text-gray-800">{formData.soil_ph}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Land Area</span>
                <span className="font-medium text-gray-800">{formData.land_area} {formData.land_unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Irrigation</span>
                <span className="font-medium text-gray-800 capitalize">{formData.irrigation_availability}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Season</span>
                <span className="font-medium text-gray-800">{formData.season || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Objective</span>
                <span className="font-medium text-gray-800">{formData.farming_objective || '—'}</span>
              </div>
            </div>

            <Textarea
              id="field-additional-notes"
              label="Farmer Observations / Additional Context (optional)"
              placeholder="e.g., The field had termite issues last year. Market for vegetables is good in my area. Water table is high during monsoon."
              value={formData.additional_notes}
              onChange={(e) => update('additional_notes', e.target.value)}
              rows={4}
              maxLength={1000}
              showCount
              hint="Share anything else that might help the AI provide a better recommendation."
            />

            {submitError && (
              <Alert variant="error" title="Advisory generation failed" message={submitError} />
            )}

            {/* Disclaimer */}
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700 leading-relaxed">
              ⚠️ <strong>Advisory Disclaimer:</strong> The AI-generated advisory is a decision-support tool only. It does not replace professional agronomists, certified soil laboratories, or local agricultural extension services. Always consult qualified local experts before making significant farming decisions.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Crop advisory form">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between" aria-label="Form steps">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (idx < currentStep) {
                      setCurrentStep(idx);
                      setErrors({});
                    }
                  }}
                  disabled={idx > currentStep}
                  className={`h-9 w-9 rounded-full text-sm font-semibold transition-all duration-150
                    ${idx === currentStep ? 'bg-green-600 text-white shadow-md scale-110' : ''}
                    ${idx < currentStep ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200' : ''}
                    ${idx > currentStep ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                  `}
                  aria-label={`Step ${idx + 1}: ${step.label}`}
                  aria-current={idx === currentStep ? 'step' : undefined}
                >
                  {idx < currentStep ? '✓' : step.icon}
                </button>
                <span className={`hidden sm:block text-xs font-medium ${idx === currentStep ? 'text-green-700' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${idx < currentStep ? 'bg-green-400' : 'bg-gray-200'}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[320px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          onClick={goBack}
          disabled={currentStep === 0 || submitting}
        >
          ← Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Next →
          </Button>
        ) : (
          <Button
            type="submit"
            loading={submitting}
            loadingText="Generating Advisory…"
            leftIcon={
              !submitting ? (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              ) : undefined
            }
          >
            Get AI Advisory
          </Button>
        )}
      </div>
    </form>
  );
};
