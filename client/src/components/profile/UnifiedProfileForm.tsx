import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useMemberProfile } from '../../context/ProfileContext'
import { TextInput } from '../common/TextInput'
import { API_ENDPOINTS } from '../../constants/api'
import { isAtLeastMinimumAge, MINIMUM_MEMBER_AGE } from '@cufc/shared'
import type { MemberProfileDTO } from '@cufc/shared'

export interface ProfileFormData {
  displayFirstName: string
  displayLastName: string
  pronouns: string
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
}

export type ValidationErrors = Record<string, string>

const INITIAL_FORM_DATA: ProfileFormData = {
  displayFirstName: '',
  displayLastName: '',
  pronouns: '',
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
}

function validateRequired(value: string, fieldName: string): string | undefined {
  return value.trim() ? undefined : `${fieldName} is required.`
}

function validateAge(dateOfBirth: string): string | undefined {
  if (!dateOfBirth.trim()) return 'Date of birth is required.'

  return isAtLeastMinimumAge(dateOfBirth) ? undefined : `Members must be at least ${MINIMUM_MEMBER_AGE} years old.`
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

  return errors
}

function buildPayload(formData: ProfileFormData) {
  return {
    displayFirstName: formData.displayFirstName.trim(),
    displayLastName: formData.displayLastName.trim(),
    pronouns: formData.pronouns.trim(),
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
    profileComplete: true,
  }
}

function profileToFormData(profile: MemberProfileDTO | null): ProfileFormData {
  if (!profile) return INITIAL_FORM_DATA
  return {
    displayFirstName: profile.displayFirstName || '',
    displayLastName: profile.displayLastName || '',
    pronouns: profile.pronouns || '',
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

  const [formData, setFormData] = useState<ProfileFormData>(() => 
    existingProfile ? profileToFormData(existingProfile) : INITIAL_FORM_DATA
  )
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [existingProfileFound, setExistingProfileFound] = useState<MemberProfileDTO | null>(null)

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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile')
      }

      if (mode === 'guest') {
        if (response.status === 200) {
          setExistingProfileFound(data.profile)
        } else {
          onProfileCreated?.(data.profile)
        }
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

  if (existingProfileFound) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800">We found an existing profile for this email address.</p>
          <p className="text-sm text-amber-700">
            Your checkout will continue using your existing profile. To update your details in the future, sign in to your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onProfileCreated?.(existingProfileFound)}
          className="w-full bg-navy hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Continue to Checkout
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <TextInput
        label="Pronouns (optional)"
        name="pronouns"
        value={formData.pronouns}
        onChange={handleChange}
        placeholder="e.g. they/them, she/her, he/him"
      />

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
        disabled={mode === 'edit'}
      />
      {mode === 'edit' && (
        <p className="text-xs text-gray-500">
          Date of birth can't be changed here. Contact the club if it needs to be corrected.
        </p>
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
