import { Client as MinioClient, ClientOptions, ItemBucketMetadata } from 'minio';
import { Readable } from 'stream';
import { Storage } from './interfaces';
import { logger } from '@djedi/log';

export class MinioStorage implements Storage {
  private client: MinioClient;
  private bucketName: string;
  private ensureBucket: Promise<void>;
  public constructor(options: ClientOptions, bucketName: string) {
    this.client = new MinioClient(options);
    this.bucketName = bucketName;
    this.ensureBucket = this.getBucket();
  }
  public async getObject(name: string): Promise<Readable> {
    await this.ensureBucket;
    return this.client.getObject(this.bucketName, name) as Promise<Readable>;
  }

  public async putObject(name: string, stream: Readable, meta: ItemBucketMetadata): Promise<string> {
    await this.ensureBucket;
    return this.client.putObject(this.bucketName, name, stream, meta);
  }
  public async putFileObject(name: string, filePath: string, meta: ItemBucketMetadata) {
    await this.ensureBucket;
    return this.client.fPutObject(this.bucketName, name, filePath, meta);
  }

  public async objectInfo(name: string) {
    await this.ensureBucket;
    return this.client.statObject(this.bucketName, name);
  }
  public async deleteObject(name: string): Promise<void> {
    await this.ensureBucket;
    return this.client.removeObject(this.bucketName, name);
  }

  private async getBucket() {
    try {
      if (!(await this.client.bucketExists(this.bucketName))) {
        return await this.client.makeBucket(this.bucketName, 'eu-west-1');
      }
    } catch (e) {
      logger.warn('getBucket', e);
      return;
    }
  }
}
