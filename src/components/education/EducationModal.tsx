import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001D40]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidthStyles[maxWidth]} bg-white rounded-[24px] border border-[#DCE7F2] shadow-[0_20px_50px_rgba(0,59,122,0.2)] overflow-hidden scale-in-95 duration-200`}
      >
        <div className="flex items-start justify-between p-5 md:p-6 border-b border-[#DCE7F2]/70 bg-[#F5F9FD]/60">
          <div>
            <h3 className="text-lg md:text-xl font-extrabold text-[#172B4D] tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#60758D] mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EAF5FF] text-[#60758D] hover:text-[#0057B8] flex items-center justify-center border border-[#DCE7F2] transition cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 md:p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
