import { Schema, model, Document, Types } from 'mongoose';

export interface IToken extends Document {
  userId: Types.ObjectId;
  type: 'refresh' | 'email_verification' | 'password_reset' | 'phone_otp';
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['refresh', 'email_verification', 'password_reset', 'phone_otp'],
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index to automatically remove expired tokens from DB
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.index({ userId: 1, type: 1 });

export const Token = model<IToken>('Token', tokenSchema);
