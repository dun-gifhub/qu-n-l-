import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface EducationInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}

export const EducationInput = forwardRef<HTMLInputElement, EducationInputProps>(
  ({ label, error, helperText, icon, rightElement, required, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[var(--text-secondary)]"
          >
            {label}
            {required && <span className="text-[var(--danger)] ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none flex items-center justify-center w-4 h-4">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full h-10 bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-normal rounded-[var(--radius-control)] border transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
              icon ? 'pl-10' : 'pl-3'
            } ${rightElement ? 'pr-10' : 'pr-3'} focus:outline-none ${
              error
                ? 'border-[var(--danger)] focus:ring-2 focus:ring-[var(--danger-soft)]'
                : 'border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]'
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center text-[var(--text-muted)]">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-[var(--danger)] flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

EducationInput.displayName = 'EducationInput';
