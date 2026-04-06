import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useMemberProfile } from '../../context/ProfileContext'
import { TextInput } from '../common/TextInput'
import SaveButton, { SaveStatus } from '../common/SaveButton'
import type { MemberProfileDTO } from '@cufc/shared'

interface ProfileFormData {
  displayFirstName?: string
  displayLastName?: string
  personalInfo?: {
    legalFirstName?: string
    legalLastName?: string
    email?: string
    phone?: string
    dateOfBirth?: string | null
    address?: {
      street?: string
      city?: string
      state?: string
      zip?: string
      country?: string
    }
  }
  _id?: string
  profileComplete?: boolean
}

interface ProfileFormProps {
  readonly member: MemberProfileDTO
  readonly onSaved?: () => void
}

export default function ProfileForm({ member, onSaved }: ProfileFormProps) {
  const { getAccessTokenSilently } = useAuth0()
  const { updateProfile } = useMemberProfile()
  const [formData, setFormData] = useState<ProfileFormData>(() => ({
    displayFirstName: member.displayFirstName || "",
    displayLastName: member.displayLastName || "",
    personalInfo: {
      legalFirstName: member.personalInfo?.legalFirstName || "",
      legalLastName: member.personalInfo?.legalLastName || "",
      email: member.personalInfo?.email || "",
      phone: member.personalInfo?.phone || "",
      dateOfBirth: member.personalInfo?.dateOfBirth || "",
      address: {
        street: member.personalInfo?.address?.street || "",
        city: member.personalInfo?.address?.city || "",
        state: member.personalInfo?.address?.state || "",
        zip: member.personalInfo?.address?.zip || "",
        country: member.personalInfo?.address?.country || "",
      },
    },
    _id: member._id,
    profileComplete: member.profileComplete,
  }))
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.displayFirstName?.trim()) newErrors.displayFirstName = "Display first name is required."
    if (!formData.displayLastName?.trim()) newErrors.displayLastName = "Display last name is required."
    if (!formData.personalInfo?.legalFirstName?.trim()) newErrors.legalFirstName = "Legal first name is required."
    if (!formData.personalInfo?.legalLastName?.trim()) newErrors.legalLastName = "Legal last name is required."
    if (!formData.personalInfo?.email?.trim()) newErrors.email = "Email is required."
    if (formData.personalInfo?.dateOfBirth?.trim()) {
      const dob = new Date(formData.personalInfo.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
        - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
      if (age < 16) newErrors.dateOfBirth = "Members must be at least 16 years old to register."
    } else {
      newErrors.dateOfBirth = "Date of birth is required."
    }
    const address = formData.personalInfo?.address || {}
    if (!address.street?.trim()) newErrors.street = "Street is required."
    if (!address.city?.trim()) newErrors.city = "City is required."
    if (!address.state?.trim()) newErrors.state = "State is required."
    if (!address.zip?.trim()) newErrors.zip = "ZIP is required."
    if (!address.country?.trim()) newErrors.country = "Country is required."
    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name.startsWith("personalInfo.address.")) {
      const key = name.split(".")[2]
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          address: {
            ...prev.personalInfo?.address,
            [key]: value,
          },
        },
      }))
    } else if (name.startsWith("personalInfo.")) {
      const key = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [key]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0]
      const el = document.querySelector(`[name="${firstErrorField}"]`)
      if (el) (el as HTMLElement).focus()
      return
    }

    let dataToSend = { ...formData, profileComplete: true }
    if (dataToSend.personalInfo?.dateOfBirth) {
      dataToSend = {
        ...dataToSend,
        personalInfo: {
          ...dataToSend.personalInfo,
          dateOfBirth: new Date(dataToSend.personalInfo.dateOfBirth).toISOString(),
        },
      }
    }

    const token = await getAccessTokenSilently()
    const res = await fetch("/api/members/me/update", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ profileId: member._id, data: dataToSend }),
    })

    if (res.ok) {
      const { data } = await res.json()
      updateProfile(data)
      setSaveStatus("saved")
      onSaved?.()
    } else {
      setSaveStatus("error")
    }
    setTimeout(() => setSaveStatus("idle"), 3000)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-md px-6 py-8 space-y-6 border border-gray-100"
    >

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="Display First Name"
          name="displayFirstName"
          value={formData.displayFirstName || ""}
          onChange={handleChange}
          error={errors.displayFirstName}
        />
        <TextInput
          label="Display Last Name"
          name="displayLastName"
          value={formData.displayLastName || ""}
          onChange={handleChange}
          error={errors.displayLastName}
        />
        <TextInput
          label="Legal First Name"
          name="personalInfo.legalFirstName"
          value={formData.personalInfo?.legalFirstName || ""}
          onChange={handleChange}
          error={errors.legalFirstName}
        />
        <TextInput
          label="Legal Last Name"
          name="personalInfo.legalLastName"
          value={formData.personalInfo?.legalLastName || ""}
          onChange={handleChange}
          error={errors.legalLastName}
        />
        <TextInput
          label="Email"
          type="email"
          name="personalInfo.email"
          value={formData.personalInfo?.email || ""}
          onChange={handleChange}
          error={errors.email}
        />
        <TextInput
          label="Phone"
          name="personalInfo.phone"
          value={formData.personalInfo?.phone || ""}
          onChange={handleChange}
        />
        <TextInput
          label="Date of Birth"
          type="date"
          name="personalInfo.dateOfBirth"
          value={formData.personalInfo?.dateOfBirth?.slice(0, 10) || ""}
          onChange={handleChange}
          error={errors.dateOfBirth}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-gray-700 mb-2 tracking-wide uppercase">
          Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Street"
            name="personalInfo.address.street"
            value={formData.personalInfo?.address?.street || ""}
            onChange={handleChange}
            error={errors.street}
          />
          <TextInput
            label="City"
            name="personalInfo.address.city"
            value={formData.personalInfo?.address?.city || ""}
            onChange={handleChange}
            error={errors.city}
          />
          <TextInput
            label="State"
            name="personalInfo.address.state"
            value={formData.personalInfo?.address?.state || ""}
            onChange={handleChange}
            error={errors.state}
          />
          <TextInput
            label="ZIP"
            name="personalInfo.address.zip"
            value={formData.personalInfo?.address?.zip || ""}
            onChange={handleChange}
            error={errors.zip}
          />
          <TextInput
            label="Country"
            name="personalInfo.address.country"
            value={formData.personalInfo?.address?.country || ""}
            onChange={handleChange}
            error={errors.country}
          />
        </div>
      </div>

      <div className="pt-6 flex justify-center">
        <SaveButton saveStatus={saveStatus} label="Save" />
      </div>
    </form>
  )
}
