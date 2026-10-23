import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal — accessible portal modal with overlay
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   title: string
 *   children: ReactNode
 *   size: 'sm' | 'md' | 'lg' | 'xl'
 *   footer: ReactNode
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    sm:  'max-w-sm',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-4xl',
    full:'max-w-6xl',
  }[size] || 'max-w-lg';

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className={`modal-panel ${sizeClass}`} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded hover:bg-eoc-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
