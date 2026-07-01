import { IAddress } from './user.model.js';

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  storeName?: string;
  storeDescription?: string;
  storeAddress?: IAddress;
  storeLogoUrl?: string;
  storePhone?: string;
}

