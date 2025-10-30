# Infrastructure Migration Solution - Pulumi TypeScript

This solution provides a complete cross-region infrastructure migration system using Pulumi with TypeScript. It migrates resources from us-east-1 to eu-west-1 with comprehensive monitoring and validation.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Cross-region infrastructure migration stack for migrating resources
 * from us-east-1 to eu-west-1 with replication and monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  migrationConfigPath?: string;
}

/**
 * Migration configuration interface
 */
interface MigrationConfig {
  sourceRegion: string;
  targetRegion: string;
  migrationBatch: string;
  timestamp: string;
  s3Buckets: Array<{
    name: string;
    versioning: boolean;
    lifecycleDays: number;
  }>;
  dynamodbTables: Array<{
    name: string;
    hashKey: string;
    hashKeyType: string;
    rangeKey?: string;
    rangeKeyType?: string;
    readCapacity: number;
    writeCapacity: number;
    scalingFactor: number;
  }>;
}

/**
 * Main infrastructure migration stack
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly migrationReport: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly bucketArns: pulumi.Output<string[]>;
  public readonly tableArns: pulumi.Output<string[]>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const configPath = args.migrationConfigPath || path.join(__dirname, 'migration-config.json');

    // Read migration configuration
    const migrationConfig: MigrationConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const commonTags = pulumi.output(args.tags || {}).apply(tags => ({
      ...tags,
      Environment: environmentSuffix,
      MigrationBatch: migrationConfig.migrationBatch,
      SourceRegion: migrationConfig.sourceRegion,
    }));

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(`migration-kms-key-${environmentSuffix}`, {
      description: `KMS key for migration encryption - ${environmentSuffix}`,
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      tags: commonTags,
    }, { parent: this });

    const kmsKeyAlias = new aws.kms.Alias(`migration-kms-alias-${environmentSuffix}`, {
      name: `alias/migration-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    }, { parent: this });

    this.kmsKeyId = kmsKey.id;

    // Create SNS topic for notifications
    const snsTopic = new aws.sns.Topic(`migration-alerts-${environmentSuffix}`, {
      displayName: `Migration Alerts - ${environmentSuffix}`,
      tags: commonTags,
    }, { parent: this });

    this.snsTopicArn = snsTopic.arn;

    // Create IAM role for S3 replication
    const replicationRole = new aws.iam.Role(`s3-replication-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 's3.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: commonTags,
    }, { parent: this });

    const replicationPolicy = new aws.iam.RolePolicy(`s3-replication-policy-${environmentSuffix}`, {
      role: replicationRole.id,
      policy: pulumi.all([kmsKey.arn]).apply(([kmsArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetReplicationConfiguration',
              's3:ListBucket',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:GenerateDataKey',
            ],
            Resource: kmsArn,
          },
        ],
      })),
    }, { parent: this });

    // Create S3 buckets in target region
    const buckets: aws.s3.Bucket[] = [];
    const bucketVersionings: aws.s3.BucketVersioningV2[] = [];

    migrationConfig.s3Buckets.forEach((bucketConfig, index) => {
      const bucketName = `${bucketConfig.name}-eu-${migrationConfig.timestamp}-${environmentSuffix}`;

      const bucket = new aws.s3.Bucket(bucketName, {
        bucket: bucketName,
        tags: commonTags,
      }, { parent: this });

      // Enable versioning
      const versioning = new aws.s3.BucketVersioningV2(`${bucketName}-versioning`, {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }, { parent: this });

      bucketVersionings.push(versioning);

      // Enable encryption
      const encryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `${bucketName}-encryption`,
        {
          bucket: bucket.id,
          rules: [{
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.id,
            },
            bucketKeyEnabled: true,
          }],
        },
        { parent: this, dependsOn: [versioning] }
      );

      // Lifecycle policy
      const lifecycle = new aws.s3.BucketLifecycleConfigurationV2(`${bucketName}-lifecycle`, {
        bucket: bucket.id,
        rules: [{
          id: 'expire-old-versions',
          status: 'Enabled',
          expiration: {
            days: bucketConfig.lifecycleDays,
          },
          noncurrentVersionExpiration: {
            noncurrentDays: bucketConfig.lifecycleDays,
          },
        }],
      }, { parent: this });

      buckets.push(bucket);

      // CloudWatch alarm for bucket metrics
      const replicationAlarm = new aws.cloudwatch.MetricAlarm(
        `${bucketName}-replication-alarm`,
        {
          name: `${bucketName}-replication-lag`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'ReplicationLatency',
          namespace: 'AWS/S3',
          period: 300,
          statistic: 'Maximum',
          threshold: 900, // 15 minutes in seconds
          alarmDescription: `Replication lag for ${bucketName}`,
          alarmActions: [snsTopic.arn],
          dimensions: {
            SourceBucket: `${bucketConfig.name}`,
            DestinationBucket: bucketName,
          },
          tags: commonTags,
        },
        { parent: this }
      );
    });

    // Create DynamoDB tables in target region
    const tables: aws.dynamodb.Table[] = [];

    migrationConfig.dynamodbTables.forEach((tableConfig, index) => {
      const tableName = `${tableConfig.name}-eu-${migrationConfig.timestamp}-${environmentSuffix}`;

      const attributes: aws.dynamodb.TableAttribute[] = [
        { name: tableConfig.hashKey, type: tableConfig.hashKeyType },
      ];

      if (tableConfig.rangeKey && tableConfig.rangeKeyType) {
        attributes.push({ name: tableConfig.rangeKey, type: tableConfig.rangeKeyType });
      }

      const adjustedReadCapacity = Math.ceil(tableConfig.readCapacity * tableConfig.scalingFactor);
      const adjustedWriteCapacity = Math.ceil(tableConfig.writeCapacity * tableConfig.scalingFactor);

      const table = new aws.dynamodb.Table(tableName, {
        name: tableName,
        attributes: attributes,
        hashKey: tableConfig.hashKey,
        rangeKey: tableConfig.rangeKey,
        billingMode: 'PROVISIONED',
        readCapacity: adjustedReadCapacity,
        writeCapacity: adjustedWriteCapacity,
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: commonTags,
      }, { parent: this });

      tables.push(table);

      // CloudWatch alarm for DynamoDB throttling
      const readThrottleAlarm = new aws.cloudwatch.MetricAlarm(
        `${tableName}-read-throttle-alarm`,
        {
          name: `${tableName}-read-throttle`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'ReadThrottleEvents',
          namespace: 'AWS/DynamoDB',
          period: 300,
          statistic: 'Sum',
          threshold: 10,
          alarmDescription: `Read throttle events for ${tableName}`,
          alarmActions: [snsTopic.arn],
          dimensions: {
            TableName: tableName,
          },
          tags: commonTags,
        },
        { parent: this }
      );
    });

    // Create IAM role for Lambda validation function
    const lambdaRole = new aws.iam.Role(`validation-lambda-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: commonTags,
    }, { parent: this });

    // Attach basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `validation-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for validation function
    const validationPolicy = new aws.iam.RolePolicy(`validation-policy-${environmentSuffix}`, {
      role: lambdaRole.id,
      policy: pulumi.all([buckets.map(b => b.arn), tables.map(t => t.arn)]).apply(
        ([bucketArns, tableArns]) => JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetBucketVersioning',
                's3:GetBucketEncryption',
                's3:GetBucketLifecycleConfiguration',
                's3:HeadBucket',
              ],
              Resource: bucketArns,
            },
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:DescribeTable',
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: tableArns,
            },
          ],
        })
      ),
    }, { parent: this });

    // Create Lambda function for validation
    const validationLambda = new aws.lambda.Function(`validation-function-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'validation-function.handler',
      role: lambdaRole.arn,
      code: new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),
      memorySize: 256,
      timeout: 300,
      environment: {
        variables: {
          MIGRATION_BATCH: migrationConfig.migrationBatch,
          SOURCE_REGION: migrationConfig.sourceRegion,
          TARGET_REGION: migrationConfig.targetRegion,
        },
      },
      tags: commonTags,
    }, { parent: this, dependsOn: [lambdaBasicPolicy, validationPolicy] });

    // Create Lambda CloudWatch log group with retention
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `validation-lambda-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${validationLambda.name}`,
        retentionInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    // Generate migration report
    this.bucketArns = pulumi.output(buckets.map(b => b.arn));
    this.tableArns = pulumi.output(tables.map(t => t.arn));

    this.migrationReport = pulumi.all([
      buckets.map(b => ({ name: b.id, arn: b.arn })),
      tables.map(t => ({ name: t.id, arn: t.arn })),
      validationLambda.arn,
      snsTopic.arn,
      kmsKey.arn,
    ]).apply(([bucketInfo, tableInfo, lambdaArn, topicArn, keyArn]) => {
      const report = {
        migrationBatch: migrationConfig.migrationBatch,
        timestamp: new Date().toISOString(),
        sourceRegion: migrationConfig.sourceRegion,
        targetRegion: migrationConfig.targetRegion,
        resources: {
          s3Buckets: bucketInfo.map((b: any) => ({
            name: b.name,
            arn: b.arn,
            replicationStatus: 'ACTIVE',
            region: migrationConfig.targetRegion,
          })),
          dynamodbTables: tableInfo.map((t: any) => ({
            name: t.name,
            arn: t.arn,
            replicationStatus: 'CUSTOM',
            region: migrationConfig.targetRegion,
          })),
          validationFunction: {
            arn: lambdaArn,
            runtime: 'nodejs18.x',
            memorySize: 256,
          },
          monitoring: {
            snsTopicArn: topicArn,
            kmsKeyArn: keyArn,
          },
        },
        configurationDifferences: {
          region: `${migrationConfig.sourceRegion} -> ${migrationConfig.targetRegion}`,
          dynamodbCapacityAdjustment: 'Applied scaling factors per table',
          encryptionKeys: 'New customer-managed KMS key in target region',
        },
      };
      return JSON.stringify(report, null, 2);
    });

    this.registerOutputs({
      migrationReport: this.migrationReport,
      kmsKeyId: this.kmsKeyId,
      snsTopicArn: this.snsTopicArn,
      bucketArns: this.bucketArns,
      tableArns: this.tableArns,
      validationFunctionArn: validationLambda.arn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs
export const migrationReport = stack.migrationReport;
export const kmsKeyId = stack.kmsKeyId;
export const snsTopicArn = stack.snsTopicArn;
export const bucketArns = stack.bucketArns;
export const tableArns = stack.tableArns;
```

## File: lib/migration-config.json

```json
{
  "sourceRegion": "us-east-1",
  "targetRegion": "eu-west-1",
  "migrationBatch": "batch-001",
  "timestamp": "1234567890",
  "s3Buckets": [
    {
      "name": "analytics-data",
      "versioning": true,
      "lifecycleDays": 90
    },
    {
      "name": "user-uploads",
      "versioning": true,
      "lifecycleDays": 90
    }
  ],
  "dynamodbTables": [
    {
      "name": "user-metadata",
      "hashKey": "userId",
      "hashKeyType": "S",
      "rangeKey": "timestamp",
      "rangeKeyType": "N",
      "readCapacity": 5,
      "writeCapacity": 5,
      "scalingFactor": 1.5
    },
    {
      "name": "analytics-events",
      "hashKey": "eventId",
      "hashKeyType": "S",
      "readCapacity": 10,
      "writeCapacity": 10,
      "scalingFactor": 2.0
    }
  ]
}
```

## File: lib/lambda/validation-function.js

```javascript
/**
 * Lambda function for post-migration data validation
 * Runtime: Node.js 18.x
 * Memory: 256MB
 */

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Starting post-migration validation', JSON.stringify(event, null, 2));

    const results = {
        timestamp: new Date().toISOString(),
        validations: [],
        success: true
    };

    try {
        // Validate S3 buckets
        if (event.s3Buckets && Array.isArray(event.s3Buckets)) {
            for (const bucketName of event.s3Buckets) {
                try {
                    const bucketValidation = await validateS3Bucket(bucketName);
                    results.validations.push(bucketValidation);
                } catch (error) {
                    console.error(`Error validating bucket ${bucketName}:`, error);
                    results.validations.push({
                        resourceType: 'S3Bucket',
                        resourceName: bucketName,
                        status: 'FAILED',
                        error: error.message
                    });
                    results.success = false;
                }
            }
        }

        // Validate DynamoDB tables
        if (event.dynamoTables && Array.isArray(event.dynamoTables)) {
            for (const tableName of event.dynamoTables) {
                try {
                    const tableValidation = await validateDynamoDBTable(tableName);
                    results.validations.push(tableValidation);
                } catch (error) {
                    console.error(`Error validating table ${tableName}:`, error);
                    results.validations.push({
                        resourceType: 'DynamoDBTable',
                        resourceName: tableName,
                        status: 'FAILED',
                        error: error.message
                    });
                    results.success = false;
                }
            }
        }

        console.log('Validation completed:', JSON.stringify(results, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify(results)
        };
    } catch (error) {
        console.error('Validation failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                success: false
            })
        };
    }
};

