import { createContext, useContext, useState } from 'react';
import './Modal.css';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info' | 'success' | 'error' | 'confirm'
    onConfirm: null,
    onCancel: null
  });

  const showAlert = (title, message, type = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: null,
      onCancel: null
    });
  };

  const showConfirm = (title, message, onConfirm, onCancel = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (onCancel) onCancel();
      }
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, closeModal }}>
      {children}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={modal.type !== 'confirm' ? closeModal : undefined}>
          <div className={`modal-container modal-${modal.type}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.title}</h3>
              {modal.type !== 'confirm' && (
                <button className="modal-close-btn" onClick={closeModal} aria-label="Close modal">
                  ✕
                </button>
              )}
            </div>
            <div className="modal-body">
              <p>{modal.message}</p>
            </div>
            <div className="modal-footer">
              {modal.type === 'confirm' ? (
                <>
                  <button className="btn btn-outline modal-cancel" onClick={modal.onCancel}>
                    Cancelar
                  </button>
                  <button className="btn modal-confirm" onClick={modal.onConfirm}>
                    Confirmar
                  </button>
                </>
              ) : (
                <button className="btn modal-ok" onClick={closeModal}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal deve ser usado dentro de um ModalProvider');
  }
  return context;
}
