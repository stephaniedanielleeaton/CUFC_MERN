import { useState, useRef, FormEvent } from 'react'
import type { SendToListRequest } from '@cufc/shared'
import { RecipientListSelector } from './RecipientListSelector'
import { AdditionalEmailsInput } from './AdditionalEmailsInput'
import { TemplateSelector } from './TemplateSelector'
import { SubjectInput } from './SubjectInput'
import { MessageInput } from './MessageInput'
import { SendButton } from './SendButton'
import { SendResultDisplay } from './SendResultDisplay'

export interface EmailList {
  id: string
  name: string
  emails: string[]
}

export interface SendEmailResult {
  success: boolean
  message: string
  summary: {
    totalEmails: number
    emailsSent: number
    emailsFailed: number
    emailsBlocked: number
  }
  blockedEmails: string[]
  failedEmails: { email: string; error: string }[]
}

interface EmailSenderProps {
  recipientLists: EmailList[]
  onSend: (data: SendToListRequest) => Promise<SendEmailResult>
}

export function EmailSender({ recipientLists, onSend }: EmailSenderProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [additionalEmails, setAdditionalEmails] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [sendResult, setSendResult] = useState<SendEmailResult | null>(null)
  const [template, setTemplate] = useState('Standard CUFC')
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleListChange = (listId: string) => {
    setSelectedLists((prev) => {
      if (prev.includes(listId)) {
        return prev.filter((id) => id !== listId)
      } else {
        return [...prev, listId]
      }
    })
  }

  const parseAdditionalEmails = (): string[] => {
    return additionalEmails
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email !== '')
  }

  const resetForm = () => {
    setSubject('')
    setMessage('')
    setSelectedLists([])
    setAdditionalEmails('')
  }

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const extraEmails = parseAdditionalEmails()

      const result = await onSend({
        subject,
        message,
        emailListIds: selectedLists,
        additionalEmails: extraEmails,
        template,
      })

      setIsSent(true)
      setSendResult(result)

      resetForm()
      scrollToResults()
    } catch (error) {
      console.error('Error sending email:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAnother = () => {
    setIsSent(false)
    setSendResult(null)
  }

  const additionalEmailsRequired = selectedLists.length === 0

  return (
    <div className="w-full rounded-xl bg-white shadow-md p-6" ref={resultsRef}>
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold text-navy">Send Email</h2>
        <a
          href="https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-mediumPink hover:text-deepRed underline"
        >
          FTC CAN-SPAM Act Compliance Guide
        </a>
      </div>

      {isSent && sendResult ? (
        <SendResultDisplay
          summary={sendResult.summary}
          blockedEmails={sendResult.blockedEmails}
          failedEmails={sendResult.failedEmails}
          onSendAnother={handleSendAnother}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipients Section */}
          <fieldset
            disabled={isLoading}
            className={isLoading ? 'opacity-50' : ''}
          >
            <label className="block text-sm font-medium text-navy mb-2">
              Recipients
            </label>
            <div className="space-y-4">
              <RecipientListSelector
                recipientLists={recipientLists}
                selectedLists={selectedLists}
                onListChange={handleListChange}
                isLoading={isLoading}
              />
              <AdditionalEmailsInput
                value={additionalEmails}
                onChange={setAdditionalEmails}
                isRequired={additionalEmailsRequired}
                isLoading={isLoading}
              />
            </div>
          </fieldset>

          {/* Template Selection */}
          <TemplateSelector
            value={template}
            onChange={setTemplate}
            isLoading={isLoading}
          />

          {/* Subject Input */}
          <SubjectInput
            value={subject}
            onChange={setSubject}
            isLoading={isLoading}
          />

          {/* Message Input */}
          <MessageInput
            value={message}
            onChange={setMessage}
            isLoading={isLoading}
          />

          {/* Submit Button */}
          <SendButton isLoading={isLoading} />
        </form>
      )}
    </div>
  )
}
