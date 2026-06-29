import { Banner, IBanner } from './banner.model.js';
import { ApiError } from '../../utils/ApiError.js';

class BannerService {
  /**
   * Retrieves active banners for the homepage.
   */
  public async getActiveBanners(): Promise<IBanner[]> {
    return await Banner.find({ status: 'active' }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves all banners for administration.
   */
  public async getAllBanners(query: { page?: number; limit?: number; search?: string }): Promise<{
    banners: IBanner[];
    total: number;
    pages: number;
    page: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const { search } = query;

    const filter: any = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const [banners, total] = await Promise.all([
      Banner.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Banner.countDocuments(filter),
    ]);

    return {
      banners,
      total,
      pages: Math.ceil(total / limit),
      page,
    };
  }

  /**
   * Creates a new banner.
   */
  public async createBanner(payload: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    status?: 'active' | 'inactive';
  }): Promise<IBanner> {
    const banner = new Banner(payload);
    await banner.save();
    return banner;
  }

  /**
   * Updates an existing banner.
   */
  public async updateBanner(
    id: string,
    payload: {
      title?: string;
      subtitle?: string;
      imageUrl?: string;
      linkUrl?: string;
      status?: 'active' | 'inactive';
    }
  ): Promise<IBanner> {
    const banner = await Banner.findById(id);
    if (!banner) {
      throw new ApiError(404, 'Banner not found.', 'NOT_FOUND');
    }

    if (payload.title !== undefined) banner.title = payload.title;
    if (payload.subtitle !== undefined) banner.subtitle = payload.subtitle;
    if (payload.imageUrl !== undefined) banner.imageUrl = payload.imageUrl;
    if (payload.linkUrl !== undefined) banner.linkUrl = payload.linkUrl;
    if (payload.status !== undefined) banner.status = payload.status;

    await banner.save();
    return banner;
  }

  /**
   * Deletes a banner.
   */
  public async deleteBanner(id: string): Promise<void> {
    const banner = await Banner.findById(id);
    if (!banner) {
      throw new ApiError(404, 'Banner not found.', 'NOT_FOUND');
    }
    await banner.deleteOne();
  }
}

export const bannerService = new BannerService();
export default bannerService;
