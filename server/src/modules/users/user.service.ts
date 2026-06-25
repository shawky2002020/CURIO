import { User, IUser } from './user.model.js';
import { UpdateProfilePayload } from './user.types.js';
import { ApiError } from '../../utils/ApiError.js';

export class UserService {
  /**
   * Retrieves profile by user id.
   */
  public async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user || user.status === 'deleted') {
      throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');
    }
    return user;
  }

  /**
   * Updates profile fields.
   */
  public async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<IUser> {
    const { fullName, phone, avatarUrl } = payload;
    const user = await this.getProfile(userId);

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    await user.save();
    return user;
  }

  /**
   * Performs soft account deletion.
   */
  public async softDeleteProfile(userId: string): Promise<void> {
    const user = await this.getProfile(userId);
    user.status = 'deleted';
    // Anonymize personal identifiers to comply with privacy policies (e.g. GDPR)
    user.email = `deleted_${userId}@example.com`;
    user.phone = `deleted_${userId}`;
    if (user.googleId) user.googleId = `deleted_${userId}`;
    await user.save();
  }
}

export const userService = new UserService();
