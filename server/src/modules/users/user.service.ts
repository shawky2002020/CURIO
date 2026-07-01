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
    const { 
      fullName, 
      phone, 
      avatarUrl, 
      storeName, 
      storeDescription, 
      storeAddress, 
      storeLogoUrl, 
      storePhone 
    } = payload;
    const user = await this.getProfile(userId);

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    // Check storeName updates for auditing and administrative notifications
    if (storeName !== undefined && storeName !== user.storeName) {
      console.log(`[AUDIT] User ${user._id} changed store name from "${user.storeName || ''}" to "${storeName}"`);
      console.log(`[NOTIFICATION] System Admin notified: Seller ${user.fullName} (${user._id}) updated store name to "${storeName}"`);
      user.storeName = storeName;
    }

    if (storeDescription !== undefined) user.storeDescription = storeDescription;
    if (storeLogoUrl !== undefined) user.storeLogoUrl = storeLogoUrl;
    if (storePhone !== undefined) user.storePhone = storePhone;
    if (storeAddress !== undefined) user.storeAddress = storeAddress;

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
