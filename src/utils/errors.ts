/**
 * Custom application error class
 * Extends the built-in Error class with additional properties
 */
export class AppError extends Error {
    public code: string;
    public details?: any;
  
    constructor(message: string, code: string = 'app_error', details?: any) {
      super(message);
      this.name = 'AppError';
      this.code = code;
      this.details = details;
  
      // This is necessary for proper instanceof checks in TypeScript with custom Error classes
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }
  
  /**
   * Create an authentication error
   * @param message Error message
   * @param details Additional details
   */
  export function createAuthError(message: string, details?: any): AppError {
    return new AppError(message, 'auth_error', details);
  }
  
  /**
   * Create a network error
   * @param message Error message
   * @param details Additional details
   */
  export function createNetworkError(message: string, details?: any): AppError {
    return new AppError(message, 'network_error', details);
  }