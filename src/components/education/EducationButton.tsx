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
  pill: _pill = false,
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-[var(--radius-control)] transition-[color,background-color,border-color,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const sizeStyles: Record<EducationButtonSize, string> = {
    sm: 'text-xs px-3 h-8 gap-2',
    md: 'text-sm px-4 h-10 gap-2',
    lg: 'text-sm px-5 h-11 gap-2',
  };

  const variantStyles: Record<EducationButtonVariant, string> = {
    primary:
      'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)]',
    accent:
      'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)]',
    secondary:
      'bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]',
    danger:
      'bg-[var(--danger)] hover:opacity-90 text-[var(--on-accent)]',
    outline:
      'bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border-strong)]',
    ghost:
      'bg-transparent hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>
      )}
    </button>
  );
};
