import React from 'react';
import VerifyMeLoader from './VerifyMeLoader';

/**
 * AuthButton — Primary and secondary action buttons with integrated VerifyMe custom loading state.
 */
export const AuthButton = ({
  children,
  type = 'submit',
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  icon: Icon,
  className = '',
  fullWidth = true,
  ...props
}) => {
  const isPrimary = variant === 'primary';
  const loaderVariant = isPrimary ? 'white' : 'mint';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      className={`auth-btn auth-btn--${variant} ${fullWidth ? 'auth-btn--full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="auth-btn-loading-wrapper">
          <VerifyMeLoader size="sm" variant={loaderVariant} />
          <span className="auth-btn-loading-text">{children}</span>
        </span>
      ) : (
        <span className="auth-btn-content-wrapper">
          {Icon && <Icon size={18} className="auth-btn-icon" aria-hidden="true" />}
          <span>{children}</span>
        </span>
      )}
    </button>
  );
};

export default AuthButton;
