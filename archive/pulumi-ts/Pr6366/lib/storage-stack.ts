/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * storage-stack.ts
 * 
 * This module defines storage resources including DynamoDB table and S3 bucket
 * for the payment processing environment.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface StorageStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  kmsKeyArn: pulumi.Input<string>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly dynamoTable: aws.dynamodb.Table;
  public readonly auditBucket: aws.s3.Bucket;

  constructor(
    name: string,
    args: StorageStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:storage:StorageStack', name, args, opts);

    const { environmentSuffix, tags, kmsKeyArn } = args;

    // Get the current AWS region dynamically
    const currentRegion = aws.getRegionOutput({}, opts);

    // Create DynamoDB table for transactions
    this.dynamoTable = new aws.dynamodb.Table(
      `transactions-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'transactionId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKeyArn,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `transactions-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // CRITICAL FIX: Use region-specific bucket name to avoid conflicts
    // This prevents collision with existing buckets in other regions
    this.auditBucket = new aws.s3.Bucket(
      `payment-audit-logs-${environmentSuffix}`,
      {
        // Add region to bucket name for uniqueness across regions
        bucket: pulumi.interpolate`payment-audit-logs-${currentRegion.name}-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'archive-old-logs',
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: pulumi.interpolate`payment-audit-logs-${currentRegion.name}-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Block all public access to audit bucket
    new aws.s3.BucketPublicAccessBlock(
      `payment-audit-logs-public-block-${environmentSuffix}`,
      {
        bucket: this.auditBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.registerOutputs({
      dynamoTableName: this.dynamoTable.name,
      dynamoTableArn: this.dynamoTable.arn,
      auditBucketName: this.auditBucket.bucket,
      auditBucketArn: this.auditBucket.arn,
    });
  }
}
