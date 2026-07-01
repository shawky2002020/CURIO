import { Schema, model, Document } from 'mongoose';

export interface IAddress {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

export interface IUser extends Document {
  fullName: string;
  email?: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  passwordHash?: string;
  avatarUrl?: string;
  role: 'customer' | 'seller' | 'admin';
  provider: 'local' | 'google';
  googleId?: string;
  status: 'active' | 'blocked' | 'deleted';
  lastLoginAt?: Date;
  storeName?: string;
  storeDescription?: string;
  storeAddress?: IAddress;
  storeLogoUrl?: string;
  storePhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    passwordHash: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      default: 'customer',
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'deleted'],
      default: 'active',
    },
    lastLoginAt: {
      type: Date,
    },
    storeName: {
      type: String,
      trim: true,
    },
    storeDescription: {
      type: String,
      trim: true,
    },
    storeAddress: {
      type: addressSchema,
    },
    storeLogoUrl: {
      type: String,
      trim: true,
    },
    storePhone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);



export const User = model<IUser>('User', userSchema);

