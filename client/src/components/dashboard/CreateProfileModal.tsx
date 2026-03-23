import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useMemberProfile } from '../../context/ProfileContext'
import { createMemberProfile } from '../../services/dashboardService'

type Props = Readonly<{
  onClose: () => void
}>

export function CreateProfileModal({ onClose }: Props) {
  const { user, getAccessTokenSilently } = useAuth0()
  const { refreshProfile } = useMemberProfile()
  const [isMinor, setIsMinor] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [guardianFirstName, setGuardianFirstName] = useState("")
  const [guardianLastName, setGuardianLastName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isMinor && user) {
      setFirstName(user.given_name ?? user.name?.split(" ")[0] ?? "")
      setLastName(user.family_name ?? user.name?.split(" ").slice(1).join(" ") ?? "")
      setEmail(user.email ?? "")
    } else if (isMinor) {
      setFirstName("")
      setLastName("")
      setEmail("")
    }
  }, [isMinor, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.")
      return
    }
    if (isMinor && (!guardianFirstName.trim() || !guardianLastName.trim())) {
      setError("Guardian first and last name are required for a minor.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      await createMemberProfile(token, {
        displayFirstName: firstName.trim(),
        displayLastName: lastName.trim(),
        ...(email.trim() ? { personalInfo: { email: email.trim() } } : {}),
        ...(isMinor ? { guardian: { firstName: guardianFirstName.trim(), lastName: guardianLastName.trim() } } : {}),
      })
      await refreshProfile()
      onClose()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Create a profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Who is this profile for?</p>
          <div className="flex gap-3">
            {[
              { value: false, label: "Myself" },
              { value: true, label: "A minor / dependent (16+)" },
            ].map((opt) => (
              <label
                key={String(opt.value)}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isMinor === opt.value ? "border-navy bg-light-navy" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="profileFor"
                  checked={isMinor === opt.value}
                  onChange={() => {
                    if (opt.value === true) alert("Please note: fencers must be 16 years of age or older to participate.")
                    setIsMinor(opt.value)
                  }}
                />
                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-medium text-gray-600">{isMinor ? "Minor's name" : "Your name"}</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
              />
            </div>
          </div>

          {!isMinor && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
            />
          )}

          {isMinor && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Guardian / parent name</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={guardianFirstName}
                  onChange={(e) => setGuardianFirstName(e.target.value)}
                  placeholder="First name"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
                />
                <input
                  type="text"
                  value={guardianLastName}
                  onChange={(e) => setGuardianLastName(e.target.value)}
                  placeholder="Last name"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-navy text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
