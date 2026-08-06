import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
              : toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/50 text-red-100'
              : 'bg-slate-900/90 border-amber-500/50 text-amber-100'
          }`}
        >
          <div className="mr-3 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-amber-400" />}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            {toast.description && <p className="text-xs opacity-90 mt-0.5">{toast.description}</p>}
          </div>
          <button
            onClick={() => onClose(toast.id)}
            className="ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
