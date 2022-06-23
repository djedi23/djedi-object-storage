import conf from '@djedi/configuration';
import { logger } from '@djedi/log';
import fs from 'fs';
import { Db, GridFSBucket, MongoClient } from 'mongodb';
import { Readable } from 'stream';
import { Storage } from './interfaces';

let db: Db | null = null;
let dbs: { [id: string]: Db } = {};
let conns: { [id: string]: MongoClient } = {};

export const mongo = async (
  connectionUrl?: string,
  database?: string,
  options?: any
): Promise<Db> => {
  if (connectionUrl && dbs[connectionUrl]) return dbs[connectionUrl];
  if (!db || connectionUrl) {
    const mongoUrl = connectionUrl || conf.get('mongodb:url') || 'mongodb://localhost';
    logger.debug(`Mongo url: ${mongoUrl}`);
    const mongoclient = await MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (options) options.client = mongoclient;
    const _db = mongoclient.db(database || conf.get('db:database') || 'test');
    if (connectionUrl) {
      dbs[connectionUrl] = _db;
      conns[connectionUrl] = mongoclient;
      return _db;
    } else db = _db;
  }
  return db;
};

export const close = async (connectionUrl: string) => {
  if (conns[connectionUrl]) {
    await conns[connectionUrl].close();
    // tslint:disable-next-line:no-dynamic-delete
    delete dbs[connectionUrl];
    // tslint:disable-next-line:no-dynamic-delete
    delete conns[connectionUrl];
  }
};

export interface MongoConnectionOption {
  url?: string;
  database?: string;
}

export class MongoStorage implements Storage {
  private db: Promise<Db>;
  private bucketName: string;
  private bucket: Promise<GridFSBucket>;
  public constructor(connection: MongoConnectionOption, bucketName: string) {
    this.db = mongo(connection.url, connection.database);
    this.bucketName = bucketName;
    this.bucket = this.getBucket();
  }
  public async getObject(name: string): Promise<Readable> {
    return (await this.bucket).openDownloadStreamByName(name);
  }

  public async putObject(name: string, stream: Readable, metadata: any): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      stream
        .pipe((await this.bucket).openUploadStream(name, { metadata }))
        .on('error', (error) => {
          reject(error);
        })
        .on('finish', () => {
          resolve('done');
        });
    });
  }

  public async putFileObject(name: string, filePath: string, metadata: any) {
    return new Promise<string>(async (resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe((await this.bucket).openUploadStream(name, { metadata }))
        .on('error', (error) => {
          reject(error);
        })
        .on('finish', () => {
          resolve('done');
        });
    });
  }

  public async objectInfo(filename: string) {
    return (await this.bucket).find({ filename }, { sort: { uploadDate: -1 }, limit: 1 }).toArray();
    // return this.db.statObject(this.bucketName, name);
  }
  public async deleteObject(filename: string): Promise<void> {
    return (await this.bucket)
      .find({ filename })
      .forEach(async (doc) => (await this.bucket).delete(doc._id));
  }

  private async getBucket() {
    return new GridFSBucket(await this.db, { bucketName: this.bucketName });
  }
}
