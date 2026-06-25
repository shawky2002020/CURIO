import { Schema, model, Document } from 'mongoose';

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
  createdAt: Date;
  updatedAt: Date;
}

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
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ googleId: 1 });

export const User = model<IUser>('User', userSchema);
