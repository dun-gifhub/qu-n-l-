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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface-overlay)]">
      <div
        className={`w-full ${maxWidthStyles[maxWidth]} bg-[var(--surface)] rounded-[var(--radius-panel)] border border-[var(--border-strong)] shadow-[var(--shadow-elevated)] overflow-hidden`}
      >
        <div className="flex items-start justify-between p-5 border-b border-[var(--border)] bg-[var(--surface-muted)]/60">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center border border-[var(--border)] transition-colors duration-[var(--duration-fast)] cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
