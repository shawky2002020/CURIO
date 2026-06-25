/**
 * Frontend Global Error Handler.
 * Parses API errors into human-readable messages.
 */
export const parseError = (error: any): string => {
  return error.response?.data?.message || error.message || 'An unexpected error occurred';
};
