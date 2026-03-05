import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import type { MemberProfileDTO, Transaction, AttendanceRecord } from '@cufc/shared'
import { TextInput } from '../../common/TextInput'
import SaveButton, { SaveStatus } from '../../common/SaveButton'

type Props = {
  member: MemberProfileDTO
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
  saveStatus?: SaveStatus
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h4 className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
        {title}
      </h4>
      {children}
    </section>
  )
}

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between text-sm">
      <span className="text-gray-800">{label}</span>
      <span className="relative inline-flex h-6 w-11 items-center">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-blue-600 transition-colors"></span>
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow peer-checked:translate-x-5 transition-transform"></span>
      </span>
    </label>
  )
}

function Dropdown({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-800">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function formatMoney(amount?: number, currency?: string) {
  if (amount == null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  }).format(Number(amount) / 100)
}

export default function MemberDetailsInline({ member, onSubmit, onDelete, saveStatus = "idle" }: Props) {
  const { getAccessTokenSilently } = useAuth0()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [txLoading, setTxLoading] = useState(false)
  const [showAttendance, setShowAttendance] = useState(false)
  const [attendance, setAttendance] = useState<AttendanceRecord[] | null>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  const handleLoadTransactions = async () => {
    if (showTransactions) { setShowTransactions(false); return }
    setShowTransactions(true)
    if (transactions !== null) return
    setTxLoading(true)
    try {
      const token = await getAccessTokenSilently()
      const res = await fetch(`/api/admin/members/${member._id}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTransactions(data.transactions ?? [])
    } catch {
      setTransactions([])
    } finally {
      setTxLoading(false)
    }
  }

  const handleLoadAttendance = async () => {
    if (showAttendance) { setShowAttendance(false); return }
    setShowAttendance(true)
    if (attendance !== null) return
    setAttendanceLoading(true)
    try {
      const token = await getAccessTokenSilently()
      const res = await fetch(`/api/admin/members/${member._id}/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAttendance(data.attendance ?? [])
    } catch {
      setAttendance([])
    } finally {
      setAttendanceLoading(false)
    }
  }

  const address = member.personalInfo?.address
  const dobForInput = member.personalInfo?.dateOfBirth
    ? new Date(member.personalInfo.dateOfBirth).toISOString().slice(0, 10)
    : ""

  return (
    <form onSubmit={onSubmit} className="pb-5 w-full">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden w-full">
        <div className="p-4 sm:p-6 space-y-8">
          <Section title="Display">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="Display First Name" name="displayFirstName" defaultValue={member.displayFirstName ?? ""} />
              <TextInput label="Display Last Name" name="displayLastName" defaultValue={member.displayLastName ?? ""} />
            </div>
          </Section>

          <hr className="border-gray-100" />

          <Section title="Personal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="Legal First Name" name="legalFirstName" defaultValue={member.personalInfo?.legalFirstName ?? ""} />
              <TextInput label="Legal Last Name" name="legalLastName" defaultValue={member.personalInfo?.legalLastName ?? ""} />
              <TextInput label="Email" name="email" type="email" defaultValue={member.personalInfo?.email ?? ""} />
              <TextInput label="Phone" name="phone" defaultValue={member.personalInfo?.phone ?? ""} />
              <TextInput label="Date of Birth" name="dateOfBirth" type="date" defaultValue={dobForInput} />
            </div>
          </Section>

          <hr className="border-gray-100" />

          <Section title="Address">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="Street" name="street" defaultValue={address?.street ?? ""} />
              <TextInput label="City" name="city" defaultValue={address?.city ?? ""} />
              <TextInput label="State" name="state" defaultValue={address?.state ?? ""} />
              <TextInput label="ZIP" name="zip" defaultValue={address?.zip ?? ""} />
              <TextInput label="Country" name="country" defaultValue={address?.country ?? ""} />
            </div>
          </Section>

          <hr className="border-gray-100" />

          <Section title="Guardian">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="First Name" name="guardian.firstName" defaultValue={member.guardian?.firstName ?? ""} />
              <TextInput label="Last Name" name="guardian.lastName" defaultValue={member.guardian?.lastName ?? ""} />
            </div>
          </Section>

          <hr className="border-gray-100" />

          <Section title="Status & Flags">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Toggle label="Profile complete" name="profileComplete" defaultChecked={member.profileComplete ?? false} />
                <Toggle label="Waiver on file" name="isWaiverOnFile" defaultChecked={member.isWaiverOnFile ?? false} />
                <Toggle label="Payment waived" name="isPaymentWaived" defaultChecked={member.isPaymentWaived ?? false} />
                <Toggle label="Archived" name="isArchived" defaultChecked={member.isArchived ?? false} />
              </div>
              <div className="space-y-4">
                <Dropdown
                  label="Member Status"
                  name="memberStatus"
                  defaultValue={member.memberStatus ?? "New"}
                  options={[
                    { value: "New", label: "New" },
                    { value: "Full", label: "Full" },
                  ]}
                />
                <TextInput label="Square Customer ID" name="squareCustomerId" defaultValue={member.squareCustomerId ?? ""} />
              </div>
            </div>
          </Section>

          <hr className="border-gray-100" />

          <Section title="Recent Transactions">
            <button
              type="button"
              onClick={handleLoadTransactions}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showTransactions ? "Hide transactions" : "View last 3 months"}
            </button>
            {showTransactions && (
              <div className="mt-3 space-y-2">
                {txLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    Loading transactions…
                  </div>
                ) : transactions?.length === 0 ? (
                  <p className="text-sm text-gray-500">No transactions found in the last 3 months.</p>
                ) : (
                  transactions?.map((tx) => (
                    <div key={tx.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          {formatMoney(tx.totalMoney?.amount, tx.totalMoney?.currency)}
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {tx.lineItems.map((li, i) => (
                          <li key={i} className="text-sm text-gray-800">
                            {li.name}{li.variationName ? ` — ${li.variationName}` : ""}
                            <span className="text-gray-500 ml-1">×{li.quantity}</span>
                            <span className="float-right text-gray-600 text-xs">
                              {formatMoney(li.totalMoney?.amount, li.totalMoney?.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            )}
          </Section>

          <hr className="border-gray-100" />

          <Section title="Attendance History">
            <button
              type="button"
              onClick={handleLoadAttendance}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showAttendance ? "Hide attendance" : "View last 100 check-ins"}
            </button>
            {showAttendance && (
              <div className="mt-3 space-y-2">
                {attendanceLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    Loading attendance…
                  </div>
                ) : attendance?.length === 0 ? (
                  <p className="text-sm text-gray-500">No attendance records found.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {attendance?.map((record) => (
                      <div key={record.id} className="flex items-center justify-between py-2 px-3 rounded bg-gray-50 text-sm">
                        <span className="text-gray-800">
                          {new Date(record.timestamp).toLocaleDateString("en-US", { 
                            year: "numeric", 
                            month: "short", 
                            day: "numeric",
                            weekday: "short"
                          })}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(record.timestamp).toLocaleTimeString("en-US", { 
                            hour: "numeric", 
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          <hr className="border-gray-100" />

          <Section title="Notes">
            <div className="space-y-1">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-800 tracking-wide">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                defaultValue={member.notes ?? ""}
                rows={5}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                placeholder="Notes…"
              />
            </div>
          </Section>
        </div>

        <div className="px-4 sm:px-6 pb-5 flex items-center justify-between">
          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Delete this member?</span>
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete member
              </button>
            )
          )}
          <SaveButton saveStatus={saveStatus} />
        </div>
      </div>
    </form>
  )
}
