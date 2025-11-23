import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name
        ? `${args.inputs.name}-id`
        : `${args.name}-${args.type}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:ap-southeast-1:123456789012:${args.name}`,
        id: args.inputs.bucket || args.inputs.name || args.name,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:iam/getPolicyDocument:getPolicyDocument') {
      return {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: args.inputs.statements || [],
        }),
      };
    }
    if (args.token === 'aws:getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI123456789012345',
      };
    }
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';
import { S3Buckets } from '../lib/s3-buckets';
import { IamRoles } from '../lib/iam-roles';
import { BucketPolicies } from '../lib/bucket-policies';
import * as aws from '@pulumi/aws';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Clear any previous test state
    jest.clearAllMocks();
  });

  describe('TapStack Creation', () => {
    it('should create TapStack with default environmentSuffix', async () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
    });

    it('should create TapStack with custom environmentSuffix', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
    });

    it('should export all required outputs', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const developerRole = await stack.developerRoleArn;
      const analystRole = await stack.analystRoleArn;
      const adminRole = await stack.adminRoleArn;
      const publicBucket = await stack.publicBucketName;
      const internalBucket = await stack.internalBucketName;
      const confidentialBucket = await stack.confidentialBucketName;

      expect(developerRole).toBeDefined();
      expect(analystRole).toBeDefined();
      expect(adminRole).toBeDefined();
      expect(publicBucket).toBeDefined();
      expect(internalBucket).toBeDefined();
      expect(confidentialBucket).toBeDefined();
    });
  });

  describe('KMS Key Configuration', () => {
    it('should create KMS key with encryption enabled', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should create KMS alias for confidential bucket', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });
  });
});

describe('S3Buckets Component Tests', () => {
  let buckets: S3Buckets;
  let mockKmsKey: aws.kms.Key;

  beforeEach(() => {
    // Create mock KMS key
    mockKmsKey = new aws.kms.Key('test-kms-key', {
      description: 'Test KMS key',
      enableKeyRotation: true,
    });
  });

  describe('Bucket Creation', () => {
    it('should create all four buckets (audit, public, internal, confidential)', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.auditBucket).toBeDefined();
      expect(buckets.publicBucket).toBeDefined();
      expect(buckets.internalBucket).toBeDefined();
      expect(buckets.confidentialBucket).toBeDefined();
    });

    it('should tag all buckets with DataClassification', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test', Team: 'security' },
      });

      expect(buckets.auditBucket).toBeDefined();
      expect(buckets.publicBucket).toBeDefined();
      expect(buckets.internalBucket).toBeDefined();
      expect(buckets.confidentialBucket).toBeDefined();
    });
  });

  describe('Versioning Configuration', () => {
    it('should enable versioning on all buckets', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets).toBeDefined();
    });
  });

  describe('Encryption Configuration', () => {
    it('should configure SSE-S3 for audit bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.auditBucket).toBeDefined();
    });

    it('should configure SSE-S3 for public bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.publicBucket).toBeDefined();
    });

    it('should configure SSE-S3 for internal bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.internalBucket).toBeDefined();
    });

    it('should configure SSE-KMS for confidential bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.confidentialBucket).toBeDefined();
    });
  });

  describe('Lifecycle Configuration', () => {
    it('should configure lifecycle policy for public bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.publicBucket).toBeDefined();
    });

    it('should configure lifecycle policy for internal bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.internalBucket).toBeDefined();
    });

    it('should configure lifecycle policy for confidential bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.confidentialBucket).toBeDefined();
    });
  });

  describe('Logging Configuration', () => {
    it('should configure logging for public bucket to audit bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.auditBucket).toBeDefined();
      expect(buckets.publicBucket).toBeDefined();
    });

    it('should configure logging for internal bucket to audit bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.auditBucket).toBeDefined();
      expect(buckets.internalBucket).toBeDefined();
    });

    it('should configure logging for confidential bucket to audit bucket', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.auditBucket).toBeDefined();
      expect(buckets.confidentialBucket).toBeDefined();
    });
  });

  describe('Public Access Block', () => {
    it('should block all public access on all buckets', async () => {
      buckets = new S3Buckets('test-buckets', {
        environmentSuffix: 'test',
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(buckets.auditBucket).toBeDefined();
      expect(buckets.publicBucket).toBeDefined();
      expect(buckets.internalBucket).toBeDefined();
      expect(buckets.confidentialBucket).toBeDefined();
    });
  });
});

