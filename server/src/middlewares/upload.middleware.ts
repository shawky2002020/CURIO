import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed.'));
    }
  },
});

/**
 * File upload middleware using Multer in-memory storage.
 */
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, 'File size exceeds the 2MB limit.', 'FILE_TOO_LARGE'));
        }
        return next(new ApiError(400, err.message, 'FILE_UPLOAD_ERROR'));
      }
      next();
    });
  };
};

export const uploadMultiple = (fieldName: string, maxFiles: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxFiles)(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, 'One or more files exceed the 2MB limit.', 'FILE_TOO_LARGE'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApiError(400, `You can upload a maximum of ${maxFiles} images.`, 'TOO_MANY_FILES'));
        }
        return next(new ApiError(400, err.message, 'FILE_UPLOAD_ERROR'));
      }
      next();
    });
  };
};

