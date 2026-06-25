import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * File upload middleware stub.
 * In production, this integrates with 'multer' to upload profile pictures or seller documents.
 */
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Install multer and implement upload:
    // const upload = multer({ dest: 'uploads/' }).single(fieldName);
    // upload(req, res, (err) => { ... });
    next();
  };
};
