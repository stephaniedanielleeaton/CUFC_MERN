import { useState, useRef, FormEvent, useCallback } from 'react'
import type { SendToListRequest } from '@cufc/shared'
import type { BatchProgress } from '../../services/adminEmailService'
import { RecipientListSelector } from './RecipientListSelector'
import { AdditionalEmailsInput } from './AdditionalEmailsInput'
import { TemplateSelector } from './TemplateSelector'
import { SubjectInput } from './SubjectInput'
import { MessageInput } from './MessageInput'
import { SendButton } from './SendButton'
import { SendResultDisplay } from './SendResultDisplay'
import { EmailProgressDisplay } from './EmailProgressDisplay'

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
  readonly recipientLists: EmailList[]
  readonly onSend: (data: SendToListRequest) => Promise<SendEmailResult>
  readonly onSendWithStreaming?: (
    data: SendToListRequest,
    onProgress: (progress: BatchProgress) => void,
    onComplete: (result: SendEmailResult) => void
  ) => Promise<void>
}

type ViewState = 'form' | 'sending' | 'streaming' | 'result'

export function EmailSender({ recipientLists, onSend, onSendWithStreaming }: EmailSenderProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [additionalEmails, setAdditionalEmails] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sendResult, setSendResult] = useState<SendEmailResult | null>(null)
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [template, setTemplate] = useState('Standard CUFC')
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleListChange = useCallback((listId: string) => {
    setSelectedLists((prev) => {
      if (prev.includes(listId)) {
        return prev.filter((id) => id !== listId)
      }
      return [...prev, listId]
    })
  }, [])

  const parseAdditionalEmails = useCallback((): string[] => {
    return additionalEmails
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email !== '')
  }, [additionalEmails])

  const resetForm = useCallback(() => {
    setSubject('')
    setMessage('')
    setSelectedLists([])
    setAdditionalEmails('')
  }, [])

  const scrollToResults = useCallback(() => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [])

  const getViewState = (): ViewState => {
    if (sendResult) return 'result'
    if (progress) return 'streaming'
    if (isLoading) return 'sending'
    return 'form'
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setProgress(null)
    setSendResult(null)

    try {
      const extraEmails = parseAdditionalEmails()
      const requestData = {
        subject,
        message,
        emailListIds: selectedLists,
        additionalEmails: extraEmails,
        template,
      }

      if (onSendWithStreaming) {
        await onSendWithStreaming(
          requestData,
          setProgress,
          (result) => {
            setSendResult(result)
            setProgress(null)
            resetForm()
            scrollToResults()
          }
        )
      } else {
        const result = await onSend(requestData)
        setSendResult(result)
        resetForm()
        scrollToResults()
      }
    } catch (error) {
      console.error('Error sending email:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAnother = useCallback(() => {
    setSendResult(null)
    setProgress(null)
    setIsLoading(false)
  }, [])

  const additionalEmailsRequired = selectedLists.length === 0
  const viewState = getViewState()

  const renderContent = () => {
    switch (viewState) {
      case 'result':
        return sendResult ? (
          <SendResultDisplay
            summary={sendResult.summary}
            blockedEmails={sendResult.blockedEmails}
            failedEmails={sendResult.failedEmails}
            onSendAnother={handleSendAnother}
          />
        ) : null

      case 'streaming':
        return progress ? <EmailProgressDisplay progress={progress} /> : null

      case 'sending':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            <p className="text-gray-600 font-medium">Sending emails...</p>
          </div>
        )

      case 'form':
      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset disabled={isLoading} className={isLoading ? 'opacity-50' : ''}>
              <label htmlFor="recipients-section" className="block text-sm font-medium text-navy mb-2">
                Recipients
              </label>
              <div id="recipients-section" className="space-y-4">
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

            <TemplateSelector
              value={template}
              onChange={setTemplate}
              isLoading={isLoading}
            />

            <SubjectInput
              value={subject}
              onChange={setSubject}
              isLoading={isLoading}
            />

            <MessageInput
              value={message}
              onChange={setMessage}
              isLoading={isLoading}
            />

            <SendButton isLoading={isLoading} />
          </form>
        )
    }
  }

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

      {renderContent()}
    </div>
  )
}
