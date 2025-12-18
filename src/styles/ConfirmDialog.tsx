import React from 'react';
import Modal from './Modal';
import Button from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  variant = 'default',
  isLoading = false
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const getIconBg = () => {
    return variant === 'danger' 
      ? 'bg-gradient-to-br from-danger-100 to-danger-50 text-danger-600'
      : 'bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600';
  };

  const getIcon = () => {
    if (variant === 'danger') {
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`p-4 rounded-2xl mb-4 ${getIconBg()}`}>
          {getIcon()}
        </div>
        <p className="text-neutral-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={isLoading}
            fullWidth
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
