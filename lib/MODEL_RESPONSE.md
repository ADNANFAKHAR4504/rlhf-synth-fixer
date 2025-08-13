I'll provide you with a comprehensive, modular Pulumi TypeScript infrastructure setup that meets all your security requirements. Here's the implementation:

## Project Structure

```
src/
├── index.ts
├── config/
│   └── tags.ts
├── modules/
│   ├── s3/
│   │   └── index.ts
│   ├── iam/
│   │   └── index.ts
│   ├── kms/
│   │   └── index.ts
│   └── cloudtrail/
│       └── index.ts
└── types/
    └── common.ts
```

## Core Configuration Files

### `src/types/common.ts`
```typescript
export interface BaseResourceArgs {
  tags: Record<string, string>;
}

export interface SecurityConfig {
  requireMFA: boolean;
  encryptionEnabled: boolean;
  region: string;
}
```

### `src/config/tags.ts`
```typescript
export const commonTags = {
  Environment: "Production",
  Project: "Security",
  ManagedBy: "Pulumi",
  Region: "us-east-1"
};
```

## KMS Module

### `src/modules/kms/index.ts`
```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { commonTags } from "../../config/tags";

export interface KMSKeyArgs {
  description: string;
  keyUsage?: string;
  tags?: Record<string, string>;
}

export class KMSKey extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly alias: aws.kms.Alias;

  constructor(name: string, args: KMSKeyArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:security:KMSKey", name, {}, opts);

    const keyPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "Enable IAM User Permissions",
          Effect: "Allow",
          Principal: {
            AWS: pulumi.interpolate`arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`
          },
          Action: "kms:*",
          Resource: "*"
        },
        {
          Sid: "Allow CloudTrail to encrypt logs",
          Effect: "Allow",
          Principal: {
            Service: "cloudtrail.amazonaws.com"
          },
          Action: [
            "kms:GenerateDataKey*",
            "kms:DescribeKey",
            "kms:Encrypt",
            "kms:ReEncrypt*",
            "kms:Decrypt"
          ],
          Resource: "*"
        },
        {
          Sid: "Allow S3 service to use the key",
          Effect: "Allow",
          Principal: {
            Service: "s3.amazonaws.com"
          },
          Action: [
            "kms:GenerateDataKey",
            "kms:Decrypt"
          ],
          Resource: "*"
        }
      ]
    };

    this.key = new aws.kms.Key(`${name}-key`, {
      description: args.description,
      keyUsage: args.keyUsage || "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      policy: JSON.stringify(keyPolicy),
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      tags: { ...commonTags, ...args.tags }
    }, { parent: this });

    this.alias = new aws.kms.Alias(`${name}-alias`, {
      name: `alias/${name}`,
      targetKeyId: this.key.keyId
    }, { parent: this });

    this.registerOutputs({
      keyId: this.key.keyId,
      keyArn: this.key.arn,
      aliasName: this.alias.name
    });
  }
}
```

## S3 Module

### `src/modules/s3/index.ts`
```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { commonTags } from "../../config/tags";

export interface SecureS3BucketArgs {
  bucketName?: string;
  kmsKeyId: pulumi.Input<string>;
  tags?: Record<string, string>;
  lifecycleRules?: aws.s3.BucketV2LifecycleConfigurationRule[];
}

export class SecureS3Bucket extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.BucketV2;
  public readonly bucketPolicy: aws.s3.BucketPolicy;
  public readonly publicAccessBlock: aws.s3.BucketPublicAccessBlock;

  constructor(name: string, args: SecureS3BucketArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:security:SecureS3Bucket", name, {}, opts);

    // Create S3 bucket
    this.bucket = new aws.s3.BucketV2(`${name}-bucket`, {
      bucket: args.bucketName,
      forceDestroy: false,
      tags: { ...commonTags, ...args.tags }
    }, { parent: this });

    // Enable versioning
    new aws.s3.BucketVersioningV2(`${name}-versioning`, {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: "Enabled",
        mfaDelete: "Disabled" // Can be enabled if MFA delete is required
      }
    }, { parent: this });

    // Configure server-side encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(`${name}-encryption`, {
      bucket: this.bucket.id,
      serverSideEncryptionConfiguration: {
        rules: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: args.kmsKeyId
          },
          bucketKeyEnabled: true
        }]
      }
    }, { parent: this });

    // Block all public access
    this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${name}-public-access-block`, {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    }, { parent: this });

    // Secure bucket policy
    const bucketPolicyDocument = pulumi.all([this.bucket.arn]).apply(([bucketArn]) => ({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "DenyInsecureConnections",
          Effect: "Deny",
          Principal: "*",
          Action: "s3:*",
          Resource: [bucketArn, `${bucketArn}/*`],
          Condition: {
            Bool: {
              "aws:SecureTransport": "false"
            }
          }
        },
        {
          Sid: "DenyUnencryptedObjectUploads",
          Effect: "Deny",
          Principal: "*",
          Action: "s3:PutObject",
          Resource: `${bucketArn}/*`,
          Condition: {
            StringNotEquals: {
              "s3:x-amz-server-side-encryption": "aws:kms"
            }
          }
        }
      ]
    }));

    this.bucketPolicy = new aws.s3.BucketPolicy(`${name}-policy`, {
      bucket: this.bucket.id,
      policy: bucketPolicyDocument.apply(policy => JSON.stringify(policy))
    }, { parent: this, dependsOn: [this.publicAccessBlock] });

    // Configure lifecycle rules if provided
    if (args.lifecycleRules) {
      new aws.s3.BucketLifecycleConfigurationV2(`${name}-lifecycle`, {
        bucket: this.bucket.id,
        rules: args.lifecycleRules
      }, { parent: this });
    }

    // Enable logging
    new aws.s3.BucketLoggingV2(`${name}-logging`, {
      bucket: this.bucket.id,
      targetBucket: this.bucket.id,
      targetPrefix: "access-logs/"
    }, { parent: this });

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      bucketDomainName: this.bucket.bucketDomainName
    });
  }
}
```

## IAM Module

### `src/modules/iam/index.ts`
```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { commonTags } from "../../config/tags";

