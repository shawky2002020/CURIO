import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authService } from './auth.service.js';

/**
 * Controller to handle incoming HTTP requests for authentication.
 */
export class AuthController {
  /**
   * Public registration route.
   */
  public register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    
    // In production, refresh token is set as a secure cookie
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
    // TODO: Implement Google authentication verification
    res.status(200).json({
      success: true,
      message: 'Google login successful (mock).',
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
}

export const authController = new AuthController();
export default authController;
