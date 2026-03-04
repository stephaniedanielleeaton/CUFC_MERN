import React from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = "navy" | "medium-pink" | "transparent" | "white"

interface SquareButtonProps {
  href?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  variant?: ButtonVariant
}

export const SquareButton: React.FC<SquareButtonProps> = ({ 
  href, 
  children, 
  className = "", 
  style, 
  onClick, 
  type = "button",
  disabled = false,
  variant = "transparent"
}) => {
  const baseClasses = "inline-flex items-center justify-center px-8 py-2 font-semibold text-lg border-2 rounded-none shadow-md transition focus:outline-none focus:ring-2 tracking-widest"
  
  const variantClasses = {
    navy: "bg-navy text-white border-navy hover:bg-navy/90 hover:text-white focus:ring-navy focus:ring-offset-2",
    "medium-pink": "bg-medium-pink text-white border-medium-pink hover:bg-medium-pink/90 hover:text-white focus:ring-medium-pink focus:ring-offset-2",
    transparent: "bg-transparent text-white border-white hover:bg-white/10 hover:text-white hover:border-white focus:ring-white focus:ring-offset-2",
    white: "bg-white text-navy border-navy hover:bg-gray-100 hover:text-navy focus:ring-navy focus:ring-offset-2"
  }
  
  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`.trim()
  const baseStyle = { minWidth: 120, height: 48, ...style }
  
  if (href && !disabled) {
    return (
      <Link
        to={href}
        className={finalClasses}
        style={baseStyle}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {children}
      </Link>
    )
  }
  
  return (
    <button
      type={type}
      className={finalClasses}
      style={baseStyle}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
