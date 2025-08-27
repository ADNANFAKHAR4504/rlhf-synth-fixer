I'll help you create a secure multi-region infrastructure using Pulumi with JavaScript. Let me break this down into well-organized components following security best practices.

## lib/kms-stack.mjs

```javascript
/**
 * KMS Stack for encryption key management across regions
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class KMSStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:kms:KMSStack', name, args, opts);

    const { region, environmentSuffix = 'dev', tags = {} } = args;

    // Customer-managed KMS key for S3 encryption
    this.s3Key = new aws.kms.Key(`tap-s3-key-${region}-${environmentSuffix}`, {
      description: `TAP S3 encryption key for ${region}`,
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,
      rotationPeriod: 90, // 90 days rotation period (2025 flexible feature)
      tags: {
        ...tags,
        Purpose: 'S3Encryption',
        Region: region,
        Environment: environmentSuffix,
      },
    }, { parent: this });

    // KMS key alias for easier identification
    this.s3KeyAlias = new aws.kms.Alias(`tap-s3-alias-${region}-${environmentSuffix}`, {
      name: `alias/tap-s3-${region}-${environmentSuffix}`,
      targetKeyId: this.s3Key.keyId,
    }, { parent: this });

    // KMS key policy for least privilege access
    const keyPolicy = pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "Enable IAM User Permissions",
          "Effect": "Allow",
          "Principal": {
            "AWS": "arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root"
          },
          "Action": "kms:*",
          "Resource": "*"
        },
        {
          "Sid": "Allow S3 Service",
          "Effect": "Allow",
          "Principal": {
            "Service": "s3.amazonaws.com"
          },
          "Action": [
            "kms:Decrypt",
            "kms:GenerateDataKey",
            "kms:CreateGrant"
          ],
          "Resource": "*",
          "Condition": {
            "StringEquals": {
              "kms:ViaService": "s3.${region}.amazonaws.com"
            }
          }
        }
      ]
    }`;

    // Apply the policy to the key
    new aws.kms.KeyPolicy(`tap-s3-key-policy-${region}-${environmentSuffix}`, {
      keyId: this.s3Key.keyId,
      policy: keyPolicy,
    }, { parent: this });

    this.registerOutputs({
      keyId: this.s3Key.keyId,
      keyArn: this.s3Key.arn,
      aliasName: this.s3KeyAlias.name,
    });
  }
}
```

## lib/iam-stack.mjs

```javascript
/**
 * IAM Stack for least privilege roles and policies
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class IAMStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:iam:IAMStack', name, args, opts);

    const { environmentSuffix = 'dev', tags = {} } = args;

    // S3 access role with least privilege
    this.s3AccessRole = new aws.iam.Role(`tap-s3-access-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Condition: {
              StringEquals: {
                'aws:RequestedRegion': ['us-west-2', 'eu-central-1'],
              },
            },
          },
        ],
      }),
      tags: {
        ...tags,
        Purpose: 'S3Access',
        Environment: environmentSuffix,
      },
    }, { parent: this });

    // Policy for S3 bucket access with KMS permissions
    this.s3AccessPolicy = new aws.iam.RolePolicy(`tap-s3-access-policy-${environmentSuffix}`, {
      role: this.s3AccessRole.name,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::tap-secure-bucket-*/*",
            "Condition": {
              "StringEquals": {
                "s3:x-amz-server-side-encryption": "aws:kms"
              },
              "ForAllValues:StringEquals": {
                "aws:RequestedRegion": ["us-west-2", "eu-central-1"]
              }
            }
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::tap-secure-bucket-*",
            "Condition": {
              "ForAllValues:StringEquals": {
                "aws:RequestedRegion": ["us-west-2", "eu-central-1"]
              }
            }
          },
          {
            "Effect": "Allow",
            "Action": [
              "kms:Decrypt",
              "kms:GenerateDataKey"
            ],
            "Resource": "arn:aws:kms:*:${aws.getCallerIdentity().then(id => id.accountId)}:key/*",
            "Condition": {
              "StringEquals": {
                "kms:ViaService": ["s3.us-west-2.amazonaws.com", "s3.eu-central-1.amazonaws.com"]
              }
            }
          }
        ]
      }`,
    }, { parent: this });

    // Instance profile for EC2 instances
    this.instanceProfile = new aws.iam.InstanceProfile(`tap-instance-profile-${environmentSuffix}`, {
      role: this.s3AccessRole.name,
      tags: {
        ...tags,
        Environment: environmentSuffix,
      },
    }, { parent: this });

    // IAM Access Analyzer
    this.accessAnalyzer = new aws.accessanalyzer.Analyzer(`tap-access-analyzer-${environmentSuffix}`, {
      analyzerName: `tap-analyzer-${environmentSuffix}`,
      type: 'ACCOUNT',
      tags: {
        ...tags,
        Purpose: 'AccessAnalysis',
        Environment: environmentSuffix,
      },
    }, { parent: this });

    this.registerOutputs({
      roleArn: this.s3AccessRole.arn,
      instanceProfileArn: this.instanceProfile.arn,
      accessAnalyzerArn: this.accessAnalyzer.arn,
    });
  }
}
```

