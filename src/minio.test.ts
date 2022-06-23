import conf from '@djedi/configuration';
import test from 'ava';
import fs from 'fs';
import { Readable } from 'stream';
import { MinioStorage } from './minio';

const readStream = (stream: Readable, encoding = 'utf8') => {
  stream.setEncoding(encoding);
  return new Promise((resolve, reject) => {
    let data = '';

    stream.on('data', (chunk) => (data += chunk));
    stream.on('end', () => resolve(data));
    stream.on('error', (error) => reject(error));
  });
};

test('minio file cycle', async (t) => {
  const options = conf.get('storage:minio');
  const bucketName = 'unittest';
  const filename = 'test_file01';
  const filePath = 'tools/version_smudge.sh';
  if (options.endpoint)
    // Transforms endpoint to endPoint so we can use env var
    options.endPoint = options.endpoint;
  const meta = {
    foo: 'bar',
  };

  const storage = new MinioStorage(options, bucketName);
  const etag = await storage.putFileObject(filename, filePath, meta);
  t.regex(etag, /^[0123456789abcdef]+$/);

  const stat = await storage.objectInfo(filename);
  t.deepEqual(stat, {
    etag,
    lastModified: stat.lastModified,
    metaData: { ...meta, 'content-type': 'application/x-sh' },
    size: 622,
  });

  const data = readStream(await storage.getObject(filename));
  t.is(await data, await readStream(fs.createReadStream(filePath)));

  await storage.deleteObject(filename);
  await t.throwsAsync(() => storage.objectInfo(filename), { code: 'NotFound' });
});

test('minio stream cycle', async (t) => {
  const options = conf.get('storage:minio');
  const bucketName = 'unittest';
  const filename = 'test_stream01';
  const filePath = 'tools/version_smudge.sh';
  if (options.endpoint)
    // Transforms endpoint to endPoint so we can use env var
    options.endPoint = options.endpoint;
  const meta = {
    foo: 'bar',
  };

  const stream = fs.createReadStream(filePath);
  const storage = new MinioStorage(options, bucketName);
  const etag = await storage.putObject(filename, stream, meta);
  t.regex(etag, /^[0123456789abcdef]+$/);

  const stat = await storage.objectInfo(filename);
  t.deepEqual(stat, {
    etag,
    lastModified: stat.lastModified,
    metaData: { ...meta, 'content-type': 'application/octet-stream' },
    size: 622,
  });

  const data = readStream(await storage.getObject(filename));
  t.is(await data, await readStream(fs.createReadStream(filePath)));

  await storage.deleteObject(filename);
  await t.throwsAsync(() => storage.objectInfo(filename), { code: 'NotFound' });
});
