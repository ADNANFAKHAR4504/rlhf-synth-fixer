import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';

describe('S3 Bucket Verification', () => {
  // verify bucket with prefix 'cdktftest-' exists using AWS SDK
  test('S3 Bucket with prefix "cdktftest-" should exist', async () => {
    const s3Client = new S3Client({ region: 'us-east-1' });
    const bucketPrefix = 'cdktftest-';

    const listBucketsCommand = new ListBucketsCommand({});
    const response = await s3Client.send(listBucketsCommand);

    const bucketExists = response.Buckets?.some(bucket =>
      bucket.Name?.startsWith(bucketPrefix)
    );

    expect(bucketExists).toBe(true);
  });
});
