import test from 'ava';
import fs from 'fs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Readable } from 'stream';
import { MongoConnectionOption, MongoStorage } from './mongodb';

const readStream = (stream: Readable, encoding = 'utf8') => {
  stream.setEncoding(encoding);
  return new Promise((resolve, reject) => {
    let data = '';

    stream.on('data', (chunk) => (data += chunk));
    stream.on('end', () => resolve(data));
    stream.on('error', (error) => reject(error));
  });
};

test('mongodb file cycle', async (t) => {
  const mongod = new MongoMemoryServer();
  const options: MongoConnectionOption = {
    url: await mongod.getConnectionString(),
    database: await mongod.getDbName(),
  };
  const bucketName = 'unittest';
  const filename = 'test_file01';
  const filePath = 'tools/version_smudge.sh';
  const meta = {
    foo: 'bar',
  };

  const storage = new MongoStorage(options, bucketName);
  const etag = await storage.putFileObject(filename, filePath, meta);
  t.is(etag, 'done');

  const stat = await storage.objectInfo(filename);
  t.deepEqual(stat, [
    {
      _id: stat[0]._id,
      length: 622,
      chunkSize: 261120,
      uploadDate: stat[0].uploadDate,
      filename: 'test_file01',
      md5: '313fb86d447c55f0cddac89654c28131',
      metadata: { foo: 'bar' },
    },
  ]);

  const data = readStream(await storage.getObject(filename));
  t.is(await data, await readStream(fs.createReadStream(filePath)));

  await storage.deleteObject(filename);
  const stat2 = await storage.objectInfo(filename);
  t.deepEqual(stat2, []);

  mongod.stop();
});

test('mongodb stream cycle', async (t) => {
  const mongod = new MongoMemoryServer();
  const options: MongoConnectionOption = {
    url: await mongod.getConnectionString(),
    database: await mongod.getDbName(),
  };
  const bucketName = 'unittest';
  const filename = 'test_stream01';
  const filePath = 'tools/version_smudge.sh';
  const meta = {
    foo: 'bar',
  };

  const stream = fs.createReadStream(filePath);
  const storage = new MongoStorage(options, bucketName);
  const etag = await storage.putObject(filename, stream, meta);
  t.is(etag, 'done');

  const stat = await storage.objectInfo(filename);
  t.deepEqual(stat, [
    {
      _id: stat[0]._id,
      length: 622,
      chunkSize: 261120,
      uploadDate: stat[0].uploadDate,
      filename: 'test_stream01',
      md5: '313fb86d447c55f0cddac89654c28131',
      metadata: { foo: 'bar' },
    },
  ]);

  const data = readStream(await storage.getObject(filename));
  t.is(await data, await readStream(fs.createReadStream(filePath)));

  await storage.deleteObject(filename);
  const stat2 = await storage.objectInfo(filename);
  t.deepEqual(stat2, []);

  mongod.stop();
});
