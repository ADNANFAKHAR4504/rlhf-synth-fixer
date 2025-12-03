# S3 Storage Optimization - Initial Implementation

This implementation creates an S3 bucket with intelligent tiering and lifecycle management for video content optimization.

## File: lib/s3-stack.ts

```typescript
/**
 * s3-stack.ts
 *
 * S3 Storage Stack for video content optimization with intelligent tiering
 * and lifecycle management.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3StackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(name: string, args: S3StackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    const defaultTags = {
      Environment: args.environmentSuffix,
      Project: 'VideoStorage',
      CostCenter: 'Media',
      ...args.tags,
    };

    // Create S3 bucket with intelligent tiering
    const bucket = new aws.s3.Bucket(`video-bucket-${args.environmentSuffix}`, {
      bucket: `video-bucket-${args.environmentSuffix}`,
      tags: defaultTags,

      // Enable versioning
      versioning: {
        enabled: true,
      },

      // Force delete even with objects
      forceDestroy: true,

      // Server-side encryption
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },

      // Lifecycle rules
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          enabled: true,
          transitions: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              days: 90,
              storageClass: 'GLACIER_IR',
            },
          ],
        },
        {
          id: 'cleanup-multipart-uploads',
          enabled: true,
          abortIncompleteMultipartUploadDays: 7,
        },
        {
          id: 'cleanup-old-versions',
          enabled: true,
          noncurrentVersionExpiration: {
            days: 60,
          },
        },
      ],
    }, { parent: this });

    // Block all public access
    const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `video-bucket-pab-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Configure intelligent tiering
    const intelligentTieringConfig = new aws.s3.BucketIntelligentTieringConfiguration(
      `video-bucket-tiering-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        name: 'EntireBucket',
        status: 'Enabled',
        tierings: [
          {
            accessTier: 'ARCHIVE_ACCESS',
            days: 90,
          },
          {
            accessTier: 'DEEP_ARCHIVE_ACCESS',
            days: 180,
          },
        ],
      },
      { parent: this }
    );

    // CloudWatch metric for bucket size
    const sizeMetric = new aws.cloudwatch.MetricAlarm(
      `video-bucket-size-${args.environmentSuffix}`,
      {
        name: `video-bucket-size-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'BucketSizeBytes',
        namespace: 'AWS/S3',
        period: 86400,
        statistic: 'Average',
        threshold: 1000000000000, // 1TB
        dimensions: {
          BucketName: bucket.id,
          StorageType: 'StandardStorage',
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // CloudWatch metric for object count
    const objectCountMetric = new aws.cloudwatch.MetricAlarm(
      `video-bucket-objects-${args.environmentSuffix}`,
      {
        name: `video-bucket-objects-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'NumberOfObjects',
        namespace: 'AWS/S3',
        period: 86400,
        statistic: 'Average',
        threshold: 100000,
        dimensions: {
          BucketName: bucket.id,
          StorageType: 'AllStorageTypes',
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    this.bucketName = bucket.id;
    this.bucketArn = bucket.arn;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { S3Stack } from './s3-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create S3 Stack for video storage optimization
    const s3Stack = new S3Stack('tap-s3', {
      environmentSuffix: environmentSuffix,
      tags: tags as { [key: string]: string },
    }, { parent: this });

    this.bucketName = s3Stack.bucketName;
    this.bucketArn = s3Stack.bucketArn;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
  tags: {
    ManagedBy: 'Pulumi',
    Environment: environmentSuffix,
  },
});

export const bucketName = stack.bucketName;
export const bucketArn = stack.bucketArn;
```