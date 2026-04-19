import { useState } from 'react';
import type { SelectedEventDto, RegistrationRequestDto } from '@cufc/shared';
import { useClubs } from '../hooks/useClubs';

interface RegistrationFormProps {
  readonly m2TournamentId: number;
  readonly selectedEvents: SelectedEventDto[];
  readonly onSubmit: (request: RegistrationRequestDto) => void;
  readonly loading: boolean;
  readonly error: string | null;
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
};

export function RegistrationForm({ 
  m2TournamentId, 
  selectedEvents, 
  onSubmit, 
  loading, 
  error 
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [useLegalName, setUseLegalName] = useState(true);
  const { clubs } = useClubs();

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
    (!formData.isMinor || (formData.guardianFirstName.trim() !== '' && formData.guardianLastName.trim() !== ''));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Legal Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Legal Name <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="legalFirstName"
            value={formData.legalFirstName}
            onChange={handleChange}
            placeholder="First name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
            required
          />
          <input
            type="text"
            name="legalLastName"
            value={formData.legalLastName}
            onChange={handleChange}
            placeholder="Last name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
            required
          />
        </div>
      </div>

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Name
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="preferredFirstName"
              value={formData.preferredFirstName}
              onChange={handleChange}
              placeholder="First name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
            />
            <input
              type="text"
              name="preferredLastName"
              value={formData.preferredLastName}
              onChange={handleChange}
              placeholder="Last name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
            />
          </div>
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="(555) 555-5555"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
        />
      </div>

      {/* Club Affiliation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Club Affiliation
        </label>
        <select
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent/Guardian Name <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="guardianFirstName"
              value={formData.guardianFirstName}
              onChange={handleChange}
              placeholder="First name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
              required
            />
            <input
              type="text"
              name="guardianLastName"
              value={formData.guardianLastName}
              onChange={handleChange}
              placeholder="Last name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-navy focus:border-navy"
              required
            />
          </div>
        </div>
      )}

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
