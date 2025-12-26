import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { S3Stack } from '../lib/s3-stack';

// Mock Pulumi and AWS
(pulumi as any).runtime = {
  isDryRun: () => true,
  setMocks: () => {},
  registerStackTransformation: () => {},
} as any;

describe('S3Stack', () => {
  let stack: S3Stack;
  const mockBucket = {
    id: pulumi.Output.create('test-bucket-id'),
    bucket: pulumi.Output.create('test-bucket-name'),
    arn: pulumi.Output.create('arn:aws:s3:::test-bucket'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AWS S3 Bucket
    jest.spyOn(aws.s3, 'Bucket').mockImplementation((() => mockBucket) as any);
    jest
      .spyOn(aws.s3, 'BucketVersioning')
      .mockImplementation((() => ({})) as any);
    jest
      .spyOn(aws.s3, 'BucketPublicAccessBlock')
      .mockImplementation((() => ({})) as any);
    jest.spyOn(aws.s3, 'BucketPolicy').mockImplementation((() => ({})) as any);
    jest.spyOn(aws.s3, 'BucketObject').mockImplementation((() => ({})) as any);
  });

  describe('constructor', () => {
    it('should create S3 bucket with correct configuration', () => {
      stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining('tap-app-bucket-test'),
        expect.objectContaining({
          bucket: expect.stringContaining('tap-app-bucket-test-primary'),
          tags: expect.objectContaining({ Environment: 'test' }),
        }),
        expect.any(Object)
      );
    });

    it('should enable versioning on the bucket', () => {
      stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(aws.s3.BucketVersioning).toHaveBeenCalledWith(
        expect.stringContaining('tap-bucket-versioning-test'),
        expect.objectContaining({
          bucket: mockBucket.id,
          versioningConfiguration: {
            status: 'Enabled',
          },
        }),
        expect.any(Object)
      );
    });

    it('should configure public access block settings', () => {
      stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        expect.stringContaining('tap-bucket-pab-test'),
        expect.objectContaining({
          bucket: mockBucket.id,
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        }),
        expect.any(Object)
      );
    });

    it('should create bucket policy for public read access', () => {
      stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(aws.s3.BucketPolicy).toHaveBeenCalledWith(
        expect.stringContaining('tap-bucket-policy-test'),
        expect.objectContaining({
          bucket: mockBucket.id,
        }),
        expect.any(Object)
      );
    });

    it('should upload Lambda function code to S3', () => {
      stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(aws.s3.BucketObject).toHaveBeenCalledWith(
        expect.stringContaining('lambda-code-test'),
        expect.objectContaining({
          bucket: mockBucket.id,
          key: 'lambda-function.zip',
        }),
        expect.any(Object)
      );
    });

    it('should use default environment suffix when not provided', () => {
      stack = new S3Stack('test-s3', {});

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining('tap-app-bucket-dev'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should expose bucket name as output', () => {
      stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(stack.bucketName).toBeDefined();
      expect(stack.bucketName).toBe(mockBucket.bucket);
    });

    it('should expose lambda code object', () => {
      stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(stack.lambdaCodeObject).toBeDefined();
    });
  });
});
