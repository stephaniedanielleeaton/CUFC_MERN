import type { IntroEnrollment } from '../../hooks/useIntroEnrollment'

type Props = {
  enrollment: IntroEnrollment
}

export function DashboardIntroEnrollmentCard({ enrollment }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
      <p className="text-sm font-semibold text-gray-800">{enrollment.itemName}</p>
      {enrollment.variationName && (
        <p className="text-sm text-gray-600">{enrollment.variationName}</p>
      )}
    </div>
  )
}
