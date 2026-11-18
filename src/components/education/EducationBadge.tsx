import React from 'react';

export type EducationBadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

interface EducationBadgeProps {
  children: React.ReactNode;
  variant?: EducationBadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const EducationBadge: React.FC<EducationBadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  icon,
}) => {
  const variantStyles: Record<EducationBadgeVariant, string> = {
    primary: 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]',
    accent: 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]',
    success: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]',
    warning: 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning-border)]',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)]',
    neutral: 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-medium leading-5 ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
