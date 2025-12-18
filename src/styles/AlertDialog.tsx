import React from 'react';
import Modal from './Modal';
import Button from './Button';

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title = 'Pemberitahuan',
  message,
  buttonText = 'OK',
  variant = 'default'
}) => {
  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-gradient-to-br from-danger-100 to-danger-50 text-danger-600';
      case 'success':
        return 'bg-gradient-to-br from-success-100 to-success-50 text-success-600';
      case 'warning':
        return 'bg-gradient-to-br from-warning-100 to-warning-50 text-warning-600';
      default:
        return 'bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'default'}
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`p-4 rounded-2xl mb-4 ${getIconBg()}`}>
          {getIcon()}
        </div>
        <p className="text-neutral-600 mb-6 leading-relaxed">{message}</p>
        <Button
          variant={getButtonVariant()}
          onClick={onClose}
          size="md"
          fullWidth
        >
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
};

export default AlertDialog;
