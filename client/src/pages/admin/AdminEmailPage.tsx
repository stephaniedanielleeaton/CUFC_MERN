import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import type { EmailList } from '@cufc/shared'
import type { SendToListRequest } from '@cufc/shared'
import { EmailSender, type SendEmailResult } from '../../components/admin/email/EmailSender'
import {
  fetchEmailLists,
  fetchAllMemberEmailsList,
  sendEmailToList,
} from '../../services/adminEmailService'

export default function AdminEmailPage() {
  const { getAccessTokenSilently } = useAuth0()
  const [emailLists, setEmailLists] = useState<EmailList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEmailLists = async () => {
    try {
      const token = await getAccessTokenSilently()
      const [lists, allMembersList] = await Promise.all([
        fetchEmailLists(token),
        fetchAllMemberEmailsList(token),
      ])
      setEmailLists([...lists, allMembersList])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching email lists:', err)
      setError('Failed to load email lists')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmailLists()
  }, [getAccessTokenSilently])

  const handleSendEmail = async (emailData: SendToListRequest): Promise<SendEmailResult> => {
    const token = await getAccessTokenSilently()
    return sendEmailToList(token, emailData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
        <span className="ml-3 text-gray-600">Loading email lists...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <EmailSender recipientLists={emailLists} onSend={handleSendEmail} />
    </div>
  )
}
