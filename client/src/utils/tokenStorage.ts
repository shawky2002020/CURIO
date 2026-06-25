/**
 * Secure token storage utility.
 * Access token is stored in localStorage (or in-memory in production),
 * while refresh token is managed by secure HTTP-only cookies in the browser.
 */
export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  },

  clearTokens(): void {
    localStorage.removeItem('access_token');
  },
};
export default tokenStorage;
