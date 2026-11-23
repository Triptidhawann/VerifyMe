import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * FormField — Accessible, cleanly styled input field with leading icon and error handling.
 */
export const FormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  autoComplete,
  disabled = false,
  error,
  hint,
  headerAction,
  className = '',
  ...props
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

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
        {Icon && (
          <span className="auth-input-leading-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={`auth-input ${Icon ? 'with-leading-icon' : ''}`}
          {...props}
        />
      </div>

      {error ? (
        <div id={errorId} className="auth-field-error" role="alert">
          <AlertCircle size={14} className="auth-field-error-icon" />
          <span>{error}</span>
        </div>
      ) : hint ? (
        <div id={hintId} className="auth-field-hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
};

export default FormField;
