import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authService } from './auth.service.js';

export class AuthController {
  /**
   * Public registration route.
   */
  public register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * Public login route.
   */
  public login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * Google OAuth login route.
   */
  public googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { credentialToken } = req.body;
    const result = await authService.googleLogin(credentialToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Google login successful.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * Token refresh route.
   */
  public refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const result = await authService.refresh(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully.',
      data: {
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * Logout route.
   */
  public logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    await authService.logout(refreshToken);

    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  });

  /**
   * Verify Email route.
   */
  public verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const token = req.query.token as string;
    await authService.verifyEmail(token);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  });

  /**
   * Resend Verification link route.
   */
  public resendVerification = asyncHandler(async (req: Request, res: Response) => {
    await authService.resendVerification(req.body.email);
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully.',
    });
  });

  /**
   * Forgot Password request route.
   */
  public forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been dispatched.',
    });
  });

  /**
   * Reset Password route.
   */
  public resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  });

  /**
   * Change Password route (Authenticated).
   */
  public changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(userId, oldPassword, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  });

  /**
   * Phone OTP request route.
   */
  public requestPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
    await authService.requestPhoneOtp(req.body.phone);
    res.status(200).json({
      success: true,
      message: 'OTP has been dispatched via SMS successfully.',
    });
  });

  /**
   * Phone OTP verification route.
   */
  public verifyPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    await authService.verifyPhoneOtp(phone, otp);
    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully.',
    });
  });
}

export const authController = new AuthController();
export default authController;
