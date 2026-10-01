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
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[20px] md:rounded-[24px] border transition-all duration-200 ${
        accentBorder
          ? 'border-t-4 border-t-[#FFD200] border-x-[#DCE7F2] border-b-[#DCE7F2]'
          : 'border-[#DCE7F2]'
      } shadow-[0_2px_8px_rgba(23,43,77,0.04)] ${
        hoverEffect
          ? 'hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,87,184,0.08)] hover:border-[#087FEA]/40 cursor-pointer'
          : ''
      } ${paddingStyles[padding]} ${className}`}
    >
      {(title || action || icon) && (
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-[#DCE7F2]/60">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-[14px] bg-[#EAF5FF] text-[#0057B8] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-lg font-bold text-[#172B4D] tracking-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#60758D] mt-0.5 truncate">
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
