import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'check_circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'info':
        return 'bg-accent/10 border-accent/30 text-accent';
      default:
        return 'bg-green-500/10 border-green-500/30 text-green-400';
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[100] animate-in slide-in-from-top-2">
      <div className={`${getColors()} border rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm max-w-md flex items-center gap-3`}>
        <span className="material-symbols-outlined text-xl">{getIcon()}</span>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="material-symbols-outlined text-lg hover:opacity-70 transition-opacity"
        >
          close
        </button>
      </div>
    </div>
  );
};

export default Toast;
