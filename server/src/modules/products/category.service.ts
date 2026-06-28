import { Category, ICategory } from './category.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class CategoryService {
  /**
   * Returns all categories.
   */
  public async getAll(): Promise<ICategory[]> {
    return Category.find().sort({ name: 1 });
  }

  /**
   * Returns a single category by ID.
   */
  public async getById(id: string): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found.', 'NOT_FOUND');
    }
    return category;
  }

  /**
   * Creates a new category.
   */
  public async create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
  }): Promise<ICategory> {
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new ApiError(409, 'A category with this name already exists.', 'CONFLICT');
    }

    return Category.create({ ...data, slug });
  }

  /**
   * Updates an existing category.
   */
  public async update(
    id: string,
    data: { name?: string; description?: string; imageUrl?: string }
  ): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found.', 'NOT_FOUND');
    }

    if (data.name) {
      category.name = data.name;
      category.slug = data.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }
    if (data.description !== undefined) category.description = data.description;
    if (data.imageUrl !== undefined) category.imageUrl = data.imageUrl;

    await category.save();
    return category;
  }

  /**
   * Deletes a category by ID.
   */
  public async delete(id: string): Promise<void> {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new ApiError(404, 'Category not found.', 'NOT_FOUND');
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
