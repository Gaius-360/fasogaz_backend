// ==========================================
// FICHIER: src/components/common/ToastContainer.jsx
// ==========================================
import React from 'react';
import Toast from './Toast';
import useToastStore from '../../store/toastStore';

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
