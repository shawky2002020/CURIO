import { Schema, model, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: any;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = model<ISetting>('Setting', settingSchema);
