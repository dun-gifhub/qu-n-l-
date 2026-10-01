import React, { forwardRef } from 'react';

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
            className="block text-xs md:text-sm font-semibold text-[#172B4D]"
          >
            {label}
            {required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-[#60758D] pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-white text-[#172B4D] placeholder-[#60758D]/60 text-sm font-medium rounded-[14px] border transition-all duration-200 ${
              icon ? 'pl-11' : 'pl-4'
            } ${rightElement ? 'pr-11' : 'pr-4'} py-3 focus:outline-none ${
              error
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 bg-[#FEECEC]/20'
                : 'border-[#DCE7F2] hover:border-[#087FEA]/50 focus:border-[#0057B8] focus:ring-3 focus:ring-[#0057B8]/15'
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center text-[#60758D]">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-semibold text-[#DC2626] flex items-center gap-1 mt-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#60758D] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

EducationInput.displayName = 'EducationInput';
