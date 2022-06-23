import { Storage } from './interfaces';

export const storage = async (options: any, bucketName: string): Promise<Storage> => {
  if (options.url) {
    const { MongoStorage } = await import('./mongodb');
    return new MongoStorage(options, bucketName);
  } else if (options.endPoint || options.endpoint) {
    const { MinioStorage } = await import('./minio');
    if (options.endpoint)
      // Transforms endpoint to endPoint so we can use env var
      options.endPoint = options.endpoint;
    return new MinioStorage(options, bucketName);
  } else {
    const { EmptyStorage } = await import('./empty');
    return new EmptyStorage();
  }
};
