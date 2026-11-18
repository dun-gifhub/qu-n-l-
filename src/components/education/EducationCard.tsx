import React from 'react';

interface EducationCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  accentBorder?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
}

export const EducationCard: React.FC<EducationCardProps> = ({
  children,
  title,
  subtitle,
  action,
  icon,
  className = '',
  hoverEffect = false,
  accentBorder = false,
  padding = 'md',
  onClick,
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surface)] rounded-[var(--radius-card)] border transition-[border-color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
        accentBorder
          ? 'border-t-2 border-t-[var(--accent)] border-x-[var(--border)] border-b-[var(--border)]'
          : 'border-[var(--border)]'
      } shadow-[var(--shadow-card)] ${
        hoverEffect
          ? 'hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]/30 cursor-pointer'
          : ''
      } ${paddingStyles[padding]} ${className}`}
    >
      {(title || action || icon) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--surface-muted)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
