import type { ReactElement } from 'react'
import { UnsubscribeForm } from '../components/common/UnsubscribeForm'
import { SmallHero } from '../components/common/SmallHero'

export default function UnsubscribePage(): ReactElement {
  return (
    <div className="bg-gray-50">
      <SmallHero pageTitle="Unsubscribe" />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <UnsubscribeForm />
      </div>
    </div>
  )
}
