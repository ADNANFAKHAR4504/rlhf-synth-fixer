// Mock AWS and Pulumi before importing
jest.mock('@pulumi/aws', () => ({
  s3: {
    Bucket: jest.fn().mockImplementation((name, args) => ({
      id: `mock-bucket-${name}`,
      arn: `arn:aws:s3:::mock-bucket-${name}`,
    })),
    BucketPublicAccessBlock: jest.fn().mockImplementation((name, args) => ({
      id: `mock-pab-${name}`,
    })),
    BucketServerSideEncryptionConfiguration: jest.fn().mockImplementation((name, args) => ({
      id: `mock-encryption-${name}`,
    })),
    BucketVersioning: jest.fn().mockImplementation((name, args) => ({
      id: `mock-versioning-${name}`,
    })),
    BucketLifecycleConfiguration: jest.fn().mockImplementation((name, args) => ({
      id: `mock-lifecycle-${name}`,
    })),
    BucketLogging: jest.fn().mockImplementation((name, args) => ({
      id: `mock-logging-${name}`,
    })),
  },
}));

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {}
    registerOutputs(outputs: any) {}
  },
}));

import * as aws from '@pulumi/aws';
import { S3Stack } from '../lib/stacks/s3-stack';

describe('S3Stack Unit Tests', () => {
  let s3Stack: S3Stack;
  const mockKmsKeyArn = 'arn:aws:kms:us-east-1:123456789012:key/mock-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    it('should create S3 stack with required parameters', () => {
      s3Stack = new S3Stack('test-s3', {
        mainKmsKeyArn: mockKmsKeyArn,
      });
      expect(s3Stack).toBeDefined();
    });

    it('should create S3 stack with custom environment suffix', () => {
      s3Stack = new S3Stack('test-s3', {
        environmentSuffix: 'prod',
        mainKmsKeyArn: mockKmsKeyArn,
        tags: { Environment: 'prod' },
      });
      expect(s3Stack).toBeDefined();
    });
  });

  describe('Data Bucket Creation', () => {
    beforeEach(() => {
      s3Stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
        mainKmsKeyArn: mockKmsKeyArn,
        tags: { Environment: 'test' },
      });
    });

    it('should create data bucket with correct configuration', () => {
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        'tap-data-bucket-test',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'tap-data-bucket-test',
            Purpose: 'DataStorage',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should block public access on data bucket', () => {
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        'tap-data-bucket-pab-test',
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should enable server-side encryption on data bucket', () => {
      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalledWith(
        'tap-data-bucket-encryption-test',
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: expect.objectContaining({
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: mockKmsKeyArn,
              }),
              bucketKeyEnabled: true,
            }),
          ]),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should enable versioning on data bucket', () => {
      expect(aws.s3.BucketVersioning).toHaveBeenCalledWith(
        'tap-data-bucket-versioning-test',
        expect.objectContaining({
          versioningConfiguration: expect.objectContaining({
            status: 'Enabled',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should configure lifecycle policy on data bucket', () => {
      expect(aws.s3.BucketLifecycleConfiguration).toHaveBeenCalledWith(
        'tap-data-bucket-lifecycle-test',
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              id: 'transition-to-ia',
              status: 'Enabled',
              transitions: expect.arrayContaining([
                expect.objectContaining({
                  days: 30,
                  storageClass: 'STANDARD_IA',
                }),
              ]),
            }),
          ]),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });
  });

  describe('Logs Bucket Creation', () => {
    beforeEach(() => {
      s3Stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
        mainKmsKeyArn: mockKmsKeyArn,
        tags: { Environment: 'test' },
      });
    });

    it('should create logs bucket with correct configuration', () => {
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        'tap-logs-bucket-test',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'tap-logs-bucket-test',
            Purpose: 'LogStorage',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should configure lifecycle policy on logs bucket with retention', () => {
      expect(aws.s3.BucketLifecycleConfiguration).toHaveBeenCalledWith(
        'tap-logs-bucket-lifecycle-test',
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              id: 'delete-old-logs',
              status: 'Enabled',
              expiration: expect.objectContaining({
                days: 90,
              }),
            }),
          ]),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should enable encryption on logs bucket', () => {
      const encryptionCalls = (aws.s3.BucketServerSideEncryptionConfiguration as unknown as jest.Mock).mock.calls;
      const logsBucketEncryption = encryptionCalls.find(call => call[0].includes('logs-bucket'));
      
      expect(logsBucketEncryption).toBeDefined();
      expect(logsBucketEncryption[1].rules[0].applyServerSideEncryptionByDefault.sseAlgorithm).toBe('aws:kms');
      expect(logsBucketEncryption[1].rules[0].applyServerSideEncryptionByDefault.kmsMasterKeyId).toBe(mockKmsKeyArn);
    });
  });

  describe('Bucket Logging Configuration', () => {
    beforeEach(() => {
      s3Stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
        mainKmsKeyArn: mockKmsKeyArn,
      });
    });

    it('should configure access logging from data bucket to logs bucket', () => {
      expect(aws.s3.BucketLogging).toHaveBeenCalledWith(
        'tap-data-bucket-logging-test',
        expect.objectContaining({
          targetPrefix: 'data-bucket-access-logs/',
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });
  });

  describe('Environment Suffix Integration', () => {
    it('should use environment suffix in bucket names', () => {
      const environmentSuffix = 'staging';
      s3Stack = new S3Stack('test-s3', {
        environmentSuffix,
        mainKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        `tap-data-bucket-${environmentSuffix}`,
        expect.any(Object),
        expect.any(Object)
      );

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        `tap-logs-bucket-${environmentSuffix}`,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use environment suffix in tags', () => {
      const environmentSuffix = 'production';
      s3Stack = new S3Stack('test-s3', {
        environmentSuffix,
        mainKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: `tap-data-bucket-${environmentSuffix}`,
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      s3Stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
        mainKmsKeyArn: mockKmsKeyArn,
      });
    });

    it('should block all public access on both buckets', () => {
      const publicAccessCalls = (aws.s3.BucketPublicAccessBlock as unknown as jest.Mock).mock.calls;
      
      expect(publicAccessCalls).toHaveLength(2); // One for each bucket
      publicAccessCalls.forEach(call => {
        expect(call[1]).toEqual(expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }));
      });
    });

    it('should use KMS encryption for both buckets', () => {
      const encryptionCalls = (aws.s3.BucketServerSideEncryptionConfiguration as unknown as jest.Mock).mock.calls;
      
      expect(encryptionCalls).toHaveLength(2); // One for each bucket
      encryptionCalls.forEach(call => {
        expect(call[1].rules[0].applyServerSideEncryptionByDefault).toEqual(expect.objectContaining({
          sseAlgorithm: 'aws:kms',
          kmsMasterKeyId: mockKmsKeyArn,
        }));
      });
    });

    it('should enable versioning on both buckets', () => {
      const versioningCalls = (aws.s3.BucketVersioning as unknown as jest.Mock).mock.calls;
      
      expect(versioningCalls).toHaveLength(2); // One for each bucket
      versioningCalls.forEach(call => {
        expect(call[1].versioningConfiguration.status).toBe('Enabled');
      });
    });
  });
});
