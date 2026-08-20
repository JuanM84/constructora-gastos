import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function NotificationToast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="toast-container">
      <div className={`toast ${isError ? 'error' : ''}`}>
        {isError ? (
          <AlertCircle size={20} color="var(--accent-rose)" />
        ) : (
          <CheckCircle size={20} color="var(--accent-emerald)" />
        )}
        <span>{toast.message}</span>
        <button 
          className="btn-icon-only" 
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', padding: '0.2rem', marginLeft: '0.5rem' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
