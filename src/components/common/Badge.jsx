import React from 'react';

export const Badge = ({ children, variant = 'neutral', dot = true, className = '', ...props }) => {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
};

export default Badge;
