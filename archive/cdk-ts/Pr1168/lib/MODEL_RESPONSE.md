I'll provide a production-grade AWS CDK solution that applies comprehensive security policies to an existing S3 bucket.

## 1) Project Tree

```
s3-security-policies/
├── bin/
│   └── s3-security-policies.ts
├── lib/
│   └── s3-security-policies-stack.ts
├── package.json
├── tsconfig.json
└── cdk.json
```

## 2) Files with Code

### `package.json`
```json
{
  "name": "s3-security-policies",
  "version": "1.0.0",
  "bin": {
    "s3-security-policies": "bin/s3-security-policies.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0",
    "aws-cdk": "^2.100.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.3.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["cdk.out"]
}
```

### `cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/s3-security-policies.ts",
  "watch": {
    "include": ["**"],
    "exclude": ["README.md", "cdk*.json", "**/*.d.ts", "**/*.js", "tsconfig.json", "package*.json", "yarn.lock", "node_modules", "test"]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib@2.100.0",
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "example-bucket-name": "my-secure-bucket-12345",
    "example-kms-key-arn": "arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012",
    "example-allowed-principals": [
      "arn:aws:iam::123456789012:role/MyApplication*",
      "arn:aws:iam::123456789012:role/DataProcessing*"
    ]
  }
}
```

### `bin/s3-security-policies.ts`
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3SecurityPoliciesStack } from '../lib/s3-security-policies-stack';

const app = new cdk.App();

new S3SecurityPoliciesStack(app, 'S3SecurityPoliciesStack', {
  env: {
    region: 'us-west-2',
  },
  bucketName: app.node.tryGetContext('bucketName') || 'my-secure-bucket',
  kmsKeyArn: app.node.tryGetContext('kmsKeyArn') || 'arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012',
  allowedPrincipals: app.node.tryGetContext('allowedPrincipals') || [
    'arn:aws:iam::123456789012:role/MyApplication*'
  ],
  cloudTrailLogBucket: app.node.tryGetContext('cloudTrailLogBucket'),
});
```

### `lib/s3-security-policies-stack.ts`
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';

export interface S3SecurityPoliciesStackProps extends cdk.StackProps {
  readonly bucketName: string;
  readonly kmsKeyArn: string;
  readonly allowedPrincipals: string[];
  readonly cloudTrailLogBucket?: string;
}

export class S3SecurityPoliciesStack extends cdk.Stack {
  public readonly securedBucket: s3.IBucket;
  public readonly cloudTrail: cloudtrail.Trail;

  constructor(scope: Construct, id: string, props: S3SecurityPoliciesStackProps) {
    super(scope, id, props);

    // Reference existing S3 bucket
    this.securedBucket = s3.Bucket.fromBucketName(
      this,
      'ExistingBucket',
      props.bucketName
    );

    // Extract KMS key ID from ARN for policy conditions
    const kmsKeyId = this.extractKmsKeyId(props.kmsKeyArn);

    // Create comprehensive bucket policy with deny statements
    const bucketPolicy = new s3.BucketPolicy(this, 'SecureBucketPolicy', {
      bucket: this.securedBucket,
    });

    // Bucket-level denies
    bucketPolicy.document.addStatements(
      // Deny non-TLS requests
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.securedBucket.bucketArn,
          `${this.securedBucket.bucketArn}/*`
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false'
          }
        }
      }),

      // Deny access to unauthorized principals
      new iam.PolicyStatement({
        sid: 'DenyUnauthorizedPrincipals',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:GetBucketLocation',
          's3:ListBucket'
        ],
        resources: [
          this.securedBucket.bucketArn,
          `${this.securedBucket.bucketArn}/*`
        ],
        conditions: {
          StringNotLike: {
            'aws:PrincipalArn': [
              ...props.allowedPrincipals,
              // Allow CloudTrail service
              'arn:aws:iam::*:role/aws-service-role/cloudtrail.amazonaws.com/*'
            ]
          }
        }
      })
    );

    // Object-level denies for encryption
    bucketPolicy.document.addStatements(
      // Deny uploads without SSE-KMS
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.securedBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms'
          }
        }
      }),

      // Deny uploads with wrong KMS key (supports both key ID and ARN)
      new iam.PolicyStatement({
        sid: 'DenyWrongKMSKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.securedBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': [
              props.kmsKeyArn,
              kmsKeyId
            ]
          },
          StringEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms'
          }
        }
      })
    );

    // Create CloudTrail for S3 data events
    const trailLogBucket = props.cloudTrailLogBucket 
      ? s3.Bucket.fromBucketName(this, 'CloudTrailLogBucket', props.cloudTrailLogBucket)
      : new s3.Bucket(this, 'CloudTrailLogBucket', {
          bucketName: `${props.bucketName}-cloudtrail-logs-${this.account}`,
          encryption: s3.BucketEncryption.S3_MANAGED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          enforceSSL: true,
          versioned: true,
          lifecycleRules: [{
            id: 'DeleteOldLogs',
            expiration: cdk.Duration.days(90)
          }]
        });

    this.cloudTrail = new cloudtrail.Trail(this, 'S3DataEventsTrail', {
      trailName: `${props.bucketName}-data-events-trail`,
      bucket: trailLogBucket,
      includeGlobalServiceEvents: false,
      isMultiRegionTrail: false,
      enableFileValidation: true
    });

    // Add S3 data events for the secured bucket
    this.cloudTrail.addS3EventSelector([{
      bucket: this.securedBucket,
      objectPrefix: '',
    }], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: false
    });

    // Outputs for reusability
    new cdk.CfnOutput(this, 'SecuredBucketName', {
      value: this.securedBucket.bucketName,
      description: 'Name of the secured S3 bucket'
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: this.cloudTrail.trailArn,
      description: 'ARN of the CloudTrail monitoring S3 data events'
    });

    new cdk.CfnOutput(this, 'CloudTrailLogBucketName', {
      value: trailLogBucket.bucketName,
      description: 'Name of the CloudTrail log bucket'
    });
  }

  private extractKmsKeyId(kmsKeyArn: string): string {
    // Extract key ID from ARN format: arn:aws:kms:region:account:key/key-id
    const parts = kmsKeyArn.split('/');
    return parts[parts.length - 1];
  }
}
```

## Refined Solution (Changed Sections)

### Updated `lib/s3-security-policies-stack.ts` (Policy Section Only)
```typescript
    // Bucket-level denies - minimal and readable
    bucketPolicy.document.addStatements(
      // Deny non-TLS requests
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.securedBucket.bucketArn,
          `${this.securedBucket.bucketArn}/*`
        ],
        conditions: {
          Bool: { 'aws:SecureTransport': 'false' }
        }
      }),

      // Deny unauthorized principals with wildcard support for STS roles
      new iam.PolicyStatement({
        sid: 'DenyUnauthorizedAccess',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.securedBucket.bucketArn,
          `${this.securedBucket.bucketArn}/*`
        ],
        conditions: {
          StringNotLike: {
            'aws:PrincipalArn': props.allowedPrincipals
          },
          // Exclude CloudTrail service from this deny
          StringNotEquals: {
            'aws:PrincipalServiceName': 'cloudtrail.amazonaws.com'
          }
        }
      })
    );

    // Object-level denies - encryption enforcement
    bucketPolicy.document.addStatements(
      // Deny non-KMS uploads
      new iam.PolicyStatement({
        sid: 'RequireSSEKMS',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.securedBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms'
          }
        }
      }),

      // Deny wrong KMS key (supports ARN and key-id)
      new iam.PolicyStatement({
        sid: 'EnforceSpecificKMSKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.securedBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': [
              props.kmsKeyArn,
              kmsKeyId
            ]
          }
        }
      })
    );
