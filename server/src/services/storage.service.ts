/**
 * Storage Service.
 * In production, this uploads files to Cloudinary, AWS S3, or Google Cloud Storage.
 */
export const uploadFile = async (filePath: string): Promise<string> => {
  // TODO: Implement cloud upload
  return 'https://example.com/uploads/avatar_mock.png';
};
export default uploadFile;
