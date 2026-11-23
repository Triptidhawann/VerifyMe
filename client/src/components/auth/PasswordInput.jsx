import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * PasswordInput — Password field with accessible toggle visibility and optional feedback.
 */
export const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  autoComplete = 'current-password',
  disabled = false,
  error,
  headerAction,
  className = '',
  requirements,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`auth-field ${error ? 'has-error' : ''} ${className}`}>
      <div className="auth-field-label-row">
        <label htmlFor={id} className="auth-field-label">
          {label}
          {required && <span className="auth-field-required" aria-hidden="true">*</span>}
        </label>
        {headerAction}
      </div>

      <div className="auth-input-container">
        <span className="auth-input-leading-icon" aria-hidden="true">
          <Lock size={18} />
        </span>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          className="auth-input with-leading-icon with-trailing-action"
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          className="auth-input-trailing-action"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {requirements && (
        <div className="auth-password-requirements" aria-live="polite">
          {requirements}
        </div>
      )}

      {error && (
        <div id={errorId} className="auth-field-error" role="alert">
          <AlertCircle size={14} className="auth-field-error-icon" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
