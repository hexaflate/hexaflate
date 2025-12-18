import React from 'react';

interface FormGroupProps {
  children: React.ReactNode;
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({
  children,
  label,
  htmlFor,
  error,
  hint,
  required = false,
  className = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={htmlFor} 
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-danger-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
      )}
    </div>
  );
};

export default FormGroup;
