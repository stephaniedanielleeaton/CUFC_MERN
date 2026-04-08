interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

export function LoadingSpinner({ size = 'md', message }: Readonly<LoadingSpinnerProps>) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[200px]">
      <div 
        className={`animate-spin rounded-full border-t-2 border-b-2 border-medium-pink ${sizeClasses[size]}`} 
      />
      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}
