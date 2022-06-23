import { Readable } from 'stream';

export interface Storage {
  putFileObject(name: string, filePath: string, meta: any): Promise<string>;
  putObject(name: string, stream: Readable, meta: any): Promise<string>;
  getObject(name: string): Promise<Readable>;
  objectInfo(name: string): Promise<any>;
  deleteObject(name: string): Promise<void>;
}