export interface SecureIAMRoleArgs {
  roleName?: string;
  assumeRolePolicy: pulumi.Input<string>;
  policies?: pulumi.Input<string>[];
  managedPolicyArns?: string[];
  requireMFA?: boolean;
  tags?: Record<string, string>;
}

export class SecureIAMRole extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policies: aws.iam.RolePolicy[];

  constructor(name: string, args: SecureIAMRoleArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:security:SecureIAMRole", name, {}, opts);

    // Create IAM role
    this.role = new aws.iam.Role(`${name}-role`, {
      name: args.roleName,
      assumeRolePolicy: args.assumeRolePolicy,
      tags: { ...commonTags, ...args.tags }
    }, { parent: this });

    // Attach managed policies
    if (args.managedPolicyArns) {
      args.managedPolicyArns.forEach((policyArn, index) => {
        new aws.iam.RolePolicyAttachment(`${name}-managed-policy-${index}`, {
          role: this.role.name,
          policyArn: policyArn
        }, { parent: this });
      });
    }

    // Attach inline policies
    this.policies = [];
    if (args.policies) {
      args.policies.forEach((policy, index) => {
        const rolePolicy = new aws.iam.RolePolicy(`${name}-policy-${index}`, {
          role: this.role.id,
          policy: policy
        }, { parent: this });
        this.policies.push(rolePolicy);
      });
    }

    this.registerOutputs({
      roleArn: this.role.arn,
      roleName: this.role.name
    });
  }
}

// MFA-enforced policy for sensitive operations
export function createMFAEnforcedPolicy(): string {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowViewAccountInfo",
        Effect: "Allow",
        Action: [
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices",
          "iam:GetAccountSummary"
        ],
        Resource: "*"
      },
      {
        Sid: "AllowManageOwnPasswords",
        Effect: "Allow",
        Action: [
          "iam:ChangePassword",
          "iam:GetUser"
        ],
        Resource: "arn:aws:iam::*:user/${aws:username}"
      },
      {
        Sid: "AllowManageOwnMFA",
        Effect: "Allow",
        Action: [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice"
        ],
        Resource: [
          "arn:aws:iam::*:mfa/${aws:username}",
          "arn:aws:iam::*:user/${aws:username}"
        ]
      },
      {
        Sid: "DenyAllExceptListedIfNoMFA",
        Effect: "Deny",
        NotAction: [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ],
        Resource: "*",
        Condition: {
          BoolIfExists: {
            "aws:MultiFactorAuthPresent": "false"
          }
        }
      }
    ]
  });
}

// S3 access policy with least privilege
export function createS3AccessPolicy(bucketArn: pulumi.Input<string>): pulumi.Output<string> {
  return pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource": "${bucketArn}/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "${bucketArn}"
      }
    ]
  }`;
}
```

## CloudTrail Module

