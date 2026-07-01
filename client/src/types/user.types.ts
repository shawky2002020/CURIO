export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  storeName?: string;
  storeDescription?: string;
  storeAddress?: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  storeLogoUrl?: string;
  storePhone?: string;
}