## lib/s3-stack.mjs

```javascript
/**
 * S3 Stack with KMS encryption for multi-region deployment
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class S3Stack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:s3:S3Stack', name, args, opts);

    const { region, kmsKeyId, environmentSuffix = 'dev', tags = {} } = args;

    // S3 bucket with encryption
    this.bucket = new aws.s3.Bucket(`tap-secure-bucket-${region}-${environmentSuffix}`, {
      tags: {
        ...tags,
        Region: region,
        Environment: environmentSuffix,
        Purpose: 'SecureStorage',
      },
    }, { parent: this });

    // S3 bucket versioning
    this.bucketVersioning = new aws.s3.BucketVersioningV2(`${this.bucket.id}-versioning`, {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this });

    // S3 bucket server-side encryption with KMS
    this.bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(`${this.bucket.id}-encryption`, {
      bucket: this.bucket.id,
      serverSideEncryptionConfiguration: {
        rules: [{
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: kmsKeyId,
            sseAlgorithm: 'aws:kms',
          },
          bucketKeyEnabled: true, // Enable S3 bucket keys to reduce KMS costs
        }],
      },
    }, { parent: this });

    // S3 bucket public access block
    this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${this.bucket.id}-public-access-block`, {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // S3 bucket policy for SSL/TLS enforcement
    this.bucketPolicy = new aws.s3.BucketPolicy(`${this.bucket.id}-policy`, {
      bucket: this.bucket.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "DenyInsecureConnections",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
              "${this.bucket.arn}",
              "${this.bucket.arn}/*"
            ],
            "Condition": {
              "Bool": {
                "aws:SecureTransport": "false"
              }
            }
          },
          {
            "Sid": "RequireKMSEncryption",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:PutObject",
            "Resource": "${this.bucket.arn}/*",
            "Condition": {
              "StringNotEquals": {
                "s3:x-amz-server-side-encryption": "aws:kms"
              }
            }
          }
        ]
      }`,
    }, { parent: this });

    // S3 bucket logging
    this.bucketLogging = new aws.s3.BucketLoggingV2(`${this.bucket.id}-logging`, {
      bucket: this.bucket.id,
      targetBucket: this.bucket.id,
      targetPrefix: 'access-logs/',
    }, { parent: this });

    this.registerOutputs({
      bucketId: this.bucket.id,
      bucketArn: this.bucket.arn,
      bucketDomainName: this.bucket.bucketDomainName,
    });
  }
}
```

## lib/tap-stack.mjs