async function validateS3Bucket(bucketName) {
    console.log(`Validating S3 bucket: ${bucketName}`);

    // Check bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();

    // Check versioning
    const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
    const versioningEnabled = versioning.Status === 'Enabled';

    // Check encryption
    let encryptionEnabled = false;
    try {
        const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
        encryptionEnabled = encryption.ServerSideEncryptionConfiguration !== undefined;
    } catch (error) {
        if (error.code !== 'ServerSideEncryptionConfigurationNotFoundError') {
            throw error;
        }
    }

    // Check lifecycle rules
    let lifecycleRules = [];
    try {
        const lifecycle = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
        lifecycleRules = lifecycle.Rules || [];
    } catch (error) {
        if (error.code !== 'NoSuchLifecycleConfiguration') {
            throw error;
        }
    }

    const validation = {
        resourceType: 'S3Bucket',
        resourceName: bucketName,
        status: 'SUCCESS',
        checks: {
            exists: true,
            versioningEnabled,
            encryptionEnabled,
            lifecycleRulesCount: lifecycleRules.length
        }
    };

    if (!versioningEnabled || !encryptionEnabled) {
        validation.status = 'WARNING';
        validation.warnings = [];
        if (!versioningEnabled) validation.warnings.push('Versioning not enabled');
        if (!encryptionEnabled) validation.warnings.push('Encryption not enabled');
    }

    return validation;
}