```

### Updated `cdk.json` (Context Section)
```json
{
  "context": {
    "example-usage": {
      "bucketName": "my-secure-bucket-12345",
      "kmsKeyArn": "arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012",
      "allowedPrincipals": [
        "arn:aws:iam::123456789012:role/MyApplication*",
        "arn:aws:iam::123456789012:role/DataProcessing*",
        "arn:aws:sts::123456789012:assumed-role/MyApplication*/*"
      ],
      "cloudTrailLogBucket": "optional-existing-trail-bucket"
    }
  }
}
```

## 3) Security Explanation

This solution implements defense-in-depth security for S3 through explicit deny policies that cannot be overridden by any allow statements. The bucket policy enforces TLS-only access, restricts operations to specific IAM principals using wildcard patterns that support both direct roles and STS assumed roles, and mandates SSE-KMS encryption with a specific key for all uploads (accepting both key ARN and key ID formats). CloudTrail data event logging provides comprehensive audit trails for all object access, while the modular design allows reuse across multiple buckets by parameterizing the bucket name, KMS key, and allowed principals, ensuring consistent security posture across your S3 infrastructure.

## How Bucket Policies Work (Explainer)

• **Policy Evaluation Order**: AWS evaluates explicit DENY statements first, then ALLOW statements - denies always win regardless of allows
• **Deny Beats Allow**: Even if an IAM role has S3 permissions, bucket deny policies will block access - this ensures security boundaries
• **TLS Enforcement**: `aws:SecureTransport=false` condition denies all HTTP requests, forcing HTTPS/TLS for data in transit
• **Principal Wildcards**: `StringNotLike` with `arn:aws:iam::123456789012:role/MyApp*` allows both direct roles and STS assumed roles
• **KMS Key Flexibility**: Policy accepts both full ARN and key-id formats for `x-amz-server-side-encryption-aws-kms-key-id` header
• **Encryption Chain**: First deny non-KMS uploads, then deny wrong KMS key - ensures only specified key is used
• **CloudTrail Exception**: Service principal exclusion prevents blocking CloudTrail's own logging operations
• **STS Role Support**: Wildcard patterns like `MyApplication*` match `assumed-role/MyApplication-prod/session-name`
• **Resource Scope**: Bucket-level denies apply to `bucket/*` and `bucket` ARNs, object-level only to `bucket/*`
• **Condition Logic**: Multiple conditions in same statement are AND logic; multiple values in same condition are OR logic
• **Service Integration**: CloudTrail data events capture all object access (read/write) for security monitoring and compliance
• **Reusability**: Parameterized design allows same security template across multiple buckets with different keys and principals