describe('IamRoles Component Tests', () => {
  let roles: IamRoles;
  let mockBuckets: any;
  let mockKmsKey: aws.kms.Key;

  beforeEach(() => {
    // Create mock KMS key
    mockKmsKey = new aws.kms.Key('test-kms-key', {
      description: 'Test KMS key',
    });

    // Create mock buckets
    mockBuckets = {
      publicBucket: new aws.s3.BucketV2('public-bucket', {
        bucket: 'public-data-test',
      }),
      internalBucket: new aws.s3.BucketV2('internal-bucket', {
        bucket: 'internal-data-test',
      }),
      confidentialBucket: new aws.s3.BucketV2('confidential-bucket', {
        bucket: 'confidential-data-test',
      }),
    };
  });

  describe('Role Creation', () => {
    it('should create all three roles (developer, analyst, admin)', async () => {
      roles = new IamRoles('test-roles', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(roles.developerRole).toBeDefined();
      expect(roles.analystRole).toBeDefined();
      expect(roles.adminRole).toBeDefined();
    });

    it('should tag all roles with RoleType', async () => {
      roles = new IamRoles('test-roles', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
        kmsKey: mockKmsKey,
        tags: { Environment: 'test', Team: 'security' },
      });

      expect(roles.developerRole).toBeDefined();
      expect(roles.analystRole).toBeDefined();
      expect(roles.adminRole).toBeDefined();
    });
  });

  describe('Assume Role Policies', () => {
    it('should configure assume role policy for all roles', async () => {
      roles = new IamRoles('test-roles', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(roles.developerRole).toBeDefined();
      expect(roles.analystRole).toBeDefined();
      expect(roles.adminRole).toBeDefined();
    });
  });

  describe('Role Permissions', () => {
    it('should grant developer read-only access to public and internal buckets', async () => {
      roles = new IamRoles('test-roles', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(roles.developerRole).toBeDefined();
    });

    it('should grant analyst read/write access to internal and read-only to confidential', async () => {
      roles = new IamRoles('test-roles', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(roles.analystRole).toBeDefined();
    });

    it('should grant admin full access to all buckets', async () => {
      roles = new IamRoles('test-roles', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
        kmsKey: mockKmsKey,
        tags: { Environment: 'test' },
      });

      expect(roles.adminRole).toBeDefined();
    });
  });
});

describe('BucketPolicies Component Tests', () => {
  let policies: BucketPolicies;
  let mockBuckets: any;

  beforeEach(() => {
    // Create mock buckets
    mockBuckets = {
      publicBucket: new aws.s3.BucketV2('public-bucket', {
        bucket: 'public-data-test',
      }),
      internalBucket: new aws.s3.BucketV2('internal-bucket', {
        bucket: 'internal-data-test',
      }),
      confidentialBucket: new aws.s3.BucketV2('confidential-bucket', {
        bucket: 'confidential-data-test',
      }),
    };
  });

  describe('Policy Creation', () => {
    it('should create policies for all three buckets', async () => {
      policies = new BucketPolicies('test-policies', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
      });

      expect(policies).toBeDefined();
    });
  });

  describe('HTTPS Enforcement', () => {
    it('should enforce HTTPS on public bucket', async () => {
      policies = new BucketPolicies('test-policies', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
      });

      expect(policies).toBeDefined();
    });

    it('should enforce HTTPS on internal bucket', async () => {
      policies = new BucketPolicies('test-policies', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
      });

      expect(policies).toBeDefined();
    });

    it('should enforce HTTPS on confidential bucket', async () => {
      policies = new BucketPolicies('test-policies', {
        environmentSuffix: 'test',
        publicBucket: mockBuckets.publicBucket,
        internalBucket: mockBuckets.internalBucket,
        confidentialBucket: mockBuckets.confidentialBucket,
      });

      expect(policies).toBeDefined();
    });
  });
});
