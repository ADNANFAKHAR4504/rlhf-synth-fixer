# S3 Access Control System - Pulumi TypeScript Implementation

This implementation provides a complete secure S3 access control system with role-based access, encryption, audit logging, and compliance features.

## File: lib/s3-buckets.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3BucketsArgs {
  environmentSuffix: string;
  kmsKey: aws.kms.Key;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class S3Buckets extends pulumi.ComponentResource {
  public readonly auditBucket: aws.s3.BucketV2;
  public readonly publicBucket: aws.s3.BucketV2;
  public readonly internalBucket: aws.s3.BucketV2;
  public readonly confidentialBucket: aws.s3.BucketV2;

  constructor(name: string, args: S3BucketsArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:s3:S3Buckets', name, {}, opts);

    const { environmentSuffix, kmsKey, tags } = args;

    // Create audit bucket for logging
    this.auditBucket = new aws.s3.BucketV2(`audit-bucket-${environmentSuffix}`, {
      bucket: `audit-logs-${environmentSuffix}`,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        DataClassification: 'audit',
      })),
    }, { parent: this });

    // Enable versioning on audit bucket
    new aws.s3.BucketVersioningV2(`audit-bucket-versioning-${environmentSuffix}`, {
      bucket: this.auditBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this });

    // Block public access on audit bucket
    new aws.s3.BucketPublicAccessBlock(`audit-bucket-public-access-${environmentSuffix}`, {
      bucket: this.auditBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // Enable server-side encryption on audit bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(`audit-bucket-encryption-${environmentSuffix}`, {
      bucket: this.auditBucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      }],
    }, { parent: this });

    // Create public bucket
    this.publicBucket = new aws.s3.BucketV2(`public-bucket-${environmentSuffix}`, {
      bucket: `public-data-${environmentSuffix}`,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        DataClassification: 'public',
      })),
    }, { parent: this });

    // Enable versioning on public bucket
    new aws.s3.BucketVersioningV2(`public-bucket-versioning-${environmentSuffix}`, {
      bucket: this.publicBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this });

    // Block public access on public bucket
    new aws.s3.BucketPublicAccessBlock(`public-bucket-public-access-${environmentSuffix}`, {
      bucket: this.publicBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // Enable server-side encryption on public bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(`public-bucket-encryption-${environmentSuffix}`, {
      bucket: this.publicBucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      }],
    }, { parent: this });

    // Enable access logging on public bucket
    new aws.s3.BucketLoggingV2(`public-bucket-logging-${environmentSuffix}`, {
      bucket: this.publicBucket.id,
      targetBucket: this.auditBucket.id,
      targetPrefix: 'public-bucket-logs/',
    }, { parent: this });

    // Add lifecycle rule for public bucket
    new aws.s3.BucketLifecycleConfigurationV2(`public-bucket-lifecycle-${environmentSuffix}`, {
      bucket: this.publicBucket.id,
      rules: [{
        id: 'glacier-transition',
        status: 'Enabled',
        transitions: [{
          days: 90,
          storageClass: 'GLACIER',
        }],
      }],
    }, { parent: this });

    // Create internal bucket
    this.internalBucket = new aws.s3.BucketV2(`internal-bucket-${environmentSuffix}`, {
      bucket: `internal-data-${environmentSuffix}`,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        DataClassification: 'internal',
      })),
    }, { parent: this });

    // Enable versioning on internal bucket
    new aws.s3.BucketVersioningV2(`internal-bucket-versioning-${environmentSuffix}`, {
      bucket: this.internalBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this });

    // Block public access on internal bucket
    new aws.s3.BucketPublicAccessBlock(`internal-bucket-public-access-${environmentSuffix}`, {
      bucket: this.internalBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // Enable server-side encryption on internal bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(`internal-bucket-encryption-${environmentSuffix}`, {
      bucket: this.internalBucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      }],
    }, { parent: this });

    // Enable access logging on internal bucket
    new aws.s3.BucketLoggingV2(`internal-bucket-logging-${environmentSuffix}`, {
      bucket: this.internalBucket.id,
      targetBucket: this.auditBucket.id,
      targetPrefix: 'internal-bucket-logs/',
    }, { parent: this });

    // Add lifecycle rule for internal bucket
    new aws.s3.BucketLifecycleConfigurationV2(`internal-bucket-lifecycle-${environmentSuffix}`, {
      bucket: this.internalBucket.id,
      rules: [{
        id: 'glacier-transition',
        status: 'Enabled',
        transitions: [{
          days: 90,
          storageClass: 'GLACIER',
        }],
      }],
    }, { parent: this });

    // Create confidential bucket
    this.confidentialBucket = new aws.s3.BucketV2(`confidential-bucket-${environmentSuffix}`, {
      bucket: `confidential-data-${environmentSuffix}`,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        DataClassification: 'confidential',
      })),
    }, { parent: this });

    // Enable versioning on confidential bucket with MFA delete
    new aws.s3.BucketVersioningV2(`confidential-bucket-versioning-${environmentSuffix}`, {
      bucket: this.confidentialBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
        mfaDelete: 'Enabled',
      },
    }, { parent: this });

    // Block public access on confidential bucket
    new aws.s3.BucketPublicAccessBlock(`confidential-bucket-public-access-${environmentSuffix}`, {
      bucket: this.confidentialBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // Enable server-side encryption with KMS on confidential bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(`confidential-bucket-encryption-${environmentSuffix}`, {
      bucket: this.confidentialBucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'aws:kms',
          kmsMasterKeyId: kmsKey.id,
        },
      }],
    }, { parent: this });

    // Enable access logging on confidential bucket
    new aws.s3.BucketLoggingV2(`confidential-bucket-logging-${environmentSuffix}`, {
      bucket: this.confidentialBucket.id,
      targetBucket: this.auditBucket.id,
      targetPrefix: 'confidential-bucket-logs/',
    }, { parent: this });

    // Add lifecycle rule for confidential bucket
    new aws.s3.BucketLifecycleConfigurationV2(`confidential-bucket-lifecycle-${environmentSuffix}`, {
      bucket: this.confidentialBucket.id,
      rules: [{
        id: 'glacier-transition',
        status: 'Enabled',
        transitions: [{
          days: 90,
          storageClass: 'GLACIER',
        }],
      }],
    }, { parent: this });

    this.registerOutputs({
      auditBucketName: this.auditBucket.id,
      publicBucketName: this.publicBucket.id,
      internalBucketName: this.internalBucket.id,
      confidentialBucketName: this.confidentialBucket.id,
    });
  }
}
```

## File: lib/bucket-policies.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BucketPoliciesArgs {
  environmentSuffix: string;
  publicBucket: aws.s3.BucketV2;
  internalBucket: aws.s3.BucketV2;
  confidentialBucket: aws.s3.BucketV2;
}

export class BucketPolicies extends pulumi.ComponentResource {
  constructor(name: string, args: BucketPoliciesArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:s3:BucketPolicies', name, {}, opts);

    const { environmentSuffix, publicBucket, internalBucket, confidentialBucket } = args;

    // Public bucket policy - enforce HTTPS
    const publicBucketPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [{
        sid: 'DenyInsecureTransport',
        effect: 'Deny',
        principals: [{
          type: '*',
          identifiers: ['*'],
        }],
        actions: ['s3:*'],
        resources: [
          publicBucket.arn,
          pulumi.interpolate`${publicBucket.arn}/*`,
        ],
        conditions: [{
          test: 'Bool',
          variable: 'aws:SecureTransport',
          values: ['false'],
        }],
      }],
    });

    new aws.s3.BucketPolicy(`public-bucket-policy-${environmentSuffix}`, {
      bucket: publicBucket.id,
      policy: publicBucketPolicyDoc.json,
    }, { parent: this });

    // Internal bucket policy - enforce HTTPS
    const internalBucketPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [{
        sid: 'DenyInsecureTransport',
        effect: 'Deny',
        principals: [{
          type: '*',
          identifiers: ['*'],
        }],
        actions: ['s3:*'],
        resources: [
          internalBucket.arn,
          pulumi.interpolate`${internalBucket.arn}/*`,
        ],
        conditions: [{
          test: 'Bool',
          variable: 'aws:SecureTransport',
          values: ['false'],
        }],
      }],
    });

    new aws.s3.BucketPolicy(`internal-bucket-policy-${environmentSuffix}`, {
      bucket: internalBucket.id,
      policy: internalBucketPolicyDoc.json,
    }, { parent: this });

    // Confidential bucket policy - enforce HTTPS and add cross-account access
    const confidentialBucketPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          sid: 'DenyInsecureTransport',
          effect: 'Deny',
          principals: [{
            type: '*',
            identifiers: ['*'],
          }],
          actions: ['s3:*'],
          resources: [
            confidentialBucket.arn,
            pulumi.interpolate`${confidentialBucket.arn}/*`,
          ],
          conditions: [{
            test: 'Bool',
            variable: 'aws:SecureTransport',
            values: ['false'],
          }],
        },
        {
          sid: 'AllowCrossAccountAuditorAccess',
          effect: 'Allow',
          principals: [{
            type: 'AWS',
            identifiers: ['arn:aws:iam::123456789012:role/AuditorRole'],
          }],
          actions: [
            's3:GetObject',
            's3:ListBucket',
          ],
          resources: [
            confidentialBucket.arn,
            pulumi.interpolate`${confidentialBucket.arn}/*`,
          ],
        },
      ],
    });

    new aws.s3.BucketPolicy(`confidential-bucket-policy-${environmentSuffix}`, {
      bucket: confidentialBucket.id,
      policy: confidentialBucketPolicyDoc.json,
    }, { parent: this });

    this.registerOutputs({});
  }
}
```

## File: lib/iam-roles.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamRolesArgs {
  environmentSuffix: string;
  publicBucket: aws.s3.BucketV2;
  internalBucket: aws.s3.BucketV2;
  confidentialBucket: aws.s3.BucketV2;
  kmsKey: aws.kms.Key;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class IamRoles extends pulumi.ComponentResource {
  public readonly developerRole: aws.iam.Role;
  public readonly analystRole: aws.iam.Role;
  public readonly adminRole: aws.iam.Role;

  constructor(name: string, args: IamRolesArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:iam:IamRoles', name, {}, opts);

    const { environmentSuffix, publicBucket, internalBucket, confidentialBucket, kmsKey, tags } = args;

    // Get current AWS account ID
    const currentAccount = aws.getCallerIdentityOutput();

    // Assume role policy document for all roles
    const assumeRolePolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [{
        effect: 'Allow',
        principals: [{
          type: 'AWS',
          identifiers: [currentAccount.accountId.apply(id => `arn:aws:iam::${id}:root`)],
        }],
        actions: ['sts:AssumeRole'],
      }],
    });

    // Developer Role - Read-only access to public and internal buckets
    this.developerRole = new aws.iam.Role(`developer-role-${environmentSuffix}`, {
      name: `developer-role-${environmentSuffix}`,
      assumeRolePolicy: assumeRolePolicyDoc.json,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        RoleType: 'developer',
      })),
    }, { parent: this });

    const developerPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          sid: 'ReadPublicBucket',
          effect: 'Allow',
          actions: [
            's3:GetObject',
            's3:ListBucket',
          ],
          resources: [
            publicBucket.arn,
            pulumi.interpolate`${publicBucket.arn}/*`,
          ],
        },
        {
          sid: 'ReadInternalBucket',
          effect: 'Allow',
          actions: [
            's3:GetObject',
            's3:ListBucket',
          ],
          resources: [
            internalBucket.arn,
            pulumi.interpolate`${internalBucket.arn}/*`,
          ],
        },
      ],
    });

    new aws.iam.RolePolicy(`developer-policy-${environmentSuffix}`, {
      role: this.developerRole.id,
      policy: developerPolicyDoc.json,
    }, { parent: this });

    // Analyst Role - Read/write to internal, read-only to confidential
    this.analystRole = new aws.iam.Role(`analyst-role-${environmentSuffix}`, {
      name: `analyst-role-${environmentSuffix}`,
      assumeRolePolicy: assumeRolePolicyDoc.json,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        RoleType: 'analyst',
      })),
    }, { parent: this });

    const analystPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          sid: 'ReadWriteInternalBucket',
          effect: 'Allow',
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          resources: [
            internalBucket.arn,
            pulumi.interpolate`${internalBucket.arn}/*`,
          ],
        },
        {
          sid: 'ReadConfidentialBucket',
          effect: 'Allow',
          actions: [
            's3:GetObject',
            's3:ListBucket',
          ],
          resources: [
            confidentialBucket.arn,
            pulumi.interpolate`${confidentialBucket.arn}/*`,
          ],
        },
        {
          sid: 'UseKmsKey',
          effect: 'Allow',
          actions: [
            'kms:Decrypt',
            'kms:DescribeKey',
          ],
          resources: [kmsKey.arn],
        },
      ],
    });

    new aws.iam.RolePolicy(`analyst-policy-${environmentSuffix}`, {
      role: this.analystRole.id,
      policy: analystPolicyDoc.json,
    }, { parent: this });

    // Admin Role - Full access to all buckets
    this.adminRole = new aws.iam.Role(`admin-role-${environmentSuffix}`, {
      name: `admin-role-${environmentSuffix}`,
      assumeRolePolicy: assumeRolePolicyDoc.json,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        RoleType: 'admin',
      })),
    }, { parent: this });

    const adminPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          sid: 'FullAccessAllBuckets',
          effect: 'Allow',
          actions: ['s3:*'],
          resources: [
            publicBucket.arn,
            pulumi.interpolate`${publicBucket.arn}/*`,
            internalBucket.arn,
            pulumi.interpolate`${internalBucket.arn}/*`,
            confidentialBucket.arn,
            pulumi.interpolate`${confidentialBucket.arn}/*`,
          ],
        },
        {
          sid: 'ManageBucketPolicies',
          effect: 'Allow',
          actions: [
            's3:PutBucketPolicy',
            's3:GetBucketPolicy',
            's3:DeleteBucketPolicy',
          ],
          resources: [
            publicBucket.arn,
            internalBucket.arn,
            confidentialBucket.arn,
          ],
        },
        {
          sid: 'FullKmsAccess',
          effect: 'Allow',
          actions: ['kms:*'],
          resources: [kmsKey.arn],
        },
      ],
    });

    new aws.iam.RolePolicy(`admin-policy-${environmentSuffix}`, {
      role: this.adminRole.id,
      policy: adminPolicyDoc.json,
    }, { parent: this });

    this.registerOutputs({
      developerRoleArn: this.developerRole.arn,
      analystRoleArn: this.analystRole.arn,
      adminRoleArn: this.adminRole.arn,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { S3Buckets } from './s3-buckets';
import { BucketPolicies } from './bucket-policies';
import { IamRoles } from './iam-roles';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly developerRoleArn: pulumi.Output<string>;
  public readonly analystRoleArn: pulumi.Output<string>;
  public readonly adminRoleArn: pulumi.Output<string>;
  public readonly publicBucketName: pulumi.Output<string>;
  public readonly internalBucketName: pulumi.Output<string>;
  public readonly confidentialBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create KMS key for confidential bucket encryption
    const kmsKey = new aws.kms.Key(`confidential-kms-key-${environmentSuffix}`, {
      description: `KMS key for confidential bucket encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Purpose: 'confidential-bucket-encryption',
      })),
    }, { parent: this });

    new aws.kms.Alias(`confidential-kms-alias-${environmentSuffix}`, {
      name: `alias/confidential-bucket-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    }, { parent: this });

    // Create S3 buckets
    const s3Buckets = new S3Buckets('s3-buckets', {
      environmentSuffix,
      kmsKey,
      tags,
    }, { parent: this });

    // Create bucket policies
    new BucketPolicies('bucket-policies', {
      environmentSuffix,
      publicBucket: s3Buckets.publicBucket,
      internalBucket: s3Buckets.internalBucket,
      confidentialBucket: s3Buckets.confidentialBucket,
    }, { parent: this });

    // Create IAM roles
    const iamRoles = new IamRoles('iam-roles', {
      environmentSuffix,
      publicBucket: s3Buckets.publicBucket,
      internalBucket: s3Buckets.internalBucket,
      confidentialBucket: s3Buckets.confidentialBucket,
      kmsKey,
      tags,
    }, { parent: this });

    // Set outputs
    this.developerRoleArn = iamRoles.developerRole.arn;
    this.analystRoleArn = iamRoles.analystRole.arn;
    this.adminRoleArn = iamRoles.adminRole.arn;
    this.publicBucketName = s3Buckets.publicBucket.id;
    this.internalBucketName = s3Buckets.internalBucket.id;
    this.confidentialBucketName = s3Buckets.confidentialBucket.id;

    this.registerOutputs({
      developerRoleArn: this.developerRoleArn,
      analystRoleArn: this.analystRoleArn,
      adminRoleArn: this.adminRoleArn,
      publicBucketName: this.publicBucketName,
      internalBucketName: this.internalBucketName,
      confidentialBucketName: this.confidentialBucketName,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Team: 'security',
};

const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

export const developerRoleArn = stack.developerRoleArn;
export const analystRoleArn = stack.analystRoleArn;
export const adminRoleArn = stack.adminRoleArn;
export const publicBucketName = stack.publicBucketName;
export const internalBucketName = stack.internalBucketName;
export const confidentialBucketName = stack.confidentialBucketName;
```

## Implementation Notes

This implementation provides:

1. **Three S3 buckets** with proper classification (public, internal, confidential)
2. **KMS encryption** for the confidential bucket with key rotation enabled
3. **Three IAM roles** (developer, analyst, admin) with appropriate permissions
4. **Least-privilege access** using specific S3 actions in IAM policies
5. **Audit logging** to a dedicated audit bucket for all three data buckets
6. **HTTPS-only enforcement** via bucket policies
7. **Cross-account access** for auditor role from account 123456789012
8. **Comprehensive tagging** with Environment, Team, and DataClassification
9. **Versioning enabled** on all buckets
10. **Lifecycle rules** transitioning objects to Glacier after 90 days
11. **MFA delete protection** on confidential bucket
12. **Public access blocks** on all buckets
13. **Component architecture** separating S3, IAM, and policy concerns
14. **All IAM policies** using getPolicyDocument instead of inline JSON
15. **Environment suffix** usage throughout for resource naming