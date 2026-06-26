import { RegisterPayload, LoginPayload } from './auth.types.js';
import { AuthResponse } from '../../types/auth.types.js';
import { User } from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, comparePassword } from '../../utils/hashPassword.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/generateToken.js';
import { sanitizeUser } from '../../utils/sanitizeUser.js';
import { tokenService } from '../tokens/token.service.js';
import { sendEmail } from '../../services/email.service.js';
import { generateOtp, sendOtpSms } from '../../services/otp.service.js';
import { verifyGoogleCredential } from '../../services/googleOAuth.service.js';
import { env } from '../../config/env.js';
import { TOKEN_EXPIRATIONS } from './auth.constants.js';

export class AuthService {
  /**
   * Public registration logic.
   * Restricts role to customer or seller (never admin).
   */
  public async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { fullName, email, phone, password, role } = payload;

    if (role === 'admin') {
      throw new ApiError(403, 'Administrative registration is forbidden.', 'FORBIDDEN');
    }

    if (!email && !phone) {
      throw new ApiError(400, 'Either email or phone number is required to register.', 'BAD_REQUEST');
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
      emailVerified: false,
      phoneVerified: false,
    });

    const accessToken = generateAccessToken(newUser._id.toString(), newUser.role);
    const refreshToken = generateRefreshToken(newUser._id.toString());

    // 1. Store secure hash of refresh token
    await tokenService.createToken(newUser._id.toString(), 'refresh', 7 * 24 * 60 * 60 * 1000, refreshToken);

    // 2. Dispatches verification email if email is provided
    if (email) {
      const verifyToken = await tokenService.createToken(
        newUser._id.toString(),
        'email_verification',
        TOKEN_EXPIRATIONS.EMAIL_VERIFICATION
      );
      const actionUrl = `${env.CLIENT_URL}/auth/verify-email?token=${verifyToken}`;
      await sendEmail(
        email,
        'Verify Your Premium Account',
        `<p>Welcome, ${fullName}!</p><p>Please click <a href="${actionUrl}">here</a> to verify your account.</p>`
      );
    }

    return {
      user: sanitizeUser(newUser),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Credentials-based Login.
   * Blocks disabled or deleted accounts.
   */
  public async login(payload: LoginPayload): Promise<AuthResponse> {
    const { email, phone, password } = payload;

    if (!email && !phone) {
      throw new ApiError(400, 'Email or phone number is required.', 'BAD_REQUEST');
    }

    if (!password) {
      throw new ApiError(400, 'Password is required.', 'BAD_REQUEST');
    }

    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

    if (!user || !user.passwordHash) {
      throw new ApiError(401, 'Invalid credentials. Please try again.', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'blocked') {
      throw new ApiError(403, 'Your account has been blocked.', 'USER_BLOCKED');
    }

    if (user.status === 'deleted') {
      throw new ApiError(403, 'Your account has been deleted.', 'USER_DELETED');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials. Please try again.', 'INVALID_CREDENTIALS');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Securely hash and store refresh token
    await tokenService.createToken(user._id.toString(), 'refresh', 7 * 24 * 60 * 60 * 1000, refreshToken);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Google OAuth Login/Register service.
   */
  public async googleLogin(credentialToken: string): Promise<AuthResponse> {
    const googleUser = await verifyGoogleCredential(credentialToken);
    
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
      }
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Register new Google user
      user = await User.create({
        fullName: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        provider: 'google',
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
      });
    }

    if (user.status === 'blocked') {
      throw new ApiError(403, 'Your account has been blocked.', 'USER_BLOCKED');
    }

    if (user.status === 'deleted') {
      throw new ApiError(403, 'Your account has been deleted.', 'USER_DELETED');
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    await tokenService.createToken(user._id.toString(), 'refresh', 7 * 24 * 60 * 60 * 1000, refreshToken);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes JWT session tokens with Rotation.
   */
  public async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) {
      throw new ApiError(401, 'Refresh token is missing.', 'UNAUTHORIZED');
    }

    // Consume old token (deletes it)
    const userId = await tokenService.verifyAndConsumeToken(token, 'refresh');

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      throw new ApiError(403, 'Access denied. Account is inactive.', 'FORBIDDEN');
    }

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Persist new rotated refresh token
    await tokenService.createToken(user._id.toString(), 'refresh', 7 * 24 * 60 * 60 * 1000, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revokes refresh token session.
   */
  public async logout(token: string): Promise<void> {
    if (token) {
      const tokenHash = tokenService.hashToken(token);
      await tokenService.verifyAndConsumeToken(token, 'refresh').catch(() => {});
    }
  }

  /**
   * Confirms email verification link token.
   */
  public async verifyEmail(token: string): Promise<void> {
    const userId = await tokenService.verifyAndConsumeToken(token, 'email_verification');
    
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');

    user.emailVerified = true;
    await user.save();
  }

  /**
   * Resends verification link.
   */
  public async resendVerification(email: string): Promise<void> {
    if (!email) throw new ApiError(400, 'Email is required.', 'BAD_REQUEST');

    const user = await User.findOne({ email, status: 'active' });
    if (!user) throw new ApiError(404, 'No active account found with this email.', 'USER_NOT_FOUND');

    if (user.emailVerified) {
      throw new ApiError(400, 'Email address is already verified.', 'ALREADY_VERIFIED');
    }

    // Invalidate old verification tokens
    await tokenService.invalidateUserTokens(user._id.toString(), 'email_verification');

    const verifyToken = await tokenService.createToken(
      user._id.toString(),
      'email_verification',
      TOKEN_EXPIRATIONS.EMAIL_VERIFICATION
    );

    const actionUrl = `${env.CLIENT_URL}/auth/verify-email?token=${verifyToken}`;
    await sendEmail(
      email,
      'Verify Your Premium Account',
      `<p>Hi ${user.fullName},</p><p>Please click <a href="${actionUrl}">here</a> to verify your account.</p>`
    );
  }

  /**
   * Triggers forgot password reset link email.
   */
  public async forgotPassword(email: string): Promise<void> {
    if (!email) throw new ApiError(400, 'Email is required.', 'BAD_REQUEST');

    const user = await User.findOne({ email, status: 'active' });
    if (!user) {
      // Return silent success to prevent email enumeration attacks
      return;
    }

    // Invalidate old reset tokens
    await tokenService.invalidateUserTokens(user._id.toString(), 'password_reset');

    const resetToken = await tokenService.createToken(
      user._id.toString(),
      'password_reset',
      TOKEN_EXPIRATIONS.PASSWORD_RESET
    );

    const actionUrl = `${env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
    await sendEmail(
      email,
      'Reset Your Account Password',
      `<p>Hi ${user.fullName},</p><p>We received a request to reset your password. Click <a href="${actionUrl}">here</a> to choose a new one.</p>`
    );
  }

  /**
   * Consumes reset token and sets new password.
   */
  public async resetPassword(token: string, passwordHashRaw: string): Promise<void> {
    if (!token || !passwordHashRaw) {
      throw new ApiError(400, 'Token and new password are required.', 'BAD_REQUEST');
    }

    const userId = await tokenService.verifyAndConsumeToken(token, 'password_reset');
    
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');

    user.passwordHash = await hashPassword(passwordHashRaw);
    await user.save();

    // Revoke all active sessions upon password reset for security
    await tokenService.invalidateUserTokens(userId, 'refresh');
  }

  /**
   * Authenticated password update.
   */
  public async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user || !user.passwordHash) {
      throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');
    }

    const isMatch = await comparePassword(oldPass, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(400, 'Incorrect old password.', 'INVALID_CREDENTIALS');
    }

    user.passwordHash = await hashPassword(newPass);
    await user.save();

    // Revoke all active sessions
    await tokenService.invalidateUserTokens(userId, 'refresh');
  }

  /**
   * Generates and dispatches a Phone SMS OTP.
   */
  public async requestPhoneOtp(phone: string): Promise<void> {
    if (!phone) throw new ApiError(400, 'Phone number is required.', 'BAD_REQUEST');

    let user = await User.findOne({ phone, status: 'active' });
    if (!user) {
      // For MVP, if phone is unrecognized, we trigger a silent return or let them register.
      // Let's throw a clear error.
      throw new ApiError(404, 'No active account found with this phone number.', 'USER_NOT_FOUND');
    }

    await tokenService.invalidateUserTokens(user._id.toString(), 'phone_otp');

    const otp = generateOtp();
    await tokenService.createToken(user._id.toString(), 'phone_otp', TOKEN_EXPIRATIONS.OTP, otp);
    await sendOtpSms(phone, otp);
  }

  /**
   * Verifies Phone SMS OTP.
   */
  public async verifyPhoneOtp(phone: string, otp: string): Promise<void> {
    if (!phone || !otp) {
      throw new ApiError(400, 'Phone number and OTP code are required.', 'BAD_REQUEST');
    }

    const user = await User.findOne({ phone, status: 'active' });
    if (!user) throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');

    await tokenService.verifyAndConsumeToken(otp, 'phone_otp');

    user.phoneVerified = true;
    await user.save();
  }
}

export const authService = new AuthService();
export default authService;
