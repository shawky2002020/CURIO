/**
 * Password hashing utility functions.
 * In production, these will use 'bcryptjs' or 'bcrypt' to hash and compare passwords.
 */

export const hashPassword = async (password: string): Promise<string> => {
  // TODO: Install bcrypt / bcryptjs and replace with:
  // return await bcrypt.hash(password, 12);
  return `hashed_placeholder_${password}`;
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // TODO: Install bcrypt / bcryptjs and replace with:
  // return await bcrypt.compare(password, hash);
  return `hashed_placeholder_${password}` === hash;
};
