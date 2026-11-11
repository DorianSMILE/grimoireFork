import { createContext, useCallback, useContext, type ReactNode } from 'react';

export interface ModalOptions {
  title: string;
  body: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  theme?: 'danger' | 'success' | 'info';
  confirmStyle?: string;
  onConfirm?: () => void | Promise<void>;
}

interface ToastContextValue {
  showNotif: (message: string, isError?: boolean) => void;
}

interface ModalContextValue {
  showModal: (options: ModalOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const ModalContext = createContext<ModalContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const showNotif = useCallback((message: string, isError = false) => {
    if (typeof window.showNotif === 'function') {
      window.showNotif(message, isError);
      return;
    }
    let notif = document.getElementById('notif');
    if (!notif) {
      notif = document.createElement('div');
      notif.id = 'notif';
      notif.className = 'notification';
      document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.classList.toggle('is-error', isError);
    notif.classList.add('show');
    window.setTimeout(() => {
      notif?.classList.remove('show');
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showNotif }}>
      {children}
    </ToastContext.Provider>
  );
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const showModal = useCallback(async (options: ModalOptions): Promise<boolean> => {
    if (typeof window.showModal === 'function') {
      return Boolean(await window.showModal(options));
    }
    const modalModuleUrl = '/js/components/modal.js';
    if (!customElements.get('app-modal')) {
      await import(/* @vite-ignore */ modalModuleUrl);
    }
    let modal = document.querySelector('app-modal') as
      | (HTMLElement & { show?: (opts: ModalOptions) => Promise<boolean> })
      | null;
    if (!modal) {
      modal = document.createElement('app-modal');
      document.body.appendChild(modal);
    }
    if (typeof modal.show === 'function') {
      return Boolean(await modal.show(options));
    }
    return window.confirm(options.title);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function UiFeedbackProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ModalProvider>{children}</ModalProvider>
    </ToastProvider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
}
