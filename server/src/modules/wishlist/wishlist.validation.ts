export const wishlistParamsSchema = {
  params: {
    productId: 'required|string|hex|len:24', // mongo object id
  },
};
