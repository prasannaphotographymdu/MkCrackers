import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-fade-in">
      <div className="bg-white border border-slate-300 rounded-md max-w-sm w-full p-4 shadow-2xl relative text-slate-900">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div
            className={`p-2 rounded-full ${
              variant === 'danger'
                ? 'bg-red-100 text-red-600'
                : variant === 'warning'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>

        <p className="text-slate-600 text-xs mb-4 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors text-xs font-semibold"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded font-bold text-xs text-white shadow-sm transition-all ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
