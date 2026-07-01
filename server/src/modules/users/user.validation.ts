export const updateProfileSchema = {
  body: {
    fullName: 'optional|min:2',
    phone: 'optional',
    avatarUrl: 'optional',
    storeName: 'optional|min:3',
    storeDescription: 'optional',
    storeLogoUrl: 'optional',
    storePhone: 'optional',
    'storeAddress.street': 'required',
    'storeAddress.city': 'required',
    'storeAddress.state': 'optional',
    'storeAddress.country': 'required',
    'storeAddress.postalCode': 'required',
  },
};