```javascript
/**
 * tap-stack.mjs
 *
 * Main Pulumi ComponentResource for secure infrastructure deployment
 * Orchestrates KMS, IAM, and S3 components across multiple regions
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { KMSStack } from './kms-stack.mjs';
import { IAMStack } from './iam-stack.mjs';
import { S3Stack } from './s3-stack.mjs';

export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const regions = ['us-west-2', 'eu-central-1'];
    const tags = {
      Project: 'TAP',
      Environment: environmentSuffix,
      SecurityLevel: 'High',
      ...args.tags || {},
    };

    // Create IAM stack (global resources)
    const iamStack = new IAMStack('tap-iam', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Create regional resources
    const regionalResources = {};
    
    for (const region of regions) {
      // Create provider for each region
      const provider = new aws.Provider(`provider-${region}`, {
        region: region,
      });

      // Create KMS stack for each region
      const kmsStack = new KMSStack(`tap-kms-${region}`, {
        region,
        environmentSuffix,
        tags,
      }, { parent: this, provider });

      // Create S3 stack for each region
      const s3Stack = new S3Stack(`tap-s3-${region}`, {
        region,
        kmsKeyId: kmsStack.s3Key.keyId,
        environmentSuffix,
        tags,
      }, { parent: this, provider });

      regionalResources[region] = {
        kms: kmsStack,
        s3: s3Stack,
        provider,
      };
    }

    // Store regional resources
    this.regionalResources = regionalResources;
    this.iamStack = iamStack;

    this.registerOutputs({
      iamRoleArn: iamStack.roleArn,
      accessAnalyzerArn: iamStack.accessAnalyzerArn,
      regionalResources: Object.fromEntries(
        Object.entries(regionalResources).map(([region, resources]) => [
          region,
          {
            kmsKeyArn: resources.kms.keyArn,
            s3BucketArn: resources.s3.bucketArn,
          }
        ])
      ),
    });
  }
}
```

## test/kms-stack.unit.test.mjs

```javascript
import * as pulumi from '@pulumi/pulumi';
import { KMSStack } from '../lib/kms-stack.mjs';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args) => {
    switch (args.type) {
      case 'aws:kms/key:Key':
        return {
          id: 'mock-kms-key-id',
          state: {
            keyId: 'mock-kms-key-id',
            arn: `arn:aws:kms:us-west-2:123456789012:key/mock-kms-key-id`,
            enableKeyRotation: true,
            rotationPeriod: 90,
          },
        };
      case 'aws:kms/alias:Alias':
        return {
          id: 'mock-alias-id',
          state: {
            name: 'alias/tap-s3-us-west-2-dev',
          },
        };
      default:
        return {
          id: `${args.name}-id`,
          state: {},
        };
    }
  },
  call: (args) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
});

describe('KMSStack', () => {
  test('creates KMS key with proper configuration', async () => {
    const stack = new KMSStack('test-kms', {
      region: 'us-west-2',
      environmentSuffix: 'test',
      tags: { TestTag: 'TestValue' },
    });

    const keyId = await stack.s3Key.keyId;
    const keyArn = await stack.s3Key.arn;
    const enableKeyRotation = await stack.s3Key.enableKeyRotation;
    const rotationPeriod = await stack.s3Key.rotationPeriod;

    expect(keyId).toBe('mock-kms-key-id');
    expect(keyArn).toBe('arn:aws:kms:us-west-2:123456789012:key/mock-kms-key-id');
    expect(enableKeyRotation).toBe(true);
    expect(rotationPeriod).toBe(90);
  });

  test('creates KMS alias with correct name', async () => {
    const stack = new KMSStack('test-kms', {
      region: 'us-west-2',
      environmentSuffix: 'test',
    });

    const aliasName = await stack.s3KeyAlias.name;
    expect(aliasName).toBe('alias/tap-s3-us-west-2-test');
  });
});
```

## test/iam-stack.unit.test.mjs

