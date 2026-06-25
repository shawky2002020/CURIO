/**
 * Google OAuth Service.
 * In production, this uses 'google-auth-library' to verify ID tokens from the frontend.
 */
export const verifyGoogleToken = async (idToken: string): Promise<{ email: string; name: string; googleId: string }> => {
  // TODO: Implement Google token verification
  return {
    email: 'google_user@example.com',
    name: 'Google User',
    googleId: 'mock_google_id_12345',
  };
};
export default verifyGoogleToken;
