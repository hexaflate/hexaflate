// Status color mappings for consistent UI throughout the application
export const STATUS_COLORS = {
  // General statuses
  active: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    border: 'border-success-200',
    dot: 'bg-success-500'
  },
  inactive: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    border: 'border-neutral-200',
    dot: 'bg-neutral-500'
  },
  pending: {
    bg: 'bg-warning-100',
    text: 'text-warning-800',
    border: 'border-warning-200',
    dot: 'bg-warning-500'
  },
  
  // Verification statuses
  verified: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    border: 'border-success-200',
    dot: 'bg-success-500'
  },
  unverified: {
    bg: 'bg-warning-100',
    text: 'text-warning-800',
    border: 'border-warning-200',
    dot: 'bg-warning-500'
  },
  rejected: {
    bg: 'bg-danger-100',
    text: 'text-danger-800',
    border: 'border-danger-200',
    dot: 'bg-danger-500'
  },
  
  // Transaction statuses
  success: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    border: 'border-success-200',
    dot: 'bg-success-500'
  },
  failed: {
    bg: 'bg-danger-100',
    text: 'text-danger-800',
    border: 'border-danger-200',
    dot: 'bg-danger-500'
  },
  processing: {
    bg: 'bg-info-100',
    text: 'text-info-800',
    border: 'border-info-200',
    dot: 'bg-info-500'
  },
  cancelled: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    border: 'border-neutral-200',
    dot: 'bg-neutral-500'
  },
  
  // Content statuses
  draft: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    border: 'border-neutral-200',
    dot: 'bg-neutral-500'
  },
  published: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    border: 'border-success-200',
    dot: 'bg-success-500'
  }
} as const;

// Indonesian labels for common statuses
export const STATUS_LABELS = {
  // General
  active: 'Aktif',
  inactive: 'Tidak Aktif',
  pending: 'Menunggu',
  
  // Verification
  verified: 'Terverifikasi',
  unverified: 'Belum Diverifikasi',
  rejected: 'Ditolak',
  'Terverifikasi': 'Terverifikasi',
  'Dalam Proses': 'Dalam Proses',
  'Perbaiki Verifikasi': 'Perbaiki Verifikasi',
  
  // Transaction
  success: 'Berhasil',
  failed: 'Gagal',
  processing: 'Diproses',
  cancelled: 'Dibatalkan',
  
  // Content
  draft: 'Draft',
  published: 'Dipublikasikan',
  
  // Boolean
  true: 'Ya',
  false: 'Tidak',
  yes: 'Ya',
  no: 'Tidak'
} as const;

// Common action labels
export const ACTION_LABELS = {
  save: 'Simpan',
  cancel: 'Batal',
  delete: 'Hapus',
  edit: 'Edit',
  add: 'Tambah',
  create: 'Buat',
  update: 'Perbarui',
  remove: 'Hapus',
  confirm: 'Konfirmasi',
  submit: 'Kirim',
  close: 'Tutup',
  back: 'Kembali',
  next: 'Selanjutnya',
  previous: 'Sebelumnya',
  search: 'Cari',
  filter: 'Filter',
  clear: 'Bersihkan',
  reset: 'Reset',
  refresh: 'Segarkan',
  loading: 'Memuat...',
  saving: 'Menyimpan...',
  deleting: 'Menghapus...',
  processing: 'Memproses...'
} as const;

// Common message templates
export const MESSAGES = {
  confirmDelete: 'Apakah Anda yakin ingin menghapus item ini?',
  confirmAction: 'Apakah Anda yakin ingin melanjutkan?',
  saveSuccess: 'Data berhasil disimpan',
  saveFailed: 'Gagal menyimpan data',
  deleteSuccess: 'Data berhasil dihapus',
  deleteFailed: 'Gagal menghapus data',
  loadFailed: 'Gagal memuat data',
  noData: 'Tidak ada data',
  noResults: 'Tidak ada hasil ditemukan',
  sessionExpired: 'Sesi Anda telah berakhir. Silakan login kembali.',
  networkError: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
  unknownError: 'Terjadi kesalahan. Silakan coba lagi.'
} as const;

// Helper function to get status color classes
export const getStatusClasses = (status: string): string => {
  const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS];
  if (!colors) {
    return `${STATUS_COLORS.inactive.bg} ${STATUS_COLORS.inactive.text}`;
  }
  return `${colors.bg} ${colors.text}`;
};

// Helper function to get status label
export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
};
