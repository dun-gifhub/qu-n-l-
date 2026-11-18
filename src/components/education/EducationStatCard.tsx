import React from 'react';

interface EducationStatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
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
  trend,
  highlightColor,
  onClick,
}) => {
  const valueTone =
    highlightColor === 'red'
      ? 'text-[var(--danger)]'
      : highlightColor === 'green'
      ? 'text-[var(--success)]'
      : 'text-[var(--text-primary)]';

  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] p-5 shadow-[var(--shadow-card)] transition-[border-color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
        onClick ? 'hover:border-[var(--border-strong)] cursor-pointer' : ''
      }`}
    >
      <p className="text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2.5">
        <span className={`text-2xl font-semibold tabular-nums font-mono ${valueTone}`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium tabular-nums ${
              trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtext && (
        <p className="text-xs text-[var(--text-muted)] mt-1.5 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
