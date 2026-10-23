import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * Variants: primary | danger | warning | success | ghost | link
 * Sizes: sm | md (default) | lg
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const variantClass = {
    primary: 'btn-primary',
    danger:  'btn-danger',
    warning: 'btn-warning',
    success: 'btn-success',
    ghost:   'btn-ghost',
  }[variant] || 'btn-primary';

  const sizeClass = {
    sm:  'px-2 py-1 text-xs',
    md:  '',
    lg:  'px-5 py-2.5 text-base',
  }[size] || '';

  return (
    <button
      type={type}
      className={`${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-3.5 h-3.5" />}
    </button>
  );
};

export default Button;
