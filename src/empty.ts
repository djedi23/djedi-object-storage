import { Readable } from 'stream';
import { Storage } from './interfaces';

export class EmptyStorage implements Storage {
  public constructor() {}
  putFileObject(name: string, filePath: string, meta: any): Promise<string> {
    throw new Error('Method not implemented.');
  }
  putObject(name: string, stream: Readable, meta: any): Promise<string> {
    throw new Error('Method not implemented.');
  }
  getObject(name: string): Promise<Readable> {
    throw new Error('Method not implemented.');
  }
  objectInfo(name: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  deleteObject(name: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
