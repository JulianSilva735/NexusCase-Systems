/**
 * Security and Configuration Constants for Cases Module
 * Centraliza valores configurables para evitar hardcoding
 */

export const STATS_SECURITY_CONFIG = {
  /**
   * Máximo número de registros que puede devolver el endpoint /stats
   * Previene ataques de denegación de servicio (DoS)
   */
  MAX_STATS_LIMIT: parseInt(process.env.STATS_MAX_LIMIT || '1000', 10),

  /**
   * Límite por defecto si no se especifica
   */
  DEFAULT_STATS_LIMIT: parseInt(process.env.STATS_DEFAULT_LIMIT || '100', 10),

  /**
   * Rango máximo de fechas permitido (en días)
   * Previene consultas muy pesadas en la BD
   */
  MAX_DATE_RANGE_DAYS: parseInt(process.env.MAX_DATE_RANGE_DAYS || '365', 10),

  /**
   * Denominador por defecto para evitar división por cero
   */
  DEFAULT_DENOMINATOR: 1,

  /**
   * Campos sensibles que NO se deben exponer en logs o errores
   */
  SENSITIVE_FIELDS: [
    'clientIdNumber',
    'clientPhone',
    'clientEmail',
    'clientAddress',
    'clientDob',
  ] as const,
};

/**
 * Configuración de upload de archivos
 */
export const FILE_UPLOAD_CONFIG = {
  /**
   * Directorio de destino para uploads
   */
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',

  /**
   * Tamaño máximo de archivo en bytes (5MB por defecto)
   */
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB

  /**
   * Extensiones de archivo permitidas
   */
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],

  /**
   * MIME types permitidos
   */
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

/**
 * Rate limiting para endpoints sensibles
 */
export const RATE_LIMIT_CONFIG = {
  /**
   * Número máximo de requests por ventana de tiempo
   */
  MAX_REQUESTS_PER_WINDOW: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  /**
   * Ventana de tiempo en segundos
   */
  WINDOW_SECONDS: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10),
};
