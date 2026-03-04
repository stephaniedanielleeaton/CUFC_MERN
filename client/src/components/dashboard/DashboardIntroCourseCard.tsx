import { BookOpen, ChevronRight } from 'lucide-react'

interface DashboardIntroCourseCardProps {
  onEnroll?: () => void
}

export function DashboardIntroCourseCard({ onEnroll }: DashboardIntroCourseCardProps) {
  return (
    <div
      onClick={onEnroll}
      className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-4 flex items-center justify-between shadow-md transition hover:brightness-105 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6" />
        <div className="text-sm font-semibold">Sign Up For An Intro Class</div>
      </div>
      <ChevronRight className="w-5 h-5 text-white" />
    </div>
  )
}
