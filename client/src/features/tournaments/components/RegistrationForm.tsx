import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { SelectedEventDto, RegistrationRequestDto, MemberProfileDTO } from '@cufc/shared';
import { useClubs } from '../hooks/useClubs';

interface RegistrationFormProps {
  readonly m2TournamentId: number;
  readonly selectedEvents: SelectedEventDto[];
  readonly onSubmit: (request: RegistrationRequestDto) => void;
  readonly loading: boolean;
  readonly error: string | null;
  readonly profile?: MemberProfileDTO | null;
  readonly onSignInClick?: () => void;
  readonly onCompleteProfileClick?: () => void;
}

interface FormData {
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phoneNumber: string;
  clubId: string;
  isMinor: boolean;
  guardianFirstName: string;
  guardianLastName: string;
  dataSubmissionAgreement: boolean;
}

const initialFormData: FormData = {
  preferredFirstName: '',
  preferredLastName: '',
  legalFirstName: '',
  legalLastName: '',
  email: '',
  phoneNumber: '',
  clubId: '',
  isMinor: false,
  guardianFirstName: '',
  guardianLastName: '',
  dataSubmissionAgreement: false,
};

export function RegistrationForm({ 
  m2TournamentId, 
  selectedEvents, 
  onSubmit, 
  loading, 
  error,
  profile,
  onSignInClick,
  onCompleteProfileClick,
}: RegistrationFormProps) {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [useLegalName, setUseLegalName] = useState(true);
  const { clubs } = useClubs();

  // Auto-populate form from profile when available
  useEffect(() => {
    if (profile) {
      const hasPreferredName = profile.displayFirstName && profile.displayLastName &&
        (profile.displayFirstName !== profile.personalInfo?.legalFirstName ||
         profile.displayLastName !== profile.personalInfo?.legalLastName);
      
      setFormData({
        legalFirstName: profile.personalInfo?.legalFirstName ?? '',
        legalLastName: profile.personalInfo?.legalLastName ?? '',
        preferredFirstName: hasPreferredName ? (profile.displayFirstName ?? '') : '',
        preferredLastName: hasPreferredName ? (profile.displayLastName ?? '') : '',
        email: profile.personalInfo?.email ?? '',
        phoneNumber: profile.personalInfo?.phone ?? '',
        clubId: '',
        isMinor: false,
        guardianFirstName: profile.guardian?.firstName ?? '',
        guardianLastName: profile.guardian?.lastName ?? '',
        dataSubmissionAgreement: false,
      });
      setUseLegalName(!hasPreferredName);
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClub = clubs.find(c => c.m2ClubId.toString() === formData.clubId);
    
    const request: RegistrationRequestDto = {
      m2TournamentId,
      selectedEvents,
      preferredFirstName: useLegalName ? formData.legalFirstName : formData.preferredFirstName,
      preferredLastName: useLegalName ? formData.legalLastName : formData.preferredLastName,
      legalFirstName: formData.legalFirstName,
      legalLastName: formData.legalLastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      clubAffiliation: selectedClub ? { m2ClubId: selectedClub.m2ClubId, name: selectedClub.name } : undefined,
      isMinor: formData.isMinor,
      guardianFirstName: formData.isMinor ? formData.guardianFirstName : undefined,
      guardianLastName: formData.isMinor ? formData.guardianLastName : undefined,
    };
    
    onSubmit(request);
  };

  const isValid = 
    formData.legalFirstName.trim() !== '' &&
    formData.legalLastName.trim() !== '' &&
    formData.email.trim() !== '' &&
    selectedEvents.length > 0 &&
    formData.dataSubmissionAgreement &&
    (!formData.isMinor || (formData.guardianFirstName.trim() !== '' && formData.guardianLastName.trim() !== ''));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Sign In Prompt - Not authenticated */}
      {!isAuthenticated && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 mb-3">
            <strong>Have an account?</strong> Sign in to auto-fill your information and save it for future registrations.
          </p>
          <button
            type="button"
            onClick={() => {
              onSignInClick?.();
              loginWithRedirect({ appState: { returnTo: globalThis.location.pathname } });
            }}
            className="text-sm font-semibold text-navy hover:underline"
          >
            Sign in or create an account →
          </button>
        </div>
      )}

      {/* Complete Profile Prompt - Authenticated but profile incomplete */}
      {isAuthenticated && !profile?.profileComplete && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800 mb-3">
            <strong>Complete your profile</strong> to auto-fill registration forms and speed up future checkouts.
          </p>
          <button
            type="button"
            onClick={onCompleteProfileClick}
            className="text-sm font-semibold text-navy hover:underline"
          >
            Complete your profile →
          </button>
        </div>
      )}

      {/* Signed In Confirmation - Authenticated with complete profile */}
      {isAuthenticated && profile?.profileComplete && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            ✓ Signed in as <strong>{profile?.personalInfo?.email}</strong>. Your information has been auto-filled.
          </p>
        </div>
      )}

      {/* Legal Name */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          Legal Name <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="legalFirstName"
            value={formData.legalFirstName}
            onChange={handleChange}
            placeholder="First name"
            aria-label="Legal first name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
            required
          />
          <input
            type="text"
            name="legalLastName"
            value={formData.legalLastName}
            onChange={handleChange}
            placeholder="Last name"
            aria-label="Legal last name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
            required
          />
        </div>
      </fieldset>

      {/* Preferred Name Toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!useLegalName}
            onChange={() => setUseLegalName(!useLegalName)}
            className="h-4 w-4 text-navy rounded border-gray-300 focus:ring-navy"
          />
          <span className="text-sm text-gray-600">Use a different preferred name</span>
        </label>
      </div>

      {/* Preferred Name (if different) */}
      {!useLegalName && (
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Name
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="preferredFirstName"
              value={formData.preferredFirstName}
              onChange={handleChange}
              placeholder="First name"
              aria-label="Preferred first name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
            />
            <input
              type="text"
              name="preferredLastName"
              value={formData.preferredLastName}
              onChange={handleChange}
              placeholder="Last name"
              aria-label="Preferred last name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
            />
          </div>
        </fieldset>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="(555) 555-5555"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
        />
      </div>

      {/* Club Affiliation */}
      <div>
        <label htmlFor="clubId" className="block text-sm font-medium text-gray-700 mb-2">
          Club Affiliation
        </label>
        <select
          id="clubId"
          name="clubId"
          value={formData.clubId}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
        >
          <option value="">No club affiliation</option>
          {clubs.map(club => (
            <option key={club.m2ClubId} value={club.m2ClubId}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {/* Minor */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isMinor"
            checked={formData.isMinor}
            onChange={handleChange}
            className="h-4 w-4 text-navy rounded border-gray-300 focus:ring-navy"
          />
          <span className="text-sm text-gray-600">Registrant is a minor (ages 16-17)</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Participants must be at least 16 years old to compete.
        </p>
      </div>

      {/* Guardian Info (if minor) */}
      {formData.isMinor && (
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Parent/Guardian Name <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="guardianFirstName"
              value={formData.guardianFirstName}
              onChange={handleChange}
              placeholder="First name"
              aria-label="Guardian first name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
              required
            />
            <input
              type="text"
              name="guardianLastName"
              value={formData.guardianLastName}
              onChange={handleChange}
              placeholder="Last name"
              aria-label="Guardian last name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
              required
            />
          </div>
        </fieldset>
      )}

      {/* Data Submission Consent */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="dataSubmissionAgreement"
            checked={formData.dataSubmissionAgreement}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-navy rounded border-gray-300 focus:ring-navy"
            aria-label="Data submission consent agreement"
            required
          />
          <span className="text-sm text-gray-700">
            <p className="font-semibold mb-1">Data Submission Consent</p>
            <p className="mb-2">
              By participating in this tournament, you acknowledge and agree that your match results and relevant participant information may be submitted to third-party rating platforms, including but not limited to HEMA Ratings and Meyer Squared.
            </p>
            <p className="mb-2">
              These platforms may use your data for rankings, analytics, and historical recordkeeping. For more information on how your data is handled, please refer to their respective privacy policies.
            </p>
            <p>
              Participants who wish to have their data anonymized should contact the respective platform(s) directly.
            </p>
          </span>
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className={`w-full py-3 uppercase tracking-wider text-sm font-semibold rounded-lg transition-opacity ${
          isValid && !loading
            ? 'bg-navy text-white hover:opacity-90'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </form>
  );
}
