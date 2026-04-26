import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useMemberProfile } from '../../context/ProfileContext'
import { useToast } from '../common/Toast'
import { TextInput } from '../common/TextInput'
import { API_ENDPOINTS } from '../../constants/api'
import type { MemberProfileDTO } from '@cufc/shared'

export interface ProfileFormData {
  displayFirstName: string
  displayLastName: string
  legalFirstName: string
  legalLastName: string
  email: string
  phone: string
  dateOfBirth: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  isMinor: boolean
  guardianFirstName: string
  guardianLastName: string
}

export type ValidationErrors = Record<string, string>

const INITIAL_FORM_DATA: ProfileFormData = {
  displayFirstName: '',
  displayLastName: '',
  legalFirstName: '',
  legalLastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'USA',
  isMinor: false,
  guardianFirstName: '',
  guardianLastName: '',
}

function validateRequired(value: string, fieldName: string): string | undefined {
  return value.trim() ? undefined : `${fieldName} is required.`
}

function validateAge(dateOfBirth: string): string | undefined {
  if (!dateOfBirth.trim()) return 'Date of birth is required.'

  const dob = new Date(dateOfBirth)
  const today = new Date()
  const hasHadBirthdayThisYear = today >= new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
  const age = today.getFullYear() - dob.getFullYear() - (hasHadBirthdayThisYear ? 0 : 1)

  return age < 16 ? 'Members must be at least 16 years old.' : undefined
}

function validateGuardian(formData: ProfileFormData, errors: ValidationErrors): void {
  if (!formData.isMinor) return

  const guardianFirstError = validateRequired(formData.guardianFirstName, 'Guardian first name')
  const guardianLastError = validateRequired(formData.guardianLastName, 'Guardian last name')

  if (guardianFirstError) errors.guardianFirstName = guardianFirstError
  if (guardianLastError) errors.guardianLastName = guardianLastError
}

function validateProfile(formData: ProfileFormData): ValidationErrors {
  const errors: ValidationErrors = {}

  const fieldsToValidate = [
    { value: formData.displayFirstName, field: 'displayFirstName', label: 'Display first name' },
    { value: formData.displayLastName, field: 'displayLastName', label: 'Display last name' },
    { value: formData.legalFirstName, field: 'legalFirstName', label: 'Legal first name' },
    { value: formData.legalLastName, field: 'legalLastName', label: 'Legal last name' },
    { value: formData.email, field: 'email', label: 'Email' },
    { value: formData.street, field: 'street', label: 'Street' },
    { value: formData.city, field: 'city', label: 'City' },
    { value: formData.state, field: 'state', label: 'State' },
    { value: formData.zip, field: 'zip', label: 'ZIP' },
    { value: formData.country, field: 'country', label: 'Country' },
  ]

  for (const { value, field, label } of fieldsToValidate) {
    const error = validateRequired(value, label)
    if (error) errors[field] = error
  }

  const ageError = validateAge(formData.dateOfBirth)
  if (ageError) errors.dateOfBirth = ageError

  validateGuardian(formData, errors)

  return errors
}

function buildPayload(formData: ProfileFormData) {
  return {
    displayFirstName: formData.displayFirstName.trim(),
    displayLastName: formData.displayLastName.trim(),
    personalInfo: {
      legalFirstName: formData.legalFirstName.trim(),
      legalLastName: formData.legalLastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip: formData.zip.trim(),
        country: formData.country.trim(),
      },
    },
    ...(formData.isMinor ? {
      guardian: {
        firstName: formData.guardianFirstName.trim(),
        lastName: formData.guardianLastName.trim(),
      },
    } : {}),
    profileComplete: true,
  }
}

function profileToFormData(profile: MemberProfileDTO | null): ProfileFormData {
  if (!profile) return INITIAL_FORM_DATA
  return {
    displayFirstName: profile.displayFirstName || '',
    displayLastName: profile.displayLastName || '',
    legalFirstName: profile.personalInfo?.legalFirstName || '',
    legalLastName: profile.personalInfo?.legalLastName || '',
    email: profile.personalInfo?.email || '',
    phone: profile.personalInfo?.phone || '',
    dateOfBirth: profile.personalInfo?.dateOfBirth?.slice(0, 10) || '',
    street: profile.personalInfo?.address?.street || '',
    city: profile.personalInfo?.address?.city || '',
    state: profile.personalInfo?.address?.state || '',
    zip: profile.personalInfo?.address?.zip || '',
    country: profile.personalInfo?.address?.country || 'USA',
    isMinor: !!profile.guardian,
    guardianFirstName: profile.guardian?.firstName || '',
    guardianLastName: profile.guardian?.lastName || '',
  }
}

type FormMode = 'guest' | 'authenticated' | 'edit'