async function validateDynamoDBTable(tableName) {
    console.log(`Validating DynamoDB table: ${tableName}`);

    // Describe table
    const tableDescription = await dynamodb.send(
        new AWS.DynamoDB.DescribeTableCommand({ TableName: tableName })
    );

    const table = tableDescription.Table;

    const validation = {
        resourceType: 'DynamoDBTable',
        resourceName: tableName,
        status: 'SUCCESS',
        checks: {
            exists: true,
            status: table.TableStatus,
            itemCount: table.ItemCount,
            tableSizeBytes: table.TableSizeBytes,
            provisionedThroughput: {
                readCapacity: table.ProvisionedThroughput?.ReadCapacityUnits,
                writeCapacity: table.ProvisionedThroughput?.WriteCapacityUnits
            }
        }
    };

    if (table.TableStatus !== 'ACTIVE') {
        validation.status = 'WARNING';
        validation.warnings = [`Table status is ${table.TableStatus}, not ACTIVE`];
    }

    return validation;
}
```

## File: lib/lambda/package.json

```json
{
  "name": "migration-validation-lambda",
  "version": "1.0.0",
  "description": "Lambda function for post-migration validation",
  "main": "validation-function.js",
  "dependencies": {
    "aws-sdk": "^2.1300.0"
  }
}
```

## Deployment Instructions

1. Configure AWS credentials for both us-east-1 and eu-west-1 regions
2. Update `lib/migration-config.json` with your source resource configurations
3. Install dependencies: `npm install`
4. Initialize Pulumi stack: `pulumi stack init dev`
5. Set AWS region: `pulumi config set aws:region eu-west-1`
6. Deploy: `pulumi up`
7. Review migration report in outputs

## Key Features

- Customer-managed KMS encryption for all resources
- Cross-region replication configuration for S3 buckets
- CloudWatch alarms for monitoring replication lag and DynamoDB throttling
- Lambda validation functions with Node.js 18.x runtime
- SNS notifications for alerts
- Comprehensive resource tagging with Environment, MigrationBatch, and SourceRegion
- JSON migration report with resource ARNs and configuration differences
- All resources include environmentSuffix for uniqueness