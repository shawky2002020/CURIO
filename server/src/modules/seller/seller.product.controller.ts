import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sellerProductService } from './seller.product.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { uploadFileBuffer } from '../../services/storage.service.js';

export class SellerProductController {
  /**
   * GET /api/seller/products
   */
  public listProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sellerId = (req.user as any)._id.toString();
    const { search, categoryId, status, stockStatus, page, limit } = req.query;

    const data = await sellerProductService.getSellerProducts(
      sellerId,
      {
        search: search as string,
        categoryId: categoryId as string,
        status: status as string,
        stockStatus: stockStatus as string,
      },
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );

    res.status(200).json({
      success: true,
      message: 'Seller products retrieved.',
      data,
    });
  });

  /**
   * POST /api/seller/products
   */
  public createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sellerId = (req.user as any)._id.toString();
    const product = await sellerProductService.createProduct(sellerId, req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  });

  /**
   * PUT /api/seller/products/:id
   */
  public updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const sellerId = (req.user as any)._id.toString();
    const product = await sellerProductService.updateProduct(id, sellerId, req.body);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    });
  });

  /**
   * PATCH /api/seller/products/:id/stock
   */
  public updateStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const sellerId = (req.user as any)._id.toString();
    const { stock } = req.body;

    if (stock === undefined) {
      throw new ApiError(400, 'Stock is required.', 'VALIDATION_ERROR');
    }

    const data = await sellerProductService.updateStock(id, sellerId, Number(stock));

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully.',
      data,
    });
  });

  /**
   * DELETE /api/seller/products/:id
   */
  public deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const sellerId = (req.user as any)._id.toString();

    await sellerProductService.softDelete(id, sellerId);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  });

  /**
   * POST /api/seller/products/:id/images
   */
  public uploadImages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const sellerId = (req.user as any)._id.toString();
    
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new ApiError(400, 'No files uploaded.', 'NO_FILES_UPLOADED');
    }

    const uploadPromises = files.map((file) =>
      uploadFileBuffer(file.buffer, 'product_images')
    );
    const urls = await Promise.all(uploadPromises);

    const data = await sellerProductService.uploadImages(id, sellerId, urls);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully.',
      data,
    });
  });
}

export const sellerProductController = new SellerProductController();
export default sellerProductController;