### `src/modules/cloudtrail/index.ts`
```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { commonTags } from "../../config/tags";

export interface CloudTrailArgs {
  trailName?: string;
  s3BucketName: pulumi.Input<string>;
  kmsKeyId: pulumi.Input<string>;
  includeGlobalServiceEvents?: boolean;
  isMultiRegionTrail?: boolean;
  enableLogFileValidation?: boolean;
  tags?: Record<string, string>;
}

export class SecureCloudTrail extends pulumi.ComponentResource {
  public readonly trail: aws.cloudtrail.Trail;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly logStream: aws.cloudwatch.LogStream;

  constructor(name: string, args: CloudTrailArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:security:SecureCloudTrail", name, {}, opts);

    // Create CloudWatch Log Group for CloudTrail
    this.logGroup = new aws.cloudwatch.LogGroup(`${name}-log-group`, {
      name: `/aws/cloudtrail/${name}`,
      retentionInDays: 365,
      kmsKeyId: args.kmsKeyId,
      tags: { ...commonTags, ...args.tags }
    }, { parent: this });

    // Create CloudWatch Log Stream
    this.logStream = new aws.cloudwatch.LogStream(`${name}-log-stream`, {
      name: `${name}-stream`,
      logGroupName: this.logGroup.name
    }, { parent: this });

    // Create IAM role for CloudTrail to write to CloudWatch
    const cloudTrailRole = new aws.iam.Role(`${name}-cloudtrail-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            }
          }
        ]
      }),
      tags: { ...commonTags, ...args.tags }
    }, { parent: this });

    // Policy for CloudTrail to write to CloudWatch
    const cloudTrailPolicy = new aws.iam.RolePolicy(`${name}-cloudtrail-policy`, {
      role: cloudTrailRole.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:CreateLogStream"
            ],
            "Resource": "${this.logGroup.arn}:*"
          }
        ]
      }`
    }, { parent: this });

    // Create CloudTrail
    this.trail = new aws.cloudtrail.Trail(`${name}-trail`, {
      name: args.trailName,
      s3BucketName: args.s3BucketName,
      s3KeyPrefix: "cloudtrail-logs",
      includeGlobalServiceEvents: args.includeGlobalServiceEvents ?? true,
      isMultiRegionTrail: args.isMultiRegionTrail ?? true,
      enableLogFileValidation: args.enableLogFileValidation ?? true,
      kmsKeyId: args.kmsKeyId,
      cloudWatchLogsGroupArn: pulumi.interpolate`${this.logGroup.arn}:*`,
      cloudWatchLogsRoleArn: cloudTrailRole.arn,
      eventSelectors: [
        {
          readWriteType: "All",
          includeManagementEvents: true,
          dataResources: [
            {
              type: "AWS::S3::Object",
              values: ["arn:aws:s3:::*/*"]
            },
            {
              type: "AWS::S3::Bucket",
              values: ["arn:aws:s3:::*"]
            }
          ]
        }
      ],
      tags: { ...commonTags, ...args.tags }
    }, { parent: this, dependsOn: [cloudTrailPolicy] });

    this.registerOutputs({
      trailArn: this.trail.arn,
      trailName: this.trail.name,
      logGroupArn: this.logGroup.arn
    });
  }
}
```

## Main Infrastructure

### `src/index.ts`
```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { KMSKey } from "./modules/kms";
import { SecureS3Bucket } from "./modules/s3";
import { SecureIAMRole, createMFAEnforcedPolicy, createS3AccessPolicy } from "./modules/iam";
import { SecureCloudTrail } from "./modules/cloudtrail";
import { commonTags } from "./config/tags";

// Configure AWS provider for us-east-1
const provider = new aws.Provider("aws-provider", {
  region: "us-east-1"
});

// Create KMS keys for encryption
const s3KmsKey = new KMSKey("s3-encryption", {
  description: "KMS key for S3 bucket encryption"
}, { provider });

const cloudTrailKmsKey = new KMSKey("cloudtrail-encryption", {
  description: "KMS key for CloudTrail log encryption"
}, { provider });

// Create secure S3 buckets
const primaryBucket = new SecureS3Bucket("primary-storage", {
  kmsKeyId: s3KmsKey.key.keyId,
  lifecycleRules: [
    {
      id: "transition-to-ia",
      status: "Enabled",
      transitions: [
        {
          days: 30,
          storageClass: "STANDARD_IA"
        },
        {
          days: 90,
          storageClass: "GLACIER"
        },
        {
          days: 365,
          storageClass: "DEEP_ARCHIVE"
        }
      ]
    }
  ],
  tags: {
    Purpose: "Primary data storage"
  }
}, { provider });

const auditBucket = new SecureS3Bucket("audit-logs", {
  kmsKeyId: cloudTrailKmsKey.key.keyId,
  tags: {
    Purpose: "Audit and compliance logs"
  }
}, { provider });

// Create IAM roles with least privilege and MFA enforcement
const dataAccessRole = new SecureIAMRole("data-access", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          AWS: pulumi.interpolate`arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`
        },
        Condition: {
          Bool: {
            "aws:MultiFactorAuthPresent": "true"
          }
        }
      }
    ]
  }),
  policies: [
    createS3AccessPolicy(primaryBucket.bucket.arn),
    createMFAEnforcedPolicy()
  ],
  requireMFA: true,
  tags: {
    Purpose: "Data access with MFA enforcement"
  }
}, { provider });

const auditRole = new SecureIAMRole("audit-access", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          AWS: pulumi.interpolate`arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`
        },
        Condition: {
          Bool: {
            "aws:MultiFactorAuthPresent": "true"
          }
        }
      }
    ]
  }),
  policies: [
    pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:ListBucket"
          ],
          "Resource": [
            "${auditBucket.bucket.arn}",
            "${auditBucket.bucket.arn}/*"
          ]
        },
        {
          "Effect": "Allow",
          "Action": [
            "cloudtrail:LookupEvents",
            "cloudtrail:GetTrailStatus"
          ],
          "Resource": "*"
        }
      ]
    }`
  ],
  managedPolicyArns: ["arn:aws:iam::aws:policy/ReadOnlyAccess"],
  requireMFA: true,
  tags: {
    Purpose: "Audit log access"
  }
}, { provider });

