import React from 'react';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel}></div>
      <div className="relative bg-card border border-subtle rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 shadow-xl">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              confirmVariant === 'danger' 
                ? 'bg-red-500/10 text-red-400' 
                : 'bg-accent/10 text-accent'
            }`}>
              <span className="material-symbols-outlined text-xl">
                {confirmVariant === 'danger' ? 'warning' : 'help'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-subtle text-sm font-medium text-secondary hover:text-primary hover:bg-white/5 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                confirmVariant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-accent hover:bg-indigo-500 text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
