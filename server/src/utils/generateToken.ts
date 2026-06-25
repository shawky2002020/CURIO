/**
 * Token generation utility functions.
 * In production, these will use 'jsonwebtoken' (jwt) to sign access and refresh tokens.
 */

export const generateAccessToken = (userId: string, role: string): string => {
  // TODO: Install jsonwebtoken and @types/jsonwebtoken, and replace with:
  // return jwt.sign({ sub: userId, role }, process.env.JWT_ACCESS_SECRET!, {
  //   expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  // });
  return `mock_access_token_for_${userId}_role_${role}`;
};

export const generateRefreshToken = (userId: string): string => {
  // TODO: Install jsonwebtoken and @types/jsonwebtoken, and replace with:
  // return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET!, {
  //   expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // });
  return `mock_refresh_token_for_${userId}`;
};