interface UnifiedProfileFormProps {
  mode: FormMode
  existingProfile?: MemberProfileDTO | null
  onProfileCreated?: (profile: MemberProfileDTO) => void
  onSaved?: () => void
  submitLabel?: string
}

export function UnifiedProfileForm({
  mode,
  existingProfile = null,
  onProfileCreated,
  onSaved,
  submitLabel,
}: Readonly<UnifiedProfileFormProps>) {
  const { getAccessTokenSilently, user } = useAuth0()
  const { refreshProfile } = useMemberProfile()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState<ProfileFormData>(() => 
    existingProfile ? profileToFormData(existingProfile) : INITIAL_FORM_DATA
  )
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Pre-fill from Auth0 user for authenticated new profiles
  useEffect(() => {
    if (mode === 'authenticated' && !existingProfile && user) {
      setFormData(prev => ({
        ...prev,
        displayFirstName: prev.displayFirstName || user.given_name || user.name?.split(' ')[0] || '',
        displayLastName: prev.displayLastName || user.family_name || user.name?.split(' ').slice(1).join(' ') || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [mode, existingProfile, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleMinorToggle = (isMinor: boolean) => {
    if (isMinor) {
      showToast('Please note: fencers must be 16 years of age or older to participate.', 'warning')
    }
    setFormData(prev => ({ ...prev, isMinor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateProfile(formData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0]
      const el = document.querySelector(`[name="${firstErrorField}"]`)
      if (el) (el as HTMLElement).focus()
      return
    }

    setSaving(true)
    setApiError(null)

    try {
      const payload = buildPayload(formData)
      let response: Response

      if (mode === 'guest') {
        // Guest profile creation - no auth
        response = await fetch(API_ENDPOINTS.MEMBERS.GUEST, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Authenticated create or update
        const token = await getAccessTokenSilently()
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }

        if (mode === 'edit' && existingProfile?._id) {
          response = await fetch('/api/members/me/update', {
            method: 'POST',
            headers,
            body: JSON.stringify({ profileId: existingProfile._id, data: payload }),
          })
        } else {
          response = await fetch('/api/members/me', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          })
        }
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      const data = await response.json()

      if (mode === 'guest') {
        onProfileCreated?.(data.profile)
      } else {
        await refreshProfile()
        onSaved?.()
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getSubmitLabel = () => {
    if (submitLabel) return submitLabel
    if (saving) return mode === 'edit' ? 'Saving...' : 'Creating...'
    if (mode === 'guest') return 'Create Profile & Continue'
    if (mode === 'edit') return 'Save'
    return 'Create Profile'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Minor toggle */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Who is this profile for?</p>
        <div className="flex gap-3">
          {[
            { value: false, label: 'Myself' },
            { value: true, label: 'A minor / dependent (16+)' }
          ].map((opt) => (
            <label
              key={String(opt.value)}
              className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.isMinor === opt.value ? 'border-navy bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="profileFor"
                checked={formData.isMinor === opt.value}
                onChange={() => handleMinorToggle(opt.value)}
              />
              <span className="text-sm font-medium text-gray-800">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Display First Name"
          name="displayFirstName"
          value={formData.displayFirstName}
          onChange={handleChange}
          error={errors.displayFirstName}
        />
        <TextInput
          label="Display Last Name"
          name="displayLastName"
          value={formData.displayLastName}
          onChange={handleChange}
          error={errors.displayLastName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Legal First Name"
          name="legalFirstName"
          value={formData.legalFirstName}
          onChange={handleChange}
          error={errors.legalFirstName}
        />
        <TextInput
          label="Legal Last Name"
          name="legalLastName"
          value={formData.legalLastName}
          onChange={handleChange}
          error={errors.legalLastName}
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextInput
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
      </div>

      <TextInput
        label="Date of Birth"
        type="date"
        name="dateOfBirth"
        value={formData.dateOfBirth}
        onChange={handleChange}
        error={errors.dateOfBirth}
      />

      {/* Guardian (if minor) */}
      {formData.isMinor && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600">Guardian / Parent Information</p>
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Guardian First Name"
              name="guardianFirstName"
              value={formData.guardianFirstName}
              onChange={handleChange}
              error={errors.guardianFirstName}
            />
            <TextInput
              label="Guardian Last Name"
              name="guardianLastName"
              value={formData.guardianLastName}
              onChange={handleChange}
              error={errors.guardianLastName}
            />
          </div>
        </div>
      )}

      {/* Address */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-600">Address</p>
        <TextInput
          label="Street"
          name="street"
          value={formData.street}
          onChange={handleChange}
          error={errors.street}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            error={errors.city}
          />
          <TextInput
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            error={errors.state}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="ZIP"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            error={errors.zip}
          />
          <TextInput
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            error={errors.country}
          />
        </div>
      </div>

      {/* Error display */}
      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{apiError}</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-navy hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {getSubmitLabel()}
      </button>
    </form>
  )
}
