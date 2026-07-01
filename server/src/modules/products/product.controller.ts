import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { categoryService } from './category.service.js';
import { productService } from './product.service.js';
import { reviewService } from './review.service.js';

export class ProductController {
  // ─── Categories ───────────────────────────────────────────────────────────

  public getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const includeDeleted = req.query.includeDeleted === 'true';
    const categories = await categoryService.getAll(includeDeleted);
    res.status(200).json({ success: true, message: 'Categories retrieved.', data: categories });
  });

  public getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Category retrieved.', data: category });
  });

  public createCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);
    res.status(201).json({ success: true, message: 'Category created.', data: category });
  });

  public updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Category updated.', data: category });
  });

  public deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    await categoryService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted.' });
  });

  public restoreCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.restore(req.params.id);
    res.status(200).json({ success: true, message: 'Category restored.', data: category });
  });

  // ─── Products ─────────────────────────────────────────────────────────────

  public getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const { search, categoryId, minPrice, maxPrice, seller, stockStatus, status, page, limit } = req.query;
    const products = await productService.getAll({
      search: search as string,
      categoryId: categoryId as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      seller: seller as string,
      stockStatus: stockStatus as any,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, message: 'Products retrieved.', data: products });
  });

  public getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Product retrieved.', data: product });
  });

  public createProduct = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = req.user!._id.toString();
    const product = await productService.create(sellerId, req.body);
    res.status(201).json({ success: true, message: 'Product created.', data: product });
  });

  public updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const userRole = req.user!.role;
    const product = await productService.update(req.params.id, userId, userRole, req.body);
    res.status(200).json({ success: true, message: 'Product updated.', data: product });
  });

  public deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const userRole = req.user!.role;
    await productService.delete(req.params.id, userId, userRole);
    res.status(200).json({ success: true, message: 'Product deleted.' });
  });

  // ─── Reviews ──────────────────────────────────────────────────────────────

  public getProductReviews = asyncHandler(async (req: Request, res: Response) => {
    const reviews = await reviewService.getByProduct(req.params.productId);
    res.status(200).json({ success: true, message: 'Reviews retrieved.', data: reviews });
  });

  public createReview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const review = await reviewService.create(req.params.productId, userId, req.body);
    res.status(201).json({ success: true, message: 'Review submitted.', data: review });
  });

  public updateReview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const userRole = req.user!.role;
    const review = await reviewService.update(req.params.reviewId, userId, userRole, req.body);
    res.status(200).json({ success: true, message: 'Review updated.', data: review });
  });

  public deleteReview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const userRole = req.user!.role;
    await reviewService.delete(req.params.reviewId, userId, userRole);
    res.status(200).json({ success: true, message: 'Review deleted.' });
  });
}

export const productController = new ProductController();
export default productController;
