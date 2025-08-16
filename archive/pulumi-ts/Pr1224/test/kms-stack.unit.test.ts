// Mock AWS and Pulumi before importing
jest.mock('@pulumi/aws', () => ({
  kms: {
    Key: jest.fn().mockImplementation((name, args) => ({
      keyId: `mock-key-id-${name}`,
      arn: `arn:aws:kms:us-east-1:123456789012:key/mock-key-${name}`,
    })),
    Alias: jest.fn().mockImplementation((name, args) => ({
      name: args.name,
      targetKeyId: args.targetKeyId,
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
import { KmsStack } from '../lib/stacks/kms-stack';

describe('KmsStack Unit Tests', () => {
  let kmsStack: KmsStack;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    it('should create KMS stack with default environment suffix', () => {
      kmsStack = new KmsStack('test-kms', {});
      expect(kmsStack).toBeDefined();
    });

    it('should create KMS stack with custom environment suffix', () => {
      kmsStack = new KmsStack('test-kms', {
        environmentSuffix: 'prod',
        tags: { Environment: 'prod' },
      });
      expect(kmsStack).toBeDefined();
    });
  });

  describe('KMS Key Creation', () => {
    beforeEach(() => {
      kmsStack = new KmsStack('test-kms', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });
    });

    it('should create main KMS key with correct configuration', () => {
      expect(aws.kms.Key).toHaveBeenCalledWith(
        'tap-main-key-test',
        expect.objectContaining({
          description: 'Main KMS key for TAP infrastructure encryption',
          enableKeyRotation: true,
          deletionWindowInDays: 7,
          tags: expect.objectContaining({
            Name: 'tap-main-key-test',
            Purpose: 'MainEncryption',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create RDS KMS key with correct configuration', () => {
      expect(aws.kms.Key).toHaveBeenCalledWith(
        'tap-rds-key-test',
        expect.objectContaining({
          description: 'KMS key for TAP RDS encryption',
          enableKeyRotation: true,
          deletionWindowInDays: 7,
          tags: expect.objectContaining({
            Name: 'tap-rds-key-test',
            Purpose: 'RDSEncryption',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create aliases for both keys', () => {
      expect(aws.kms.Alias).toHaveBeenCalledWith(
        'tap-main-key-alias-test',
        expect.objectContaining({
          name: 'alias/tap-main-test',
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );

      expect(aws.kms.Alias).toHaveBeenCalledWith(
        'tap-rds-key-alias-test',
        expect.objectContaining({
          name: 'alias/tap-rds-test',
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });
  });

  describe('Environment Suffix Integration', () => {
    it('should use environment suffix in resource names', () => {
      const environmentSuffix = 'staging';
      kmsStack = new KmsStack('test-kms', { environmentSuffix });

      expect(aws.kms.Key).toHaveBeenCalledWith(
        `tap-main-key-${environmentSuffix}`,
        expect.any(Object),
        expect.any(Object)
      );

      expect(aws.kms.Key).toHaveBeenCalledWith(
        `tap-rds-key-${environmentSuffix}`,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use environment suffix in tags', () => {
      const environmentSuffix = 'production';
      kmsStack = new KmsStack('test-kms', { environmentSuffix });

      expect(aws.kms.Key).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: `tap-main-key-${environmentSuffix}`,
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      kmsStack = new KmsStack('test-kms', { environmentSuffix: 'test' });
    });

    it('should enable key rotation for security', () => {
      expect(aws.kms.Key).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableKeyRotation: true,
        }),
        expect.any(Object)
      );
    });

    it('should set appropriate deletion window', () => {
      expect(aws.kms.Key).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          deletionWindowInDays: 7,
        }),
        expect.any(Object)
      );
    });
  });
});
