/**
 * Error Handling & Recovery Service
 * Comprehensive error management with user-friendly messages and recovery strategies
 */

export type ErrorSeverity = "info" | "warning" | "error" | "critical";
export type ErrorCategory = "network" | "auth" | "validation" | "server" | "unknown";

export interface AppError {
  id: string;
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  stack?: string;
  context?: Record<string, any>;
  recoveryAction?: () => Promise<void>;
}

export interface ErrorLog {
  errors: AppError[];
  lastError?: AppError;
}

const ERROR_LOG_LIMIT = 100;
let errorLog: ErrorLog = { errors: [] };

/**
 * Create app error
 */
export function createError(
  code: string,
  message: string,
  options: {
    userMessage?: string;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    context?: Record<string, any>;
    stack?: string;
  } = {}
): AppError {
  const error: AppError = {
    id: `error_${Date.now()}`,
    code,
    message,
    userMessage: options.userMessage || getDefaultUserMessage(code),
    severity: options.severity || "error",
    category: options.category || "unknown",
    timestamp: new Date(),
    stack: options.stack,
    context: options.context,
  };

  logError(error);
  return error;
}

/**
 * Log error
 */
function logError(error: AppError): void {
  errorLog.errors.push(error);
  errorLog.lastError = error;

  // Keep log size manageable
  if (errorLog.errors.length > ERROR_LOG_LIMIT) {
    errorLog.errors = errorLog.errors.slice(-ERROR_LOG_LIMIT);
  }

  console.error(`[${error.severity.toUpperCase()}] ${error.code}: ${error.message}`, error.context);
}

/**
 * Get default user message for error code
 */
function getDefaultUserMessage(code: string): string {
  const messages: Record<string, string> = {
    NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
    NETWORK_TIMEOUT: "Connection timed out. Please try again.",
    AUTH_FAILED: "Authentication failed. Please log in again.",
    AUTH_EXPIRED: "Your session has expired. Please log in again.",
    VALIDATION_ERROR: "Invalid input. Please check your data.",
    SERVER_ERROR: "Server error. Please try again later.",
    NOT_FOUND: "Resource not found.",
    PERMISSION_DENIED: "You don't have permission to perform this action.",
    RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
    UNKNOWN_ERROR: "Something went wrong. Please try again.",
  };

  return messages[code] || messages.UNKNOWN_ERROR;
}

/**
 * Handle network error
 */
export function handleNetworkError(error: any): AppError {
  if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
    return createError("NETWORK_TIMEOUT", error.message, {
      category: "network",
      severity: "warning",
    });
  }

  return createError("NETWORK_ERROR", error.message, {
    category: "network",
    severity: "warning",
    context: { originalError: error },
  });
}

/**
 * Handle authentication error
 */
export function handleAuthError(error: any): AppError {
  if (error.code === "AUTH_EXPIRED" || error.message.includes("expired")) {
    return createError("AUTH_EXPIRED", error.message, {
      category: "auth",
      severity: "warning",
    });
  }

  return createError("AUTH_FAILED", error.message, {
    category: "auth",
    severity: "error",
  });
}

/**
 * Handle validation error
 */
export function handleValidationError(field: string, message: string): AppError {
  return createError("VALIDATION_ERROR", `${field}: ${message}`, {
    category: "validation",
    severity: "warning",
    context: { field },
  });
}

/**
 * Handle server error
 */
export function handleServerError(status: number, message: string): AppError {
  const severity = status >= 500 ? "critical" : "error";

  return createError("SERVER_ERROR", `HTTP ${status}: ${message}`, {
    category: "server",
    severity,
    context: { status },
  });
}

/**
 * Get error log
 */
export function getErrorLog(): ErrorLog {
  return errorLog;
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  errorLog = { errors: [] };
}

/**
 * Get last error
 */
export function getLastError(): AppError | undefined {
  return errorLog.lastError;
}

/**
 * Get errors by severity
 */
export function getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
  return errorLog.errors.filter((e) => e.severity === severity);
}

/**
 * Get errors by category
 */
export function getErrorsByCategory(category: ErrorCategory): AppError[] {
  return errorLog.errors.filter((e) => e.category === category);
}

/**
 * Export error log
 */
export function exportErrorLog(): string {
  return JSON.stringify(errorLog, null, 2);
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Validate required fields
 */
export function validateRequired(data: Record<string, any>, fields: string[]): AppError[] {
  const errors: AppError[] = [];

  for (const field of fields) {
    if (!data[field]) {
      errors.push(handleValidationError(field, "This field is required"));
    }
  }

  return errors;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; strength: "weak" | "medium" | "strong" } {
  let strength: "weak" | "medium" | "strong" = "weak";

  if (password.length >= 8) strength = "medium";
  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) strength = "strong";

  return { valid: password.length >= 8, strength };
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.warn("Failed to parse JSON:", error);
    return fallback;
  }
}

/**
 * Safe async operation
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  errorHandler?: (error: Error) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error as Error);
    }
    return fallback;
  }
}
