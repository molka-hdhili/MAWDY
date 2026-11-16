import React from 'react';

export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helpText,
  required = false,
  disabled = false,
  icon: Icon = null,
  className = '',
  ...props
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <span style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }}>
            <Icon size={16} />
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          style={Icon ? { paddingLeft: '2.25rem' } : {}}
          {...props}
        />
      </div>
      {error && <span className="form-error">{error}</span>}
      {helpText && !error && <span className="form-help">{helpText}</span>}
    </div>
  );
};

export default Input;
