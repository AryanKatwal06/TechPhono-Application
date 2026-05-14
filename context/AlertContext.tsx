import React, { createContext, useContext, useCallback, useState } from 'react';
import AlertDialog from '@/components/AlertDialog';

export type AlertType = 'error' | 'success' | 'info' | 'warning';

export interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'destructive' | 'primary';
  }>;
}

interface AlertContextType {
  show: (options: AlertOptions) => void;
  error: (title: string, message: string) => void;
  success: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'destructive' | 'primary';
    }>;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const show = useCallback((options: AlertOptions) => {
    setAlertState({
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      buttons: options.buttons || [{ text: 'OK', onPress: () => {}, style: 'primary' }],
    });
  }, []);

  const dismiss = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  const error = useCallback((title: string, message: string) => {
    show({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', style: 'primary' }],
    });
  }, [show]);

  const success = useCallback((title: string, message: string) => {
    show({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', style: 'primary' }],
    });
  }, [show]);

  const info = useCallback((title: string, message: string) => {
    show({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', style: 'primary' }],
    });
  }, [show]);

  const warning = useCallback((title: string, message: string) => {
    show({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'OK', style: 'primary' }],
    });
  }, [show]);

  const confirm = useCallback(
    (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
      show({
        title,
        message,
        type: 'warning',
        buttons: [
          { text: 'Cancel', onPress: onCancel, style: 'default' },
          { text: 'Confirm', onPress: onConfirm, style: 'destructive' },
        ],
      });
    },
    [show]
  );

  return (
    <AlertContext.Provider value={{ show, error, success, info, warning, confirm }}>
      {children}
      <AlertDialog
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onDismiss={dismiss}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};
