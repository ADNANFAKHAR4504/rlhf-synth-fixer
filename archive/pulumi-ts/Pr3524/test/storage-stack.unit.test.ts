import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { StorageStack } from '../lib/storage-stack';

// Enable Pulumi mocking
jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

describe('StorageStack', () => {
  let stack: StorageStack;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Pulumi runtime
    (pulumi as any).all = jest
      .fn()
      .mockImplementation((values) => ({
        apply: (fn: any) => fn(values)
      }));
    (pulumi as any).Output = jest.fn().mockImplementation(value => ({
      promise: () => Promise.resolve(value),
      apply: (fn: any) => fn(value),
    }));
    (pulumi as any).output = jest.fn().mockImplementation(value => value);
    (pulumi as any).interpolate = jest
      .fn()
      .mockImplementation(strings => strings);
    (pulumi as any).ComponentResource = jest.fn();

    // Mock AWS resources
    const mockBucket = {
      id: 'mock-bucket-id',
      arn: 'arn:aws:s3:::mock-bucket',
      bucket: 'mock-bucket-name',
      bucketDomainName: 'mock-bucket.s3.amazonaws.com'
    };
    const mockOAC = {
      id: 'mock-oac-id'
    };

    (aws.s3.Bucket as any) = jest.fn().mockImplementation(() => mockBucket);
    (aws.s3.BucketPublicAccessBlock as any) = jest.fn();
    (aws.s3.BucketLifecycleConfiguration as any) = jest.fn();
    (aws.s3.BucketServerSideEncryptionConfiguration as any) = jest.fn();
    (aws.s3.BucketPolicy as any) = jest.fn();
    (aws.cloudfront.OriginAccessControl as any) = jest.fn().mockImplementation(() => mockOAC);
    
    // Mock getCallerIdentity
    (aws.getCallerIdentity as any) = jest.fn().mockReturnValue({
      accountId: '123456789012',
      arn: 'arn:aws:iam::123456789012:user/test-user',
      userId: 'AIDACKCEVSQ6C2EXAMPLE'
    });
  });

  describe('with environment suffix', () => {
    beforeEach(() => {
      stack = new StorageStack('TestStorageStack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
        },
      });
    });

    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should have expected outputs', () => {
      expect(stack.bucketId).toBeDefined();
      expect(stack.bucketArn).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.bucketDomainName).toBeDefined();
      expect(stack.logsBucketDomainName).toBeDefined();
    });

    it('should create S3 bucket for binaries', () => {
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining('software-dist-binaries'),
        expect.objectContaining({
          versioning: expect.objectContaining({
            enabled: true,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create S3 bucket for logs', () => {
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining('software-dist-logs'),
        expect.objectContaining({
          acl: 'private',
        }),
        expect.any(Object)
      );
    });

    it('should create bucket public access block', () => {
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        expect.stringContaining('software-dist-pab'),
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }),
        expect.any(Object)
      );
    });

    it('should create Origin Access Control', () => {
      expect(aws.cloudfront.OriginAccessControl).toHaveBeenCalledWith(
        expect.stringContaining('software-dist-oac'),
        expect.objectContaining({
          originAccessControlOriginType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
        }),
        expect.any(Object)
      );
    });

    it('should create bucket policy', () => {
      expect(aws.s3.BucketPolicy).toHaveBeenCalledWith(
        expect.stringContaining('software-dist-policy'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should apply intelligent tiering lifecycle', () => {
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining('software-dist-binaries'),
        expect.objectContaining({
          lifecycleRules: expect.arrayContaining([
            expect.objectContaining({
              enabled: true,
              transitions: expect.arrayContaining([
                expect.objectContaining({
                  storageClass: 'INTELLIGENT_TIERING',
                }),
              ]),
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should enable server-side encryption', () => {
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining('software-dist-binaries'),
        expect.objectContaining({
          serverSideEncryptionConfiguration: expect.objectContaining({
            rule: expect.objectContaining({
              applyServerSideEncryptionByDefault: expect.objectContaining({
                sseAlgorithm: 'AES256',
              }),
            }),
          }),
        }),
        expect.any(Object)
      );
    });
  });
});