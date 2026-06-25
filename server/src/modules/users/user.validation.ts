export const updateProfileSchema = {
  body: {
    fullName: 'optional|string|min:2',
    phone: 'optional|string',
    avatarUrl: 'optional|string|url',
  },
};
