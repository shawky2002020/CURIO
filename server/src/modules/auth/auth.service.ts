import { RegisterPayload, LoginPayload } from './auth.types.js';
import { AuthResponse } from '../../types/auth.types.js';
import { User } from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, comparePassword } from '../../utils/hashPassword.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/generateToken.js';
import { sanitizeUser } from '../../utils/sanitizeUser.js';

/**
 * Service class containing business logic for authentication.
 */
export class AuthService {
  /**
   * Registers a new customer or seller.
   */
  public async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { fullName, email, phone, password, role } = payload;

    if (role === 'admin') {
      throw new ApiError(403, 'Administrative registration is forbidden.', 'FORBIDDEN');
    }

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'A user with this email already exists.', 'EMAIL_ALREADY_EXISTS');
      }
    }

    if (phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        throw new ApiError(400, 'A user with this phone number already exists.', 'PHONE_ALREADY_EXISTS');
      }
    }

    const passwordHash = password ? await hashPassword(password) : undefined;

    const newUser = await User.create({
      fullName,
      email,
      phone,
      passwordHash,
      role,
      provider: 'local',
      status: 'active',
    });

    const accessToken = generateAccessToken(newUser._id.toString(), newUser.role);
    const refreshToken = generateRefreshToken(newUser._id.toString());

    // TODO: Create a refresh token record in database and trigger verification email dispatch.

    return {
      user: sanitizeUser(newUser),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logs in a user using email/password.
   */
  public async login(payload: LoginPayload): Promise<AuthResponse> {
    const { email, password } = payload;
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.', 'BAD_REQUEST');
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'blocked') {
      throw new ApiError(403, 'Your account is blocked.', 'USER_BLOCKED');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes JWT credentials using a valid refresh token.
   */
  public async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    // TODO: Hash and verify the refresh token, rotate it, and return new set.
    return {
      accessToken: 'new_mock_access_token',
      refreshToken: 'new_mock_refresh_token',
    };
  }

  /**
   * Revokes a refresh token session and logs out the user.
   */
  public async logout(token: string): Promise<void> {
    // TODO: Remove the token hash from database.
  }
}

export const authService = new AuthService();
