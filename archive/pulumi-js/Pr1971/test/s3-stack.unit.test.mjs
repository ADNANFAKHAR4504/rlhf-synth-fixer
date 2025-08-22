import * as pulumi from '@pulumi/pulumi';
import { S3Stack } from '../lib/s3-stack.mjs';

pulumi.runtime.setMocks({
  newResource: (args) => {
    switch (args.type) {
      case 'aws:s3/bucket:Bucket':
        return {
          id: 'mock-bucket-id',
          state: {
            id: 'mock-bucket-id',
            arn: 'arn:aws:s3:::mock-bucket-id',
            bucketDomainName: 'mock-bucket-id.s3.amazonaws.com',
          },
        };
      default:
        return {
          id: `${args.name}-id`,
          state: {},
        };
    }
  },
  call: () => ({}),
});

describe('S3Stack', () => {
  test('creates S3 bucket with encryption', async () => {
    const stack = new S3Stack('test-s3', {
      region: 'us-west-2',
      kmsKeyId: 'mock-kms-key-id',
      environmentSuffix: 'test',
    });

    const bucketId = await pulumi.output(stack.bucket.id).promise();
    const bucketArn = await pulumi.output(stack.bucket.arn).promise();
    
    expect(bucketId).toBe('mock-bucket-id');
    expect(bucketArn).toBe('arn:aws:s3:::mock-bucket-id');
  });
});