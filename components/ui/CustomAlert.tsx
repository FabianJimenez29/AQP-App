import { Alert, Platform } from 'react-native';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

const getEmojiForType = (type: AlertType): string => {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    case 'confirm':
      return '❓';
    default:
      return '';
  }
};

const getTitleForType = (type: AlertType, customTitle?: string): string => {
  if (customTitle) return customTitle;
  
  switch (type) {
    case 'success':
      return '¡Éxito!';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Advertencia';
    case 'info':
      return 'Información';
    case 'confirm':
      return 'Confirmar';
    default:
      return '';
  }
};

export const showAlert = (options: CustomAlertOptions) => {
  const { title, message, type = 'info', buttons } = options;
  
  const emoji = getEmojiForType(type);
  const finalTitle = getTitleForType(type, title);
  const finalMessage = `${emoji} ${message}`;
  
  const defaultButtons: AlertButton[] = buttons || [
    { text: 'Entendido', style: 'default' }
  ];

  if (Platform.OS === 'web') {
    // Para web, usar alert nativo del navegador
    alert(`${finalTitle}\n\n${message}`);
    if (defaultButtons[0]?.onPress) {
      defaultButtons[0].onPress();
    }
  } else {
    // Para iOS/Android
    Alert.alert(finalTitle, finalMessage, defaultButtons);
  }
};

// Shortcuts para tipos comunes
export const showSuccess = (message: string, onPress?: () => void) => {
  showAlert({
    message,
    type: 'success',
    buttons: onPress ? [{ text: 'Continuar', onPress }] : undefined
  });
};

export const showError = (message: string, details?: string) => {
  const fullMessage = details ? `${message}\n\n${details}` : message;
  showAlert({
    message: fullMessage,
    type: 'error'
  });
};

export const showWarning = (message: string, onPress?: () => void) => {
  showAlert({
    message,
    type: 'warning',
    buttons: onPress ? [{ text: 'Entendido', onPress }] : undefined
  });
};

export const showInfo = (message: string) => {
  showAlert({
    message,
    type: 'info'
  });
};

export const showConfirm = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = 'Confirmar',
  cancelText: string = 'Cancelar'
) => {
  showAlert({
    message,
    type: 'confirm',
    buttons: [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: confirmText,
        style: 'destructive',
        onPress: onConfirm
      }
    ]
  });
};

// Mensajes de error mejorados con sugerencias
export const ErrorMessages = {
  // Autenticación
  AUTH_FAILED: 'No se pudo iniciar sesión. Verifica tu email y contraseña.',
  AUTH_REQUIRED: 'Necesitas iniciar sesión para continuar.',
  AUTH_INVALID_CREDENTIALS: 'Email o contraseña incorrectos. Por favor, verifica tus datos.',
  AUTH_FIELDS_REQUIRED: 'Por favor, ingresa tu email y contraseña para continuar.',
  
  // Red/Conexión
  NETWORK_ERROR: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
  SERVER_ERROR: 'El servidor está experimentando problemas. Intenta nuevamente en unos momentos.',
  TIMEOUT: 'La operación tardó demasiado. Verifica tu conexión e intenta nuevamente.',
  
  // Permisos
  CAMERA_PERMISSION: 'Necesitas dar permiso para usar la cámara.',
  GALLERY_PERMISSION: 'Necesitas dar permiso para acceder a la galería.',
  
  // Formularios
  REQUIRED_FIELDS: 'Por favor, completa todos los campos obligatorios marcados con *',
  INVALID_EMAIL: 'El formato del email no es válido.',
  INVALID_PHONE: 'El formato del teléfono no es válido.',
  
  // Archivos
  FILE_UPLOAD_FAILED: 'No se pudo subir el archivo. Verifica tu conexión e intenta nuevamente.',
  FILE_TOO_LARGE: 'El archivo es demasiado grande. El tamaño máximo es 10MB.',
  INVALID_FILE_TYPE: 'Tipo de archivo no válido.',
  
  // Datos
  LOAD_FAILED: 'No se pudieron cargar los datos. Intenta nuevamente.',
  SAVE_FAILED: 'No se pudieron guardar los cambios. Intenta nuevamente.',
  DELETE_FAILED: 'No se pudo eliminar. Intenta nuevamente.',
  
  // PDF/Compartir
  PDF_DOWNLOAD_FAILED: 'No se pudo descargar el PDF. Verifica tu conexión.',
  PDF_SHARE_FAILED: 'No se pudo compartir el PDF. Intenta nuevamente.',
  WHATSAPP_NOT_INSTALLED: 'WhatsApp no está instalado. Por favor, instálalo para compartir.',
  
  // Genéricos
  UNKNOWN_ERROR: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
  TRY_AGAIN: 'No se pudo completar la operación. Por favor, intenta nuevamente.'
};

// Mensajes de éxito
export const SuccessMessages = {
  LOGIN_SUCCESS: 'Bienvenido de vuelta',
  LOGOUT_SUCCESS: 'Sesión cerrada correctamente',
  
  CREATED: 'Creado correctamente',
  UPDATED: 'Actualizado correctamente',
  DELETED: 'Eliminado correctamente',
  
  REPORT_CREATED: 'Reporte creado exitosamente',
  REPORT_SENT: 'Reporte enviado correctamente',
  
  ORDER_CREATED: 'Orden creada exitosamente',
  ORDER_UPDATED: 'Estado de la orden actualizado',
  
  PROJECT_CREATED: 'Proyecto creado exitosamente',
  PROJECT_UPDATED: 'Proyecto actualizado correctamente',
  
  USER_CREATED: 'Usuario creado correctamente',
  USER_UPDATED: 'Usuario actualizado correctamente',
  
  PRODUCT_CREATED: 'Producto creado correctamente',
  PRODUCT_UPDATED: 'Producto actualizado correctamente',
  
  PHOTO_CAPTURED: 'Foto capturada correctamente',
  FILE_UPLOADED: 'Archivo subido correctamente',
  
  SHARED_SUCCESS: 'Compartido exitosamente'
};
