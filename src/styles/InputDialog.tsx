import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';

export interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title?: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  inputType?: 'text' | 'number' | 'email' | 'password';
  required?: boolean;
  maxLength?: number;
}

const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Input',
  message,
  placeholder = '',
  defaultValue = '',
  confirmText = 'OK',
  cancelText = 'Batal',
  variant = 'default',
  inputType = 'text',
  required = true,
  maxLength
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (required && !value.trim()) return;
    onConfirm(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const isValid = !required || value.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
    >
      {message && (
        <p className="text-neutral-500 mb-4 text-sm">{message}</p>
      )}
      <div className="mb-6">
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all duration-200 hover:border-neutral-300"
        />
      </div>
      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={onClose}
          fullWidth
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={handleConfirm}
          disabled={!isValid}
          fullWidth
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default InputDialog;