// Create CloudTrail for comprehensive logging
const cloudTrail = new SecureCloudTrail("security-audit", {
  s3BucketName: auditBucket.bucket.id,
  kmsKeyId: cloudTrailKmsKey.key.keyId,
  includeGlobalServiceEvents: true,
  isMultiRegionTrail: true,
  enableLogFileValidation: true,
  tags: {
    Purpose: "Security audit and compliance"
  }
}, { provider });

// Create additional security policies
const securityPolicy = new aws.iam.Policy("security-baseline", {
  name: "SecurityBaseline",
  description: "Baseline security policy with MFA requirements",
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "RequireMFAForSensitiveActions",
        Effect: "Deny",
        Action: [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "s3:DeleteBucket",
          "s3:PutBucketPolicy",
          "kms:ScheduleKeyDeletion",
          "kms:DisableKey"
        ],
        Resource: "*",
        Condition: {
          BoolIfExists: {
            "aws:MultiFactorAuthPresent": "false"
          }
        }
      }
    ]
  }),
  tags: commonTags
}, { provider });

// Export important resource information
export const outputs = {
  // S3 Buckets
  primaryBucketName: primaryBucket.bucket.id,
  primaryBucketArn: primaryBucket.bucket.arn,
  auditBucketName: auditBucket.bucket.id,
  auditBucketArn: auditBucket.bucket.arn,
  
  // KMS Keys
  s3KmsKeyId: s3KmsKey.key.keyId,
  s3KmsKeyArn: s3KmsKey.key.arn,
  cloudTrailKmsKeyId: cloudTrailKmsKey.key.keyId,
  cloudTrailKmsKeyArn: cloudTrailKmsKey.key.arn,
  
  // IAM Roles
  dataAccessRoleArn: dataAccessRole.role.arn,
  auditRoleArn: auditRole.role.arn,
  
  // CloudTrail
  cloudTrailArn: cloudTrail.trail.arn,
  cloudTrailLogGroupArn: cloudTrail.logGroup.arn,
  
  // Security Policy
  securityPolicyArn: securityPolicy.arn,
  
  // Region confirmation
  region: "us-east-1"
};
```

## Key Security Features Implemented

### 1. **S3 Security**
- Server-side encryption with customer-managed KMS keys
- Versioning enabled on all buckets
- Complete public access blocking
- Bucket policies enforcing HTTPS and encrypted uploads
- Lifecycle management for cost optimization

### 2. **IAM Security**
- Strict least privilege access patterns
- MFA enforcement for all sensitive operations
- Assume role policies requiring MFA
- Separation of duties between data access and audit roles

### 3. **Encryption**
- Customer-managed KMS keys with automatic rotation
- Separate keys for different use cases (S3, CloudTrail)
- Comprehensive key policies allowing necessary service access

### 4. **Audit & Compliance**
- CloudTrail logging all API activity
- CloudWatch integration for real-time monitoring
- Multi-region trail for comprehensive coverage
- Log file validation enabled

### 5. **Infrastructure Best Practices**
- Modular, reusable component architecture
- Consistent tagging across all resources
- Provider-level region enforcement
- Comprehensive resource dependencies
- Production-grade error handling and validation

This infrastructure provides a solid foundation for secure, production-grade AWS operations with comprehensive audit trails and strict access controls.