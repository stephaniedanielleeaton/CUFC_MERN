type UserAvatarProps = {
  picture?: string
  alt: string
  size?: number
  className?: string
}

export function UserAvatar({ picture, alt, size = 40, className = "" }: UserAvatarProps) {
  if (picture) {
    return (
      <img
        src={picture}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full ${className}`}
      />
    )
  }
  return (
    <span
      className={`rounded-full bg-gray-200 border block ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
