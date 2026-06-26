import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

interface GoogleUserResult {
  email: string;
  name: string;
  googleId: string;
}

/**
 * Google OAuth Service.
 * Verifies the integrity of ID tokens received from the client using Google's tokeninfo API.
 */
export const verifyGoogleCredential = async (credential: string): Promise<GoogleUserResult> => {
  if (!credential) {
    throw new ApiError(400, 'Google credential token is required.', 'BAD_REQUEST');
  }

  // Development bypass to allow testing Google OAuth without credentials or internet
  if (env.NODE_ENV === 'development' && credential === 'mock_google_credential_token') {
    console.log('[Google OAuth] Dev simulation bypass activated.');
    return {
      email: 'curator.test@gmail.com',
      name: 'Curator Test (Google)',
      googleId: 'mock_google_user_id_123456',
    };
  }

  // Check if Google Client ID is configured
  const isGoogleConfigured = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_ID !== 'replace_me';

  if (!isGoogleConfigured) {
    throw new ApiError(
      501,
      'Google OAuth is not configured on the server. Please provide GOOGLE_CLIENT_ID in environmental variables.',
      'OAUTH_NOT_CONFIGURED'
    );
  }

  try {
    // Call Google's token info API to verify the ID Token (JWT)
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    
    if (!response.ok) {
      throw new ApiError(401, 'Google token verification failed.', 'INVALID_CREDENTIALS');
    }

    const payload = await response.json();

    // Verify audience matches our Client ID to prevent token spoofing/reuse attacks
    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw new ApiError(401, 'Google token audience mismatch.', 'INVALID_CREDENTIALS');
    }

    if (!payload.sub || !payload.email || !payload.name) {
      throw new ApiError(401, 'Invalid Google ID token payload.', 'INVALID_CREDENTIALS');
    }

    return {
      email: payload.email,
      name: payload.name,
      googleId: payload.sub,
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Google token verification failed.', 'INVALID_CREDENTIALS');
  }
};

export default verifyGoogleCredential;
