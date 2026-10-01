import React from 'react';

interface EducationStatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlightColor?: 'blue' | 'yellow' | 'green' | 'red';
  onClick?: () => void;
}

export const EducationStatCard: React.FC<EducationStatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  highlightColor = 'blue',
  onClick,
}) => {
  const iconThemeStyles = {
    blue: 'bg-[#EAF5FF] text-[#0057B8] border border-[#d2e7fc]',
    yellow: 'bg-[#FFF9D6] text-[#8C6B00] border border-[#FFE770]',
    green: 'bg-[#EBFBF0] text-[#16A34A] border border-[#BDECC9]',
    red: 'bg-[#FEECEC] text-[#DC2626] border border-[#FECACA]',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[22px] border border-[#DCE7F2] p-5 md:p-6 shadow-[0_2px_8px_rgba(23,43,77,0.04)] transition-all duration-200 ${
        onClick ? 'hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,87,184,0.08)] hover:border-[#087FEA]/50 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-semibold text-[#60758D] uppercase tracking-wider">
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#172B4D] tracking-tight tabular-nums">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  trend.isPositive
                    ? 'bg-[#EBFBF0] text-[#16A34A]'
                    : 'bg-[#FEECEC] text-[#DC2626]'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-[#60758D] mt-1 font-medium truncate">
              {subtext}
            </p>
          )}
        </div>

        <div
          className={`w-12 h-12 md:w-14 md:h-14 rounded-[18px] flex items-center justify-center shrink-0 shadow-2xs ${iconThemeStyles[highlightColor]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
