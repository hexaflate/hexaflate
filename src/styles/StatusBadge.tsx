import React from 'react';

type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'verified' 
  | 'rejected' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'cancelled'
  | 'draft'
  | 'published';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
  customLabel?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; label: string }> = {
  active: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    dot: 'bg-success-500',
    label: 'Aktif'
  },
  inactive: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    dot: 'bg-neutral-500',
    label: 'Tidak Aktif'
  },
  pending: {
    bg: 'bg-warning-100',
    text: 'text-warning-800',
    dot: 'bg-warning-500',
    label: 'Menunggu'
  },
  verified: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    dot: 'bg-success-500',
    label: 'Terverifikasi'
  },
  rejected: {
    bg: 'bg-danger-100',
    text: 'text-danger-800',
    dot: 'bg-danger-500',
    label: 'Ditolak'
  },
  processing: {
    bg: 'bg-info-100',
    text: 'text-info-800',
    dot: 'bg-info-500',
    label: 'Diproses'
  },
  success: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    dot: 'bg-success-500',
    label: 'Berhasil'
  },
  failed: {
    bg: 'bg-danger-100',
    text: 'text-danger-800',
    dot: 'bg-danger-500',
    label: 'Gagal'
  },
  cancelled: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    dot: 'bg-neutral-500',
    label: 'Dibatalkan'
  },
  draft: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    dot: 'bg-neutral-500',
    label: 'Draft'
  },
  published: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    dot: 'bg-success-500',
    label: 'Dipublikasikan'
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  className = '',
  customLabel
}) => {
  const config = statusConfig[status as StatusType] || {
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    dot: 'bg-neutral-500',
    label: status
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1 text-sm';
      default:
        return 'px-2.5 py-0.5 text-xs';
    }
  };

  const getDotSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-1 h-1';
      case 'lg':
        return 'w-2 h-2';
      default:
        return 'w-1.5 h-1.5';
    }
  };

  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${getSizeClasses()} ${className}`}
    >
      {showDot && (
        <span className={`rounded-full mr-1.5 ${config.dot} ${getDotSizeClasses()}`} />
      )}
      {customLabel || config.label}
    </span>
  );
};

export default StatusBadge;
