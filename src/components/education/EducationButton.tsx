import React from 'react';

export type EducationButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type EducationButtonSize = 'sm' | 'md' | 'lg';

interface EducationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: EducationButtonVariant;
  size?: EducationButtonSize;
  pill?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const EducationButton: React.FC<EducationButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles: Record<EducationButtonSize, string> = {
    sm: 'text-xs px-3.5 py-2 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const roundedStyles = pill ? 'rounded-full' : 'rounded-[14px]';

  const variantStyles: Record<EducationButtonVariant, string> = {
    primary: 'bg-[#0057B8] hover:bg-[#003B7A] text-white shadow-xs hover:shadow-md hover:shadow-[#0057B8]/20',
    accent: 'bg-[#FFD200] hover:bg-[#F5B800] text-[#172B4D] shadow-xs hover:shadow-md hover:shadow-[#FFD200]/30',
    secondary: 'bg-[#EAF5FF] hover:bg-[#d6ecff] text-[#0057B8]',
    danger: 'bg-[#DC2626] hover:bg-[#b91c1c] text-white shadow-xs',
    outline: 'bg-white hover:bg-[#F5F9FD] text-[#172B4D] border border-[#DCE7F2] hover:border-[#0057B8]/40 shadow-2xs',
    ghost: 'bg-transparent hover:bg-[#EAF5FF] text-[#0057B8]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${roundedStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