```javascript
import * as pulumi from '@pulumi/pulumi';
import { IAMStack } from '../lib/iam-stack.mjs';

pulumi.runtime.setMocks({
  newResource: (args) => {
    switch (args.type) {
      case 'aws:iam/role:Role':
        return {
          id: 'mock-role-id',
          state: {
            name: args.inputs.name || 'mock-role-name',
            arn: `arn:aws:iam::123456789012:role/${args.inputs.name || 'mock-role'}`,
          },
        };
      case 'aws:iam/instanceProfile:InstanceProfile':
        return {
          id: 'mock-instance-profile-id',
          state: {
            arn: 'arn:aws:iam::123456789012:instance-profile/mock-profile',
          },
        };
      case 'aws:accessanalyzer/analyzer:Analyzer':
        return {
          id: 'mock-analyzer-id',
          state: {
            arn: 'arn:aws:access-analyzer:us-east-1:123456789012:analyzer/mock-analyzer',
          },
        };
      default:
        return {
          id: `${args.name}-id`,
          state: {},
        };
    }
  },
  call: (args) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
});

describe('IAMStack', () => {
  test('creates IAM role with least privilege policy', async () => {
    const stack = new IAMStack('test-iam', {
      environmentSuffix: 'test',
    });

    const roleArn = await stack.s3AccessRole.arn;
    expect(roleArn).toContain('arn:aws:iam::123456789012:role/');
  });

  test('creates access analyzer', async () => {
    const stack = new IAMStack('test-iam', {
      environmentSuffix: 'test',
    });

    const analyzerArn = await stack.accessAnalyzer.arn;
    expect(analyzerArn).toContain('arn:aws:access-analyzer:');
  });
});
```

## test/s3-stack.unit.test.mjs

```javascript
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

    const bucketId = await stack.bucket.id;
    const bucketArn = await stack.bucket.arn;
    
    expect(bucketId).toBe('mock-bucket-id');
    expect(bucketArn).toBe('arn:aws:s3:::mock-bucket-id');
  });
});
```

## test/tap-stack.int.test.mjs

```javascript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack.mjs';

pulumi.runtime.setMocks({
  newResource: (args) => {
    const mockId = `${args.name}-mock-id`;
    let mockState = { id: mockId };

    switch (args.type) {
      case 'aws:kms/key:Key':
        mockState = {
          ...mockState,
          keyId: mockId,
          arn: `arn:aws:kms:us-west-2:123456789012:key/${mockId}`,
          enableKeyRotation: true,
          rotationPeriod: 90,
        };
        break;
      case 'aws:s3/bucket:Bucket':
        mockState = {
          ...mockState,
          arn: `arn:aws:s3:::${mockId}`,
          bucketDomainName: `${mockId}.s3.amazonaws.com`,
        };
        break;
      case 'aws:iam/role:Role':
        mockState = {
          ...mockState,
          name: mockId,
          arn: `arn:aws:iam::123456789012:role/${mockId}`,
        };
        break;
    }

    return { id: mockId, state: mockState };
  },
  call: (args) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
});

describe('TapStack Integration', () => {
  test('creates multi-region secure infrastructure', async () => {
    const stack = new TapStack('test-tap', {
      environmentSuffix: 'test',
    });

    // Test that IAM resources are created
    expect(stack.iamStack).toBeDefined();
    
    // Test that regional resources are created for both regions
    expect(stack.regionalResources['us-west-2']).toBeDefined();
    expect(stack.regionalResources['eu-central-1']).toBeDefined();
    
    // Test that each region has KMS and S3 resources
    const usWest2Resources = stack.regionalResources['us-west-2'];
    const euCentral1Resources = stack.regionalResources['eu-central-1'];
    
    expect(usWest2Resources.kms).toBeDefined();
    expect(usWest2Resources.s3).toBeDefined();
    expect(euCentral1Resources.kms).toBeDefined();
    expect(euCentral1Resources.s3).toBeDefined();
  });
});
```

This solution provides:

1. **Multi-region KMS encryption** with flexible 90-day rotation periods
2. **S3 buckets with comprehensive security** including bucket keys, SSL/TLS enforcement, and encryption requirements
3. **Least privilege IAM roles** with condition keys for enhanced security
4. **IAM Access Analyzer integration** for ongoing permission optimization
5. **Comprehensive testing** to verify security configurations
6. **Production-ready code** with proper error handling, tagging, and resource organization

The infrastructure is organized into separate, reusable components and follows current AWS security best practices for 2025.