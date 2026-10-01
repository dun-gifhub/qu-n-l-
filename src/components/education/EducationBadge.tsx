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
  variant = 'primary',
  className = '',
  icon,
}) => {
  const variantStyles: Record<EducationBadgeVariant, string> = {
    primary: 'bg-[#EAF5FF] text-[#0057B8] border border-[#DCE7F2]',
    accent: 'bg-[#FFF9D6] text-[#8C6B00] border border-[#FFE770]',
    success: 'bg-[#EBFBF0] text-[#16A34A] border border-[#BDECC9]',
    warning: 'bg-[#FFF6E5] text-[#D97706] border border-[#FED7AA]',
    danger: 'bg-[#FEECEC] text-[#DC2626] border border-[#FECACA]',
    neutral: 'bg-[#F5F9FD] text-[#60758D] border border-[#DCE7F2]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
