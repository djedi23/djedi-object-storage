# @djedi/object-storage

Unified API for S3/minio/mongodb gridfs


Exemple:

``` typescript
import { storage } from '@djedi/object-storage';

const main = async () => {
  const bucketName = 'buck';
  const filepath = '/tmp/exemple.pdf';
  const filename = 'filename.pdf';
  const meta = {
    foo: 'bar',
  };

  const minioClient = await storage(conf.get('storage:minio'), bucketName);
  console.time('minio');
  const f = await minioClient.putFileObject(filename, filepath, meta);
  console.timeEnd('minio');
  const stat = await minioClient.objectInfo(filename);

  const mongoStore = await storage(conf.get('storage:mongodb'), bucketName);
  console.time('mongo');
  const fm = await mongoStore.putFileObject(filename, filepath, meta);
  console.timeEnd('mongo');
  const mStat = await mongoStore.objectInfo(filename);
};
```

