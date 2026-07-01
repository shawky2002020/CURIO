import { Schema, model, Document, Types } from 'mongoose';
import { ProductStatus, StockStatus } from './product.types.js';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  discount?: number;
  effectivePrice?: number;
  stock: number;
  stockStatus?: StockStatus;
  categoryId: Types.ObjectId;
  images: string[];
  seller: Types.ObjectId;
  status: ProductStatus;
  deletedAt?: Date | null;
  archivedByAdmin?: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 99,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'draft',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    archivedByAdmin: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search on name and description
productSchema.index({ name: 'text', description: 'text' });

// Compound indexes for optimization
productSchema.index({ seller: 1, status: 1, deletedAt: 1 });
productSchema.index({ categoryId: 1, status: 1, deletedAt: 1 });

export const Product = model<IProduct>('Product', productSchema);
