export const createProductSchema = {
  body: {
    name: 'required|min:2',
    description: 'required|min:10',
    price: 'required',
    stock: 'required',
    categoryId: 'required',
  },
};

export const updateProductSchema = {
  body: {
    name: 'optional|min:2',
    description: 'optional|min:10',
    price: 'optional',
    stock: 'optional',
    categoryId: 'optional',
    status: 'optional|enum:active,draft,archived',
  },
};

export const createCategorySchema = {
  body: {
    name: 'required|min:2',
    description: 'optional',
    imageUrl: 'optional',
  },
};

export const updateCategorySchema = {
  body: {
    name: 'optional|min:2',
    description: 'optional',
    imageUrl: 'optional',
  },
};

export const createReviewSchema = {
  body: {
    rating: 'required',
    comment: 'required|min:3',
  },
};

export const updateReviewSchema = {
  body: {
    rating: 'optional',
    comment: 'optional|min:3',
  },
};
