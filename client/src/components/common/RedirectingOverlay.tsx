interface Props {
  message: string
  subtext?: string
}

export function RedirectingOverlay({ message, subtext = "This may take a few seconds." }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-medium-pink" />
      <p className="text-sm font-medium text-gray-700">{message}</p>
      {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
  )
}